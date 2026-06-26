from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, or_
from typing import List, Optional

from database import get_session
from models import Ticket, User, Comment, CommentCreate
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
def read_tickets(
    skip: int = 0, 
    limit: int = 100, 
    status: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    session: Session = Depends(get_session), 
    current_user: User = Depends(get_current_user)
):
    query = select(Ticket)
    
    if current_user.role != "admin":
        query = query.where(Ticket.owner_id == current_user.id)
        
    if status:
        query = query.where(Ticket.status == status)
    if category:
        query = query.where(Ticket.category == category)
    if search:
        query = query.where(
            or_(
                Ticket.title.contains(search),
                Ticket.description.contains(search)
            )
        )
        
    tickets = session.exec(query.offset(skip).limit(limit)).all()
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

@router.post("/{ticket_id}/assign", response_model=Ticket)
def assign_ticket(ticket_id: int, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can claim tickets")
        
    db_ticket = session.get(Ticket, ticket_id)
    if not db_ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    db_ticket.assigned_to = current_user.id
    db_ticket.assigned_username = current_user.username
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

@router.get("/{ticket_id}/comments", response_model=List[Comment])
def read_comments(ticket_id: int, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    ticket = session.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if current_user.role != "admin" and ticket.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view comments")
        
    comments = session.exec(select(Comment).where(Comment.ticket_id == ticket_id).order_by(Comment.created_at)).all()
    return comments

@router.post("/{ticket_id}/comments", response_model=Comment)
def create_comment(ticket_id: int, comment: CommentCreate, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    ticket = session.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if current_user.role != "admin" and ticket.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to comment")
        
    new_comment = Comment(
        content=comment.content,
        ticket_id=ticket_id,
        author_id=current_user.id,
        author_username=current_user.username
    )
    session.add(new_comment)
    session.commit()
    session.refresh(new_comment)
    return new_comment
