from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import datetime
from models import UserRole, TransactionType, TransactionStatus

# Base User Schema
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    phone: Optional[str] = None
    age: Optional[int] = Field(None, ge=18, le=100)
    country: str = Field(default="ke", max_length=5)

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=100)
    role: UserRole = UserRole.VIEWER

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: str
    role: UserRole
    is_active: bool
    is_verified: bool
    created_at: datetime
    last_login: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Token Response
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Viewer Profile Schemas
class ViewerProfileResponse(BaseModel):
    id: str
    token_balance: float
    total_spent: float
    favorite_models: List[str] = []
    
    class Config:
        from_attributes = True

class ViewerDashboard(BaseModel):
    user: UserResponse
    profile: ViewerProfileResponse
    recent_transactions: List['TransactionResponse'] = []

# Model Profile Schemas
class ModelProfileCreate(BaseModel):
    display_name: str = Field(..., min_length=3, max_length=100)
    bio: Optional[str] = Field(None, max_length=1000)
    show_rate: int = Field(default=20, ge=1, le=1000)

class ModelProfileUpdate(BaseModel):
    display_name: Optional[str] = Field(None, min_length=3, max_length=100)
    bio: Optional[str] = Field(None, max_length=1000)
    show_rate: Optional[int] = Field(None, ge=1, le=1000)
    is_available: Optional[bool] = None

class ModelProfileResponse(BaseModel):
    id: str
    display_name: str
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    thumbnail: Optional[str] = None
    show_rate: int
    is_live: bool
    is_available: bool
    total_earnings: float
    available_balance: float
    total_viewers: int
    rating: float
    total_shows: int
    online_hours: int
    created_at: datetime
    last_online: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class ModelDashboard(BaseModel):
    user: UserResponse
    profile: ModelProfileResponse
    recent_earnings: List['TransactionResponse'] = []
    total_earnings_today: float = 0.00

# Transaction Schemas
class TransactionCreate(BaseModel):
    transaction_type: TransactionType
    amount: float = Field(..., gt=0)
    tokens: Optional[int] = Field(None, gt=0)
    phone_number: Optional[str] = None
    model_id: Optional[str] = None
    description: Optional[str] = None

class TransactionResponse(BaseModel):
    id: str
    transaction_type: TransactionType
    amount: float
    tokens: Optional[int] = None
    status: TransactionStatus
    mpesa_code: Optional[str] = None
    phone_number: Optional[str] = None
    description: Optional[str] = None
    model_id: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# Token Purchase Schemas
class TokenPurchaseRequest(BaseModel):
    tokens: int = Field(..., gt=0)
    phone_number: str = Field(..., pattern=r'^254[0-9]{9}$')
    
    @validator('tokens')
    def validate_token_packages(cls, v):
        valid_packages = [50, 100, 200, 500, 1000]
        if v not in valid_packages:
            raise ValueError(f'Invalid token package. Must be one of: {valid_packages}')
        return v

class TokenPurchaseResponse(BaseModel):
    transaction_id: str
    tokens: int
    amount: float
    phone_number: str
    status: str
    message: str

# Withdrawal Schemas
class WithdrawalRequest(BaseModel):
    amount: float = Field(..., gt=0)
    phone_number: str = Field(..., pattern=r'^254[0-9]{9}$')

class WithdrawalResponse(BaseModel):
    id: str
    amount: float
    phone_number: str
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# Private Show Schemas
class PrivateShowRequest(BaseModel):
    model_id: str

class PrivateShowResponse(BaseModel):
    id: str
    model_id: str
    rate_per_minute: int
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# System Settings Schemas
class SystemSettingResponse(BaseModel):
    key: str
    value: str
    description: Optional[str] = None
    
    class Config:
        from_attributes = True

# Stats Schemas
class PlatformStats(BaseModel):
    total_users: int = 0
    active_models: int = 0
    total_revenue: float = 0.00
    daily_revenue: float = 0.00
    total_transactions: int = 0

# Error Response
class ErrorResponse(BaseModel):
    detail: str
    error_code: Optional[str] = None

# Success Response
class SuccessResponse(BaseModel):
    message: str
    data: Optional[dict] = None

# Update forward references
ViewerDashboard.model_rebuild()
ModelDashboard.model_rebuild()