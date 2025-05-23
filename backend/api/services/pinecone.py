import os
from typing import List, Dict
from sentence_transformers import SentenceTransformer
from pinecone import Pinecone, ServerlessSpec
from dotenv import load_dotenv
import time
import logging

load_dotenv()


# Load environment variables
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_ENV = os.getenv("PINECONE_ENV")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME")

# Initialize Pinecone client
pc = Pinecone(api_key=PINECONE_API_KEY)

# (Optional) Create index if not exists
if PINECONE_INDEX_NAME not in pc.list_indexes().names():
    pc.create_index(
        name=PINECONE_INDEX_NAME,
        dimension=384,
        metric="cosine",
        spec=ServerlessSpec(cloud="aws", region=PINECONE_ENV)
    )

# Access the index
index = pc.Index(PINECONE_INDEX_NAME)

# Load the embedding model
model = SentenceTransformer('all-MiniLM-L6-v2')

# Embed a single text string
def embed_text(text: str) -> List[float]:
    return model.encode(text).tolist()

# Upsert text chunks
def upsert_chunks(chunks: List[Dict], chat_id: str):
    print(chunks)
    vectors = []
    for chunk in chunks:
        embedding = embed_text(chunk["text"])
        vectors.append({
            "id": chunk["chunk_id"],
            "values": embedding,
            "metadata": {
                "page_number": chunk.get("page_number"),
                "text": chunk["text"]
            }
        })
    index.upsert(vectors=vectors, namespace=chat_id)

# Query Pinecone
def query_chunks(
    embedding: List[float],
    top_k: int = 1000,
    namespace: str = None,
    score_threshold: float = 0.0
):
    result = index.query(
        vector=embedding,
        top_k=top_k,
        include_metadata=True,
        include_values=False,
        namespace=namespace
    )

    print("Full result:", result)

    # Filter by score threshold
    filtered_matches = [
        match for match in result["matches"]
        if match.get("score", 0) >= score_threshold
    ]

    if not filtered_matches:
        print("No matches above threshold. Returning all matches.")
        return result["matches"]

    print("Filtered matches:", filtered_matches)
    return filtered_matches

def check_namespace_has_vectors(namespace: str) -> bool:
    """Check if a namespace exists and has vectors in Pinecone."""
    try:
        # Query with empty vector to check if namespace has any vectors
        # Using a small limit to minimize data transfer
        stats = index.describe_index_stats()
        namespace_stats = stats.get("namespaces", {}).get(namespace, {})
        vector_count = namespace_stats.get("vector_count", 0)
        return vector_count > 0
    except Exception as e:
        logger.error(f"Error checking namespace vectors: {e}")
        return False

# def wait_for_vectors(namespace: str, min_count: int = 1, timeout: int = 10, interval: float = 0.5) -> bool:
#     """
#     Wait until Pinecone namespace has at least `min_count` vectors, or until timeout.
#     """
#     start = time.time()
#     while time.time() - start < timeout:
#         stats = index.describe_index_stats()
#         count = stats.get("namespaces", {}).get(namespace, {}).get("vector_count", 0)
#         if count >= min_count:
#             return True
#         time.sleep(interval)
#     return False
