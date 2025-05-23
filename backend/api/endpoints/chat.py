from fastapi import APIRouter, HTTPException
from ..schemas.chat import ChatRequest, ChatResponse
from ..services.openrouter import chat_completion
from ..services import pinecone as pinecone_service
import logging


router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/chat")
async def chat(request: ChatRequest):
    try:
        logger.info(f"Received chat request: {request}")
        user_message = next((m for m in reversed(request.messages) if m.role == "user"), None)
        if not user_message:
            raise HTTPException(status_code=400, detail="No user message found")
        user_query = user_message.content
        # 1. Embed the user query
        query_embedding = pinecone_service.embed_text(user_query)
        # 2. Query Pinecone for relevant chunks

        top_chunks = pinecone_service.query_chunks(query_embedding, top_k=3, namespace=request.id)
        # 3. Build context string
        print("context", top_chunks)
        context = "\n".join([
            f"{i+1}. {c['metadata']['text']} [Page {c['metadata'].get('page_number', '?')}]"
            for i, c in enumerate(top_chunks)
        ])
        # 4. Construct prompt
        prompt = f"""Answer the following question using the provided context.\n\nContext:\n{context}\n\nQuestion: {user_query}"""
        # 5. Call OpenRouter (LLM)
        response = await chat_completion([
            {"role": "user", "content": prompt}
        ], request.model)
        logger.info(f"OpenRouter response: {response}")
        assistant_message = response["choices"][0]["message"]["content"]
        # 6. Return answer and citations
        citations = [
            {
                "page": c["metadata"].get("page_number"),
                "chunk_id": c["id"],
                "content": c["metadata"].get("text")
            }
            for c in top_chunks
        ]
        return {"answer": assistant_message, "citations": citations}
    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
