import Database from '@tauri-apps/plugin-sql';
import splitText from './recursive-splitter';
import { embed } from './aifuncs';

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
      note_embedding_blob BLOB
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

export async function createNote() {

    const db = await getDB();
    const result = await db.execute(
        `
        INSERT INTO notes (note_title, note_content)
        VALUES (?, ?)
        `,
        ["", ""]
    );
    return result.lastInsertId; // or `result.lastID` depending on your DB client
}


export async function editNote(note_id, title, content) {
  const db = await getDB();
  const chunks = splitText(content, 1024, 100);   // or your defaults

    // 1. update the main note
    await db.execute(
      `UPDATE notes
         SET note_title = ?, note_content = ?, note_updated_at = CURRENT_TIMESTAMP
       WHERE note_id = ?`,
      [title, content, note_id]
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
      const vector = await embed(chunks[idx]); 
      console.log(vector)        // returns Uint8Array / Buffer / base64
      await db.execute(
        `INSERT INTO note_embeddings (note_id, note_chunk_id, note_embedding_blob)
         VALUES (?, ?, ?)`,
        [note_id, chunk_id, vector]
      );
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


    