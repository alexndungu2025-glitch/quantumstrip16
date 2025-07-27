from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum
import uuid

# Enums
class UserRole(str, Enum):
    VIEWER = "viewer"
    MODEL = "model"
    ADMIN = "admin"

class TransactionType(str, Enum):
    PURCHASE = "purchase"
    TIP = "tip"
    PRIVATE_SHOW = "private_show"
    WITHDRAWAL = "withdrawal"
    EARNING = "earning"

class TransactionStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class WithdrawalStatus(str, Enum):
    REQUESTED = "requested"
    PROCESSING = "processing"
    COMPLETED = "completed"
    REJECTED = "rejected"

# MongoDB Document Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), alias="_id")
    username: str
    email: str
    phone: Optional[str] = None
    password_hash: str
    role: UserRole = UserRole.VIEWER
    is_active: bool = True
    is_verified: bool = False
    age: Optional[int] = None
    country: str = "ke"
    language: str = "en"  # Default language preference
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    last_login: Optional[datetime] = None
    
    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class ViewerProfile(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), alias="_id")
    user_id: str
    token_balance: float = 0.00
    total_spent: float = 0.00
    favorite_models: List[str] = []
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    
    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class ModelProfile(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), alias="_id")
    user_id: str
    display_name: str
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    thumbnail: Optional[str] = None  # Base64 encoded thumbnail image
    
    # Streaming settings
    show_rate: int = 20  # tokens per minute
    is_live: bool = False
    is_available: bool = True
    
    # Stats
    total_earnings: float = 0.00
    available_balance: float = 0.00
    total_viewers: int = 0
    rating: float = 0.00
    total_shows: int = 0
    online_hours: int = 0
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    last_online: Optional[datetime] = None
    
    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class Transaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), alias="_id")
    user_id: str
    transaction_type: TransactionType
    amount: float  # In KES for purchases, tokens for others
    tokens: Optional[int] = None  # Token amount
    status: TransactionStatus = TransactionStatus.PENDING
    
    # Payment details
    mpesa_code: Optional[str] = None  # M-Pesa confirmation code
    phone_number: Optional[str] = None
    reference: Optional[str] = None
    
    # Additional data
    model_id: Optional[str] = None  # For tips and private shows
    description: Optional[str] = None
    metadata: Optional[dict] = None  # Additional data
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    
    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class Withdrawal(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), alias="_id")
    model_id: str
    amount: float  # Amount in KES
    phone_number: str
    status: WithdrawalStatus = WithdrawalStatus.REQUESTED
    
    # Processing details
    mpesa_code: Optional[str] = None
    admin_notes: Optional[str] = None
    processed_by: Optional[str] = None  # Admin user ID
    processed_at: Optional[datetime] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    
    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class PrivateShow(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), alias="_id")
    viewer_id: str
    model_id: str
    
    # Show details
    rate_per_minute: int  # tokens per minute
    duration_minutes: int = 0  # Actual duration
    total_cost: int = 0  # Total tokens spent
    
    # Status and timing
    status: str = "requested"  # requested, active, completed, cancelled
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    
    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class SystemSettings(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), alias="_id")
    key: str
    value: str
    description: Optional[str] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    
    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

# Chat System Models
class MessageType(str, Enum):
    TEXT = "text"
    EMOJI = "emoji"
    TIP = "tip"
    SYSTEM = "system"
    PRIVATE = "private"

class ChatMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), alias="_id")
    room_id: str  # Can be model_id for public chat or unique room for private
    sender_id: str
    sender_username: str
    sender_role: UserRole
    
    # Message content
    message_type: MessageType = MessageType.TEXT
    content: str
    tip_amount: Optional[int] = None  # For tip messages
    
    # Chat moderation
    is_deleted: bool = False
    deleted_by: Optional[str] = None
    deleted_at: Optional[datetime] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class ChatRoom(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), alias="_id")
    room_type: str  # "public" or "private"
    name: str
    
    # For public rooms (linked to model streams)
    model_id: Optional[str] = None
    
    # For private rooms
    participants: List[str] = []  # User IDs
    
    # Room settings
    is_active: bool = True
    max_participants: Optional[int] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    
    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class ChatModerationAction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), alias="_id")
    room_id: str
    moderator_id: str  # Admin or model who performed action
    target_user_id: str
    action_type: str  # "mute", "kick", "ban", "delete_message"
    duration_minutes: Optional[int] = None  # For temporary actions
    reason: Optional[str] = None
    
    # Message specific (for delete_message action)
    message_id: Optional[str] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = None
    
    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }