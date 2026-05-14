from contextlib import asynccontextmanager
# pyrefly: ignore [missing-import]
from fastapi import FastAPI
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db_indexes
from app.routers import bins, chat


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database indexes on startup
    init_db_indexes()
    yield
    # Clean up resources on shutdown if necessary


app = FastAPI(
    title="OmniBin Smart Waste Management API",
    description="Backend API services for smart IoT dustbin ingestion and NetworkX-optimized routing.",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS for frontend web integration
# Enable CORS for frontend web integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", # Keep local for testing
        "https://omnibin.vercel.app"
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


from app.routers import bins, chat, operators, complaints, detection

# Include application routers
app.include_router(bins.router)
app.include_router(chat.router)
app.include_router(operators.router)
app.include_router(complaints.router)
app.include_router(detection.router)


@app.get("/", tags=["Health"])
def root():
    """Root endpoint verifying API operational status."""
    return {
        "system": "OmniBin Smart Waste Management",
        "status": "Operational",
        "documentation": "/docs",
    }
