import Database from '@tauri-apps/plugin-sql';
import splitText from './recursive-splitter';
import { embed, generateSummary } from './aifuncs.js';
import { parseForTags, parseForLinks } from './parsefuncs.js';

let db_conn = null;

export async function getDB() {
    if (db_conn !== null) {
        return db_conn;
    }
    const db = await Database.load('sqlite:orbitalnotes.db');
    await db.execute(`PRAGMA foreign_keys = ON;`);
    await db.execute(`PRAGMA journal_mode = WAL;`);
    const rows = await db.select(`PRAGMA integrity_check;`);
    console.log("integrity_check →", rows[0]);
    db_conn = db;
    return db_conn;
}

export async function initDB() {
  const db = await getDB();

  // -------------------------------------------------
  // Tables
  // -------------------------------------------------
  await db.execute(`
    CREATE TABLE IF NOT EXISTS notes (
      note_id          INTEGER PRIMARY KEY AUTOINCREMENT,
      note_title       TEXT,
      note_content     TEXT,
      note_summary     TEXT,
      note_created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      note_updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS note_chunks (
      note_chunk_id     INTEGER PRIMARY KEY AUTOINCREMENT,
      note_id           INTEGER REFERENCES notes(note_id) ON DELETE CASCADE,
      note_chunk_index  INTEGER,
      note_chunk_content TEXT
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS note_embeddings (
      note_embedding_id   INTEGER PRIMARY KEY AUTOINCREMENT,
      note_id             INTEGER REFERENCES notes(note_id) ON DELETE CASCADE,
      note_chunk_id       INTEGER REFERENCES note_chunks(note_chunk_id) ON DELETE CASCADE,
      note_embedding      TEXT
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS note_summary_embeddings (
      note_id               INTEGER PRIMARY KEY REFERENCES notes(note_id) ON DELETE CASCADE,
      note_summary_embedding TEXT
    );
  `);

  await db.execute(`CREATE TABLE IF NOT EXISTS note_links (
      from_note_id INTEGER REFERENCES notes(note_id) ON DELETE CASCADE,
      to_note_id   INTEGER REFERENCES notes(note_id) ON DELETE CASCADE
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS tags (
      tag_id INTEGER PRIMARY KEY AUTOINCREMENT,
      tag_name TEXT
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS note_tags (
      note_id INTEGER REFERENCES notes(note_id) ON DELETE CASCADE,
      tag_id INTEGER REFERENCES tags(tag_id) ON DELETE CASCADE
    );
  `);

  // -------------------------------------------------
  // FTS5 virtual tables (external-content)
  // -------------------------------------------------
  const ftsDefs = {
    note_fts_unicode: "tokenize = 'unicode61'",
    note_fts_porter:  "tokenize = 'porter'",
    note_fts_trigram: "tokenize = 'trigram'"
  };

  for (const [name, tokenizer] of Object.entries(ftsDefs)) {
    await db.execute(`
      CREATE VIRTUAL TABLE IF NOT EXISTS ${name}
        USING fts5(
          note_content,
          content='notes',
          content_rowid='note_id',
          ${tokenizer}
        );
    `);
  }

  // -------------------------------------------------
  // Triggers (safe pattern for external-content FTS5)
  // -------------------------------------------------
  for (const fts of Object.keys(ftsDefs)) {
    // after INSERT on notes
    await db.execute(`
      CREATE TRIGGER IF NOT EXISTS ${fts}_ai
      AFTER INSERT ON notes BEGIN
        INSERT INTO ${fts}(rowid, note_content)
        VALUES (new.note_id, new.note_content);
      END;
    `);

    // after DELETE on notes
    await db.execute(`
      CREATE TRIGGER IF NOT EXISTS ${fts}_ad
      AFTER DELETE ON notes BEGIN
        INSERT INTO ${fts}(${fts}, rowid, note_content)
        VALUES ('delete', old.note_id, old.note_content);
      END;
    `);

    // after UPDATE (note_content)
    await db.execute(`
      CREATE TRIGGER IF NOT EXISTS ${fts}_au
      AFTER UPDATE OF note_content ON notes BEGIN
        -- remove old text
        INSERT INTO ${fts}(${fts}, rowid, note_content)
        VALUES ('delete', old.note_id, old.note_content);
        -- index new text
        INSERT INTO ${fts}(rowid, note_content)
        VALUES (new.note_id, new.note_content);
      END;
    `);
  }

  // -------------------------------------------------
  // (Optional) one-time rebuild if you’re migrating an
  // existing database that was already corrupted.
  // -------------------------------------------------
  // for (const fts of Object.keys(ftsDefs)) {
  //   await db.execute(`INSERT INTO ${fts}(${fts}) VALUES ('rebuild');`);
  // }
}

