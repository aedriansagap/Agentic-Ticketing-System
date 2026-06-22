from fastapi import FastAPI
from database import create_db_and_tables
from routes import tickets, chat
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield

app = FastAPI(title="Agentic Ticketing System API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tickets.router, prefix="/api/tickets", tags=["Tickets"])
app.include_router(chat.router, prefix="/api/chat", tags=["Agent Chat"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the Agentic Ticketing System"}
