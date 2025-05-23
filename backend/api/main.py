from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .endpoints import chat
from .endpoints import ingest
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

app = FastAPI(title="Chunkr API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def healthcheck():
    return {"status": "ok"}


# Include routers
app.include_router(chat.router, prefix="/api")
app.include_router(ingest.router, prefix="/api")
