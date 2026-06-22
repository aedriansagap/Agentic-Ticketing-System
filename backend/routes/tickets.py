from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List

from database import get_session
from models import Ticket

router = APIRouter()

@router.post("/", response_model=Ticket)
def create_ticket(ticket: Ticket, session: Session = Depends(get_session)):
    session.add(ticket)
    session.commit()
    session.refresh(ticket)
    return ticket

@router.get("/", response_model=List[Ticket])
def read_tickets(skip: int = 0, limit: int = 100, session: Session = Depends(get_session)):
    tickets = session.exec(select(Ticket).offset(skip).limit(limit)).all()
    return tickets

@router.get("/{ticket_id}", response_model=Ticket)
def read_ticket(ticket_id: int, session: Session = Depends(get_session)):
    ticket = session.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket

@router.put("/{ticket_id}", response_model=Ticket)
def update_ticket(ticket_id: int, ticket_update: Ticket, session: Session = Depends(get_session)):
    db_ticket = session.get(Ticket, ticket_id)
    if not db_ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    update_data = ticket_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if key != "id":
            setattr(db_ticket, key, value)
            
    session.add(db_ticket)
    session.commit()
    session.refresh(db_ticket)
    return db_ticket

@router.delete("/{ticket_id}")
def delete_ticket(ticket_id: int, session: Session = Depends(get_session)):
    ticket = session.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    session.delete(ticket)
    session.commit()
    return {"ok": True}
