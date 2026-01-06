from dotenv import load_dotenv
load_dotenv()  # Load .env file before any other imports that might need env vars

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db
from app.routes import memories, policies, compliance, test, agent_variants, jobs, agents

app = FastAPI(title="Policy Compliance Framework")

# CORS middleware (cover localhost and 127.0.0.1 for dev)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database
@app.on_event("startup")
async def startup_event():
    init_db()

# Include routers
app.include_router(agents.router)
app.include_router(memories.router)
app.include_router(policies.router)
app.include_router(compliance.router)
app.include_router(agent_variants.router)
app.include_router(jobs.router)
app.include_router(test.router)


@app.get("/")
async def root():
    return {"message": "Policy Compliance Framework API"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