export async function getTitleId(title) {
    const db = await getDB();
    const rows = await db.select(`SELECT note_id FROM notes WHERE note_title = ?`, [title]);
    return rows[0].note_id;
}

export async function createNote() {

    const db = await getDB();
    const result = await db.execute(
        `
        INSERT INTO notes (note_title, note_content, note_summary)
        VALUES (?, ?, ?)
        `,
        ["", "", ""]
    );
    return result.lastInsertId; // or `result.lastID` depending on your DB client
}

export async function editNote(note_id, title, content) {
  console.log("hi")

  const tags = parseForTags(content);
  const summary_response = await generateSummary(content);
  const summary = summary_response.message.content;
  const links = parseForLinks(content);
  const link_ids = [];
  for (const link of links) {
    const link_id = await getTitleId(link);
    link_ids.push(link_id);
  }
  
  
  const db = await getDB();
  const chunks = splitText(content, 1024, 100);   // or your defaults

    // 1. update the main note
    await db.execute(
      `UPDATE notes
         SET note_title = ?, note_content = ?, note_summary=?, note_updated_at = CURRENT_TIMESTAMP
       WHERE note_id = ?`,
      [title, content, summary, note_id]
    );

    // 2. remove previous chunks → embeddings auto-deleted via ON DELETE CASCADE
    await db.execute(`DELETE FROM note_chunks WHERE note_id = ?`, [note_id]);

    // 3. rebuild chunks + embeddings
    for (let idx = 0; idx < chunks.length; idx++) {
      // insert chunk
      const chunkRes = await db.execute(
        `INSERT INTO note_chunks (note_id, note_chunk_index, note_chunk_content)
         VALUES (?, ?, ?)`,
        [note_id, idx, chunks[idx]]
      );
      const chunk_id = chunkRes.lastInsertId;

      // embed & store vector
      console.log(chunks[idx])
      const vector_response = await embed(chunks[idx]); 
      console.log("embedded")
      const vector = vector_response.embeddings[0];
      console.log(vector)

      await db.execute(
        `INSERT INTO note_embeddings (note_id, note_chunk_id, note_embedding)
         VALUES (?, ?, ?)`,
        [note_id, chunk_id, JSON.stringify(vector)]
      );
    }

    // 4. Save summary + embed it (clearing old summary embedding if needed)
    await db.execute(`DELETE FROM note_summary_embeddings WHERE note_id = ?`, [note_id]);

    const summaryEmbeddingResponse = await embed(summary); // Step 2: Embed summary
    const summaryVector = summaryEmbeddingResponse.embeddings[0];

    await db.execute(
      `INSERT INTO note_summary_embeddings (note_id, note_summary_embedding)
      VALUES (?, ?)`,
      [note_id, JSON.stringify(summaryVector)]
    );

    // 5. Sync tags
    await db.execute(`DELETE FROM note_tags WHERE note_id = ?`, [note_id]); // remove old tags

    for (const tag of tags) {
      // Insert tag if it doesn't exist
      const existing = await db.select(`SELECT tag_id FROM tags WHERE tag_name = ?`, [tag]);

      let tag_id;
      if (existing.length === 0) {
        const res = await db.execute(`INSERT INTO tags (tag_name) VALUES (?)`, [tag]);
        tag_id = res.lastInsertId;
      } else {
        tag_id = existing[0].tag_id;
      }

      // Link tag to note
      await db.execute(`INSERT INTO note_tags (note_id, tag_id) VALUES (?, ?)`, [note_id, tag_id]);
    }
    await db.execute(`SELECT tag_name FROM tags;`);

    //6. Sync links
    await db.execute(`DELETE FROM note_links WHERE from_note_id = ?`, [note_id]);
    for (const id of link_ids) {
      await db.execute(`INSERT INTO note_links (from_note_id, to_note_id) VALUES (?, ?)`, [note_id, id]);
    }
}

export async function getNote(id) {
  const db = await getDB();
  const note = await db.select(
    `SELECT note_id, note_title, note_content, note_created_at, note_updated_at
       FROM notes
      WHERE note_id = ?`,
    [id]
  );
  console.log(note[0])
  return note[0];
}

export async function getAllNoteIds() {
  const db = await getDB();
  const note_ids = await db.select(
    `SELECT note_id FROM notes`
  );
  console.log(note_ids);
  let ids = [];
  for (let i = 0; i < note_ids.length; i++) {
    ids.push(note_ids[i].note_id);
  }
  return ids;
}

export async function deleteNote(id) {
  const db = await getDB();
  await db.execute(`DELETE FROM notes WHERE note_id = ?`, [id]);

  await db.execute(`DELETE FROM tags WHERE tag_id NOT IN (SELECT tag_id FROM note_tags)`);
}

