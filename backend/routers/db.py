import datetime
from fastapi import APIRouter, Body
import uuid
from .settings import getSettings
from . import ai

import sqlite3
import chromadb
import json

router = APIRouter(prefix="/db")

@router.post("/init")
def initDBs():
    sql_db = getSQLDb()
    sql_db.execute("""
    CREATE TABLE IF NOT EXISTS notes (
        note_id     INTEGER PRIMARY KEY AUTOINCREMENT,
        title       TEXT,
        content     TEXT,
        chunk       INT,
        tags        TEXT,       -- you can store JSON lists here
        created_at  DATETIME,
        updated_at  DATETIME
    )
    """)

    # 2) Full-text search index
    sql_db.execute("""
    CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts
    USING fts5(title, content, tokenize='porter')
    """)
    sql_db.commit()

    chroma_client = getChromaClient()

    chroma_collection = chroma_client.create_collection(
        name="notes", 
    )
    return

def getChromaClient():
    chroma_client = chromadb.Client()
    return chroma_client

def getChromaCollection():
    chroma_collection = getChromaClient().get_collection(name="notes")
    return chroma_collection

def getSQLDb():

    sql_db = sqlite3.connect(getSettings()["app_data_dir"]+"/db.db")
    return sql_db

@router.post("/createNote")
def createNote():
    sql_db = getSQLDb()

    # prepare values
    now       = datetime.datetime.now(datetime.timezone.utc).isoformat()
    tags_json = json.dumps([])

    # execute returns a cursor
    cursor = sql_db.execute(
        """
        INSERT INTO notes (title, content, tags, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
        """,
        ("", "", tags_json, now, now)
    )

    sql_db.commit()

    # lastrowid is on the cursor
    return {"note_id": cursor.lastrowid}

def getLastChromaId():
    chroma_collection = getChromaCollection()
    return chroma_collection.count()

def deleteNoteVectors(note_id: int):
    chroma_collection = getChromaCollection()
    chroma_collection.delete(where={"note_id": note_id})

def addNoteVectors(note_id: int, vectors: list[list[float]]):
    chroma_collection = getChromaCollection()
    chroma_collection.add(
        embeddings=vectors,
        metadatas=[{"note_id": note_id}],
        ids=[str(uuid.uuid4()) for _ in range(len(vectors))]
    )

def getNote(note_id: int):
    sql_db = getSQLDb()
    cursor = sql_db.execute(
        """
        SELECT * FROM notes WHERE note_id = ?
        """,
        (note_id)
    )
    return cursor.fetchone()

@router.post("/updateNote")
def updateNote(payload: dict = Body(...)):
    note_id = payload.get("note_id")
    title   = payload.get("title")
    content = payload.get("content")
    
    sql_db = getSQLDb()
    sql_db.execute(
        """
        UPDATE notes
        SET title = ?, content = ?, updated_at = ?
        WHERE note_id = ?
        """,
        (title, content, datetime.datetime.now(datetime.timezone.utc).isoformat(), note_id)
    )

    sql_db.commit()

    deleteNoteVectors(note_id)
    note_chunks = ai.generateChunks(content)
    addNoteVectors(note_id, ai.generateDocumentEmbedding(note_chunks))
    






