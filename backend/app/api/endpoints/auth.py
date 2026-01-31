"""
MediVision AI - Authentication API Endpoints

Handles user registration, login, logout, and token management.

Author: MediVision AI Team
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    create_token_pair,
    decode_token,
    get_current_user,
    hash_password,
    verify_password,
    TokenPayload,
    TokenPair,
)
from app.db import get_db, User, UserRole

router = APIRouter()


# ============================================================================
# Request/Response Schemas
# ============================================================================

class UserRegisterRequest(BaseModel):
    """User registration request."""
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    full_name: str = Field(..., min_length=2, max_length=256)
    role: Optional[UserRole] = UserRole.STUDENT


class UserLoginRequest(BaseModel):
    """User login request."""
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """User information response."""
    id: str
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True


class TokenRefreshRequest(BaseModel):
    """Token refresh request."""
    refresh_token: str


class AuthResponse(BaseModel):
    """Authentication response with tokens and user info."""
    user: UserResponse
    tokens: TokenPair


class MessageResponse(BaseModel):
    """Simple message response."""
    message: str


# ============================================================================
# Endpoints
# ============================================================================

@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
    description="Create a new user account. Returns authentication tokens."
)
async def register(
    request: UserRegisterRequest,
    db: AsyncSession = Depends(get_db)
) -> AuthResponse:
    """
    Register a new user account.
    
    - **email**: Unique email address
    - **password**: Password (minimum 8 characters)
    - **full_name**: User's full name
    - **role**: User role (defaults to student)
    """
    # Check if email already exists
    existing_user = await db.execute(
        select(User).where(User.email == request.email)
    )
    if existing_user.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    user = User(
        email=request.email,
        password_hash=hash_password(request.password),
        full_name=request.full_name,
        role=request.role,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    # Generate tokens
    tokens = create_token_pair(str(user.id), user.role.value)
    
    return AuthResponse(
        user=UserResponse(
            id=str(user.id),
            email=user.email,
            full_name=user.full_name,
            role=user.role.value,
            is_active=user.is_active,
            created_at=user.created_at,
            last_login=user.last_login,
        ),
        tokens=tokens,
    )


@router.post(
    "/login",
    response_model=AuthResponse,
    summary="Login user",
    description="Authenticate user and return tokens."
)
async def login(
    request: UserLoginRequest,
    db: AsyncSession = Depends(get_db)
) -> AuthResponse:
    """
    Authenticate user with email and password.
    
    Returns access and refresh tokens on successful authentication.
    """
    # Find user by email
    result = await db.execute(
        select(User).where(User.email == request.email)
    )
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated"
        )
    
    # Update last login
    user.last_login = datetime.utcnow()
    await db.commit()
    
    # Generate tokens
    tokens = create_token_pair(str(user.id), user.role.value)
    
    return AuthResponse(
        user=UserResponse(
            id=str(user.id),
            email=user.email,
            full_name=user.full_name,
            role=user.role.value,
            is_active=user.is_active,
            created_at=user.created_at,
            last_login=user.last_login,
        ),
        tokens=tokens,
    )


@router.post(
    "/refresh",
    response_model=TokenPair,
    summary="Refresh access token",
    description="Get a new access token using a refresh token."
)
async def refresh_token(
    request: TokenRefreshRequest,
    db: AsyncSession = Depends(get_db)
) -> TokenPair:
    """
    Refresh the access token using a valid refresh token.
    """
    # Decode refresh token
    payload = decode_token(request.refresh_token)
    
    if payload.type != "refresh":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid token type. Refresh token required."
        )
    
    # Verify user still exists and is active
    result = await db.execute(
        select(User).where(User.id == UUID(payload.sub))
    )
    user = result.scalar_one_or_none()
    
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    # Generate new token pair
    return create_token_pair(str(user.id), user.role.value)


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user",
    description="Get the currently authenticated user's information."
)
async def get_current_user_info(
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> UserResponse:
    """
    Get information about the currently authenticated user.
    """
    result = await db.execute(
        select(User).where(User.id == UUID(current_user.sub))
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        role=user.role.value,
        is_active=user.is_active,
        created_at=user.created_at,
        last_login=user.last_login,
    )


@router.post(
    "/logout",
    response_model=MessageResponse,
    summary="Logout user",
    description="Logout the current user (client should discard tokens)."
)
async def logout(
    current_user: TokenPayload = Depends(get_current_user)
) -> MessageResponse:
    """
    Logout the current user.
    
    Note: In a stateless JWT setup, the client is responsible for
    discarding the tokens. This endpoint is mainly for logging purposes.
    """
    # In a production system, you might want to:
    # 1. Add the token to a blacklist in Redis
    # 2. Log the logout event
    # 3. Clear any server-side sessions
    
    return MessageResponse(message="Successfully logged out")


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=128)

@router.put(
    "/me/password",
    response_model=MessageResponse,
    summary="Change password",
    description="Change the current user's password."
)
async def change_password(
    request: ChangePasswordRequest,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> MessageResponse:
    """
    Change the current user's password.
    
    Requires the current password for verification.
    """
    result = await db.execute(
        select(User).where(User.id == UUID(current_user.sub))
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if not verify_password(request.current_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    user.password_hash = hash_password(request.new_password)
    await db.commit()
    
    return MessageResponse(message="Password updated successfully")
