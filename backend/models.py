from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime

class UserBase(SQLModel):
    username: str = Field(index=True, unique=True)
    role: str = Field(default="user") # user, admin

class UserCreate(UserBase):
    password: str

class User(UserBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    hashed_password: str

class Ticket(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str = Field(index=True)
    description: str
    status: str = Field(default="open") # open, in_progress, resolved, closed
    priority: str = Field(default="medium") # low, medium, high
    category: str = Field(default="general") # general, technical, billing, account
    created_at: datetime = Field(default_factory=datetime.utcnow)
    owner_id: Optional[int] = Field(default=None, foreign_key="user.id")
    assigned_to: Optional[int] = Field(default=None, foreign_key="user.id")
    assigned_username: Optional[str] = Field(default=None)

class CommentBase(SQLModel):
    content: str

class CommentCreate(CommentBase):
    pass

class Comment(CommentBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    ticket_id: int = Field(foreign_key="ticket.id")
    author_id: int = Field(foreign_key="user.id")
    author_username: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
