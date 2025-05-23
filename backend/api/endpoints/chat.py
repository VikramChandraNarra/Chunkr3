from fastapi import APIRouter, HTTPException
from ..schemas.chat import ChatRequest, ChatResponse
from ..services.openrouter import chat_completion
from ..services import pinecone as pinecone_service
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/chat")
async def chat(request: ChatRequest):
    """Chat endpoint that optionally augments the user query with context retrieved
    from Pinecone. If no relevant context is found, the raw user query is sent
    to the LLM to avoid polluting the prompt with empty or irrelevant content."""
    try:
        logger.info("Received chat request: %s", request)

        # Extract the most recent user message
        user_message = next((m for m in reversed(request.messages) if m.role == "user"), None)
        if not user_message:
            raise HTTPException(status_code=400, detail="No user message found")
        user_query = user_message.content

        # Check if the user query is empty
        if not user_query.strip():
            return {"answer": "Ask Chunkr any question.", "citations": []}

        # 1. Embed the user query
        query_embedding = pinecone_service.embed_text(user_query)

        # 2. Query Pinecone for relevant chunks
        top_chunks = pinecone_service.query_chunks(
            query_embedding,
            top_k=10,              # retrieve more to allow filtering
            namespace=request.id,  # use chat ID‑scoped namespace
            score_threshold=0.4    # only include sufficiently relevant chunks
        )

        # 3. Sort by score and keep the best three
        top_chunks = sorted(top_chunks, key=lambda x: x["score"], reverse=True)[:3]

        # 4. Build the prompt
        if top_chunks:
            # Build context string only when chunks are present
            context = "\n".join(
                f"{i + 1}. {c['metadata']['text']} [Page {c['metadata'].get('page_number', '?')}]"
                for i, c in enumerate(top_chunks)
            )
            prompt = (
                "Answer the following question using the provided context.\n\n"
                f"Context:\n{context}\n\n"
                f"Question: {user_query}"
            )
        else:
            # No context found – ask the model directly
            prompt = user_query

        # 5. Call the LLM via OpenRouter
        response = await chat_completion(
            [{"role": "user", "content": prompt}],
            request.model
        )
        assistant_message = response["choices"][0]["message"]["content"]

        # 6. Prepare citations only if we had context
        citations = [
            {
                "page": c["metadata"].get("page_number"),
                "chunk_id": c["id"],
                "content": c["metadata"].get("text")
            }
            for c in top_chunks
        ] if top_chunks else []

        return {"answer": assistant_message, "citations": citations}

    except Exception as e:
        logger.error("Error in chat endpoint: %s", str(e), exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