export async function unicodeSearch(query) {
  const db = await getDB();

  const note_ids = await db.select(`
    SELECT rowid FROM note_fts_unicode WHERE note_fts_unicode MATCH ?`,
    [query]
  );
    
  return note_ids.map(row => row.rowid);
}

export async function porterSearch(query) {
  const db = await getDB();

  const note_ids = await db.select(`
    SELECT rowid FROM note_fts_porter WHERE note_fts_porter MATCH ?`,
    [query]
  );
    
  return note_ids.map(row => row.rowid);
}

export async function trigramSearch(query) {
  const db = await getDB();

  const note_ids = await db.select(`
    SELECT rowid FROM note_fts_trigram WHERE note_fts_trigram MATCH ?`,
    [query]
  );
    
  return note_ids.map(row => row.rowid);
}

function cosineSimilarity(vecA, vecB) {
  const dot = vecA.reduce((acc, val, i) => acc + val * vecB[i], 0);
  const normA = Math.sqrt(vecA.reduce((acc, val) => acc + val * val, 0));
  const normB = Math.sqrt(vecB.reduce((acc, val) => acc + val * val, 0));
  return dot / (normA * normB);
}

export async function similaritySearch(query) {
  const db = await getDB();
  const vector_response = await embed(query);
  const query_vector = vector_response.embeddings[0];

  const rows = await db.select(`SELECT note_id, note_embedding FROM note_embeddings`);
  const scored = [];

  for (const row of rows) {
    try {
      const vec = JSON.parse(row.note_embedding);
      if (!Array.isArray(vec) || vec.length !== query_vector.length) continue;
      const score = cosineSimilarity(query_vector, vec);
      scored.push({ note_id: row.note_id, score });
    } catch {
      continue;
    }
  }

  // Filter by threshold
  const SIMILARITY_THRESHOLD = 0.5;
  const topMatches = scored.filter(entry => entry.score >= SIMILARITY_THRESHOLD);
  console.log("✅ Vector matches:", scored);

  // Sort and dedupe
  topMatches.sort((a, b) => b.score - a.score);
  const uniqueNoteIds = [...new Set(topMatches.map(entry => entry.note_id))];

  console.log("✅ Filtered vector matches:", uniqueNoteIds);
  return uniqueNoteIds;
}


export async function search(query) {
  const db = await getDB();

  let note_ids = [];

  note_ids = note_ids.concat(await unicodeSearch(query));
  note_ids = note_ids.concat(await porterSearch(query));
  note_ids = note_ids.concat(await trigramSearch(query));
  note_ids = note_ids.concat(await similaritySearch(query));
    
  console.log(note_ids)
  note_ids = [...new Set(note_ids)];
  return note_ids;
}

export async function getTags() {
  const db = await getDB();
  const rows = await db.select(`
    SELECT DISTINCT tags.tag_name
    FROM tags
    JOIN note_tags ON tags.tag_id = note_tags.tag_id
  `);
  return rows.map(row => row.tag_name);
}

export async function getTitles() {
  const db = await getDB();
  const rows = await db.select(`SELECT note_id, note_title FROM notes`);
  return rows.map(row => row.note_title);
}

export async function getTitlesAndIds() {
  const db = await getDB();
  const rows = await db.select(`SELECT note_id, note_title FROM notes`);
  return rows;
}

export async function getTagsAndQuantity() {
  const db = await getDB();
  const rows = await db.select(`SELECT tags.tag_name, COUNT(note_tags.tag_id) AS quantity
    FROM tags
    JOIN note_tags ON tags.tag_id = note_tags.tag_id
    GROUP BY tags.tag_id`);
    return rows;
}

export async function getLinksAndQuantity() {
  const db = await getDB();
  const rows = await db.select(`
    SELECT 
      notes.note_id, 
      notes.note_title,
      COUNT(note_tags.tag_id) AS quantity
    FROM note_tags
    JOIN notes ON notes.note_id = note_tags.note_id
    GROUP BY notes.note_id
  `);
  return rows;
}

export async function getNoteLinksWithNoteTitles() {
  const db = await getDB();
  const rows = await db.select(`
    SELECT 
      nl.from_note_id,
      nl.to_note_id,
      f.note_title AS from_title,
      t.note_title AS to_title
    FROM note_links nl
    JOIN notes f ON nl.from_note_id = f.note_id
    JOIN notes t ON nl.to_note_id = t.note_id
  `);
  return rows;
}

export async function getNoteTagsWithNoteTitles() {
  const db = await getDB();
  const rows = await db.select(`
    SELECT 
      nl.from_note_id,
      nl.to_note_id,
      f.note_title AS from_title,
      t.note_title AS to_title
    FROM note_links nl
    JOIN notes f ON nl.from_note_id = f.note_id
    JOIN notes t ON nl.to_note_id = t.note_id
  `);
  return rows;
}
