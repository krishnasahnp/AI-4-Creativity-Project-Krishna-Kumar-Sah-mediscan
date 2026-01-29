"""
MediVision AI - Authentication Tests

Tests for auth endpoints.
"""

import pytest
from httpx import AsyncClient


class TestAuthEndpoints:
    """Test authentication endpoints."""

    @pytest.mark.asyncio
    async def test_register_user(self, client: AsyncClient, test_user_data):
        """Test user registration."""
        response = await client.post("/api/v1/auth/register", json=test_user_data)
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == test_user_data["email"]
        assert data["full_name"] == test_user_data["full_name"]
        assert "id" in data
        assert "password_hash" not in data

    @pytest.mark.asyncio
    async def test_register_duplicate_email(self, client: AsyncClient, test_user_data):
        """Test registration with duplicate email fails."""
        # Register first time
        await client.post("/api/v1/auth/register", json=test_user_data)
        
        # Try to register again with same email
        response = await client.post("/api/v1/auth/register", json=test_user_data)
        assert response.status_code == 400

    @pytest.mark.asyncio
    async def test_login_success(self, client: AsyncClient, test_user_data):
        """Test successful login."""
        # Register user first
        await client.post("/api/v1/auth/register", json=test_user_data)
        
        # Login
        login_data = {
            "username": test_user_data["email"],
            "password": test_user_data["password"]
        }
        response = await client.post("/api/v1/auth/login", data=login_data)
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    @pytest.mark.asyncio
    async def test_login_wrong_password(self, client: AsyncClient, test_user_data):
        """Test login with wrong password fails."""
        # Register user first
        await client.post("/api/v1/auth/register", json=test_user_data)
        
        # Try to login with wrong password
        login_data = {
            "username": test_user_data["email"],
            "password": "wrongpassword"
        }
        response = await client.post("/api/v1/auth/login", data=login_data)
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_get_current_user(self, client: AsyncClient, test_user_data):
        """Test getting current user info."""
        # Register and login
        await client.post("/api/v1/auth/register", json=test_user_data)
        login_data = {
            "username": test_user_data["email"],
            "password": test_user_data["password"]
        }
        login_response = await client.post("/api/v1/auth/login", data=login_data)
        token = login_response.json()["access_token"]
        
        # Get current user
        headers = {"Authorization": f"Bearer {token}"}
        response = await client.get("/api/v1/auth/me", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == test_user_data["email"]

    @pytest.mark.asyncio
    async def test_refresh_token(self, client: AsyncClient, test_user_data):
        """Test token refresh."""
        # Register and login
        await client.post("/api/v1/auth/register", json=test_user_data)
        login_data = {
            "username": test_user_data["email"],
            "password": test_user_data["password"]
        }
        login_response = await client.post("/api/v1/auth/login", data=login_data)
        refresh_token = login_response.json()["refresh_token"]
        
        # Refresh token
        response = await client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": refresh_token}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data

    @pytest.mark.asyncio
    async def test_unauthorized_access(self, client: AsyncClient):
        """Test accessing protected endpoint without auth."""
        response = await client.get("/api/v1/auth/me")
        assert response.status_code == 401
