from fastapi import APIRouter
from pydantic import BaseModel
from agent import process_chat

router = APIRouter()

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str

@router.post("/", response_model=ChatResponse)
def handle_chat(request: ChatRequest):
    # Pass the user's message to the agent to process
    reply = process_chat(request.message)
    return ChatResponse(reply=reply)
