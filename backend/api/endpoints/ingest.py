from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse

from chunkr_ai import Chunkr
import tempfile
import os
from ..services import pinecone as pinecone_service
from typing import List, Dict


router = APIRouter()

CHUNKR_API_KEY = os.getenv("CHUNKR_API_KEY")
chunkr = Chunkr(api_key=CHUNKR_API_KEY)

def convert_chunkr_chunks_to_upsert_format(chunks) -> List[Dict]:
    converted = []
    for chunk in chunks:
        # Combine all segment content into one string
        text_parts = [segment.content for segment in chunk.segments if segment.content]
        full_text = "\n".join(text_parts)

        # Attempt to grab the page number from the first segment
        page_number = chunk.segments[0].page_number if chunk.segments else None

        converted.append({
            "chunk_id": chunk.chunk_id,
            "text": full_text,
            "page_number": page_number
        })
    return converted


@router.post("/ingest")
async def ingest_document(file: UploadFile = File(...), chat_id: str = Form(...)):
    try:
        # Upload to Chunkr
        task = await chunkr.upload(file.file)

        # Get chunks
        chunks = task.output.chunks  # This is a list of `Chunk` objects

        upsert_ready_chunks = convert_chunkr_chunks_to_upsert_format(chunks)

        # Upsert to Pinecone
        pinecone_service.upsert_chunks(upsert_ready_chunks, chat_id)

        return {"chunks": upsert_ready_chunks}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
