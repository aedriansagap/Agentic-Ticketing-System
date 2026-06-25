from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List

from database import get_session
from models import Ticket, User
from auth import get_current_user

router = APIRouter()

@router.post("/", response_model=Ticket)
def create_ticket(ticket: Ticket, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    ticket.owner_id = current_user.id
    session.add(ticket)
    session.commit()
    session.refresh(ticket)
    return ticket

@router.get("/", response_model=List[Ticket])
def read_tickets(skip: int = 0, limit: int = 100, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    if current_user.role == "admin":
        tickets = session.exec(select(Ticket).offset(skip).limit(limit)).all()
    else:
        tickets = session.exec(select(Ticket).where(Ticket.owner_id == current_user.id).offset(skip).limit(limit)).all()
    return tickets

@router.get("/{ticket_id}", response_model=Ticket)
def read_ticket(ticket_id: int, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    ticket = session.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if current_user.role != "admin" and ticket.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this ticket")
    return ticket

@router.put("/{ticket_id}", response_model=Ticket)
def update_ticket(ticket_id: int, ticket_update: Ticket, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    db_ticket = session.get(Ticket, ticket_id)
    if not db_ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    if current_user.role != "admin" and db_ticket.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this ticket")
        
    update_data = ticket_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if key != "id" and key != "owner_id":
            setattr(db_ticket, key, value)
            
    session.add(db_ticket)
    session.commit()
    session.refresh(db_ticket)
    return db_ticket

@router.delete("/{ticket_id}")
def delete_ticket(ticket_id: int, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    ticket = session.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if current_user.role != "admin" and ticket.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this ticket")
        
    session.delete(ticket)
    session.commit()
    return {"ok": True}
