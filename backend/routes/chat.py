from fastapi import APIRouter, Depends
from pydantic import BaseModel
from fastapi.security import OAuth2PasswordBearer
from agent import process_chat
from auth import get_current_user, oauth2_scheme
from database import get_session
from sqlmodel import Session, select
from models import ChatMessage

router = APIRouter()

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str

@router.post("/", response_model=ChatResponse)
def handle_chat(request: ChatRequest, token: str = Depends(oauth2_scheme), current_user = Depends(get_current_user), session: Session = Depends(get_session)):
    # Save user message
    user_msg = ChatMessage(sender="user", content=request.message, user_id=current_user.id)
    session.add(user_msg)
    session.commit()
    
    # Fetch recent history (last 10 messages)
    history_records = session.exec(
        select(ChatMessage).where(ChatMessage.user_id == current_user.id).order_by(ChatMessage.created_at.desc()).limit(10)
    ).all()
    
    # Reverse so it's chronological
    history = [(msg.sender, msg.content) for msg in reversed(history_records)]
    
    # Process chat (now passing history instead of just request.message)
    reply = process_chat(history, token)
    
    # Save agent message
    agent_msg = ChatMessage(sender="agent", content=reply, user_id=current_user.id)
    session.add(agent_msg)
    session.commit()
    
    return ChatResponse(reply=reply)
