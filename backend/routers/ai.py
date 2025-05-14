from fastapi import APIRouter, Body
import json
from huggingface_hub import hf_hub_download
from langchain_text_splitters import RecursiveCharacterTextSplitter
from .settings import getSettings
from langchain_community.chat_models import ChatLlamaCpp
from langchain_community.embeddings import LlamaCppEmbeddings

router = APIRouter(prefix="/ai")

embedding_model_name = "mradermacher/gte-Qwen2-1.5B-instruct-GGUF"
embedding_file_name = "gte-Qwen2-1.5B-instruct.Q4_K_M.gguf"
generation_model_name = "MaziyarPanahi/Llama-3.2-3B-Instruct-GGUF"
generation_file_name = "Llama-3.2-3B-Instruct.Q4_K_S.gguf"

embedding_model = None
generation_model = None
text_splitter = None

def getTextSplitter():
    global text_splitter
    if text_splitter is None:
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1024,
            chunk_overlap=256,
            length_function=len,
            is_separator_regex=False
        )
    return text_splitter

def getEmbeddingModel():
    global embedding_model
    settings = getSettings()
    if embedding_model is None:
        file_path = hf_hub_download(
            repo_id=embedding_model_name,
            filename=embedding_file_name,
            cache_dir=str(settings["app_data_dir"])+"/models/"
        )
        embedding_model = LlamaCppEmbeddings(model_path=file_path)
    return embedding_model

def getGenerationModel():
    global generation_model
    settings = getSettings()
    if generation_model is None:
        file_path = hf_hub_download(
            repo_id=generation_model_name,
            filename=generation_file_name,
            cache_dir=str(settings["app_data_dir"])+"/models/"
        )
        generation_model = ChatLlamaCpp(model_path=file_path)
    return generation_model

def generateChunks(text: str):
    return getTextSplitter().split_text(text)

def generateDocumentEmbedding(texts: list[str]):
    embeddings = getEmbeddingModel().embed_documents(texts)
    return embeddings

def generateQueryEmbedding(text: str):
    embedding = getEmbeddingModel().embed_query(text)
    return embedding


@router.get("/downloadModels")
def downloadModels():
    settings = getSettings()
    hf_hub_download(
        repo_id=embedding_model_name,
        filename=embedding_file_name,
        cache_dir=str(settings["app_data_dir"])+"/models/"
    )
    hf_hub_download(
        repo_id=generation_model_name,
        filename=generation_file_name,
        cache_dir=str(settings["app_data_dir"])+"/models/"
    )
    return

@router.get("/initModels")
def initModels():
    getEmbeddingModel()
    getGenerationModel()
    return

@router.post("/chat")
def chat(prompt: dict = Body(...)):
    llm = getGenerationModel()
    response = llm.invoke(prompt["prompt"])
    return {"content": response.content}

@router.post("/newChat")
def newChat():
    return



