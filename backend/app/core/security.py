"""
MediVision AI - Security Utilities

Authentication and authorization utilities including JWT handling,
password hashing, and security middleware.

Author: MediVision AI Team
"""

from datetime import datetime, timedelta
from typing import Optional, Tuple

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel

from app.core.config import settings


# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# HTTP Bearer token scheme
security = HTTPBearer()


class TokenPayload(BaseModel):
    """JWT token payload model."""
    sub: str  # User ID
    exp: datetime
    type: str  # "access" or "refresh"
    role: str  # User role


class TokenPair(BaseModel):
    """Access and refresh token pair."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


def hash_password(password: str) -> str:
    """
    Hash a password using bcrypt.
    
    Args:
        password: Plain text password
        
    Returns:
        str: Hashed password
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against its hash.
    
    Args:
        plain_password: Plain text password to verify
        hashed_password: Hashed password to compare against
        
    Returns:
        bool: True if password matches, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(
    user_id: str,
    role: str,
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a JWT access token.
    
    Args:
        user_id: User's unique identifier
        role: User's role (admin, clinician, student)
        expires_delta: Optional custom expiration time
        
    Returns:
        str: Encoded JWT access token
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    payload = {
        "sub": user_id,
        "exp": expire,
        "type": "access",
        "role": role,
        "iat": datetime.utcnow(),
    }
    
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(
    user_id: str,
    role: str,
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a JWT refresh token.
    
    Args:
        user_id: User's unique identifier
        role: User's role
        expires_delta: Optional custom expiration time
        
    Returns:
        str: Encoded JWT refresh token
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        )
    
    payload = {
        "sub": user_id,
        "exp": expire,
        "type": "refresh",
        "role": role,
        "iat": datetime.utcnow(),
    }
    
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_token_pair(user_id: str, role: str) -> TokenPair:
    """
    Create both access and refresh tokens.
    
    Args:
        user_id: User's unique identifier
        role: User's role
        
    Returns:
        TokenPair: Access and refresh tokens
    """
    access_token = create_access_token(user_id, role)
    refresh_token = create_refresh_token(user_id, role)
    
    return TokenPair(
        access_token=access_token,
        refresh_token=refresh_token,
    )


def decode_token(token: str) -> TokenPayload:
    """
    Decode and validate a JWT token.
    
    Args:
        token: JWT token string
        
    Returns:
        TokenPayload: Decoded token payload
        
    Raises:
        HTTPException: If token is invalid or expired
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        return TokenPayload(**payload)
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> TokenPayload:
    """
    Dependency to get the current authenticated user from JWT.
    
    Args:
        credentials: HTTP Bearer credentials
        
    Returns:
        TokenPayload: Decoded user information
        
    Raises:
        HTTPException: If authentication fails
    """
    token = credentials.credentials
    payload = decode_token(token)
    
    if payload.type != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type. Access token required.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return payload


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(
        HTTPBearer(auto_error=False)
    )
) -> Optional[TokenPayload]:
    """
    Optional authentication dependency.
    
    Returns None if no token provided, otherwise validates and returns user.
    
    Args:
        credentials: Optional HTTP Bearer credentials
        
    Returns:
        Optional[TokenPayload]: User info if authenticated, None otherwise
    """
    if credentials is None:
        return None
    
    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None


def require_role(*allowed_roles: str):
    """
    Dependency factory for role-based access control.
    
    Usage:
        @router.get("/admin-only")
        async def admin_endpoint(user = Depends(require_role("admin"))):
            ...
    
    Args:
        *allowed_roles: Roles that are allowed to access the endpoint
        
    Returns:
        Dependency function that validates user role
    """
    async def role_checker(
        user: TokenPayload = Depends(get_current_user)
    ) -> TokenPayload:
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {', '.join(allowed_roles)}",
            )
        return user
    
    return role_checker


# Convenience dependencies for common role checks
require_admin = require_role("admin")
require_clinician = require_role("admin", "clinician")
require_any_auth = require_role("admin", "clinician", "student")
