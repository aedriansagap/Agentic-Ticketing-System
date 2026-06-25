from fastapi import APIRouter, Depends
from pydantic import BaseModel
from fastapi.security import OAuth2PasswordBearer
from agent import process_chat
from auth import get_current_user, oauth2_scheme

router = APIRouter()

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str

@router.post("/", response_model=ChatResponse)
def handle_chat(request: ChatRequest, token: str = Depends(oauth2_scheme), current_user = Depends(get_current_user)):
    reply = process_chat(request.message, token)
    return ChatResponse(reply=reply)
