"""
MediVision AI - Case Management Tests

Tests for case and study endpoints.
"""

import pytest
from httpx import AsyncClient


class TestCaseEndpoints:
    """Test case management endpoints."""

    async def get_auth_headers(self, client: AsyncClient, test_user_data) -> dict:
        """Helper to get auth headers."""
        await client.post("/api/v1/auth/register", json=test_user_data)
        login_data = {
            "username": test_user_data["email"],
            "password": test_user_data["password"]
        }
        response = await client.post("/api/v1/auth/login", data=login_data)
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}

    @pytest.mark.asyncio
    async def test_create_case(self, client: AsyncClient, test_user_data, test_case_data):
        """Test case creation."""
        headers = await self.get_auth_headers(client, test_user_data)
        
        response = await client.post(
            "/api/v1/cases",
            json=test_case_data,
            headers=headers
        )
        assert response.status_code == 201
        data = response.json()
        assert data["patient_id"] == test_case_data["patient_id"]
        assert data["status"] == "pending"
        assert "id" in data

    @pytest.mark.asyncio
    async def test_list_cases(self, client: AsyncClient, test_user_data, test_case_data):
        """Test listing cases."""
        headers = await self.get_auth_headers(client, test_user_data)
        
        # Create a few cases
        for i in range(3):
            case_data = {**test_case_data, "patient_id": f"MRN-TEST-{i:03d}"}
            await client.post("/api/v1/cases", json=case_data, headers=headers)
        
        # List cases
        response = await client.get("/api/v1/cases", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 3

    @pytest.mark.asyncio
    async def test_get_case(self, client: AsyncClient, test_user_data, test_case_data):
        """Test getting a specific case."""
        headers = await self.get_auth_headers(client, test_user_data)
        
        # Create case
        create_response = await client.post(
            "/api/v1/cases",
            json=test_case_data,
            headers=headers
        )
        case_id = create_response.json()["id"]
        
        # Get case
        response = await client.get(f"/api/v1/cases/{case_id}", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == case_id

    @pytest.mark.asyncio
    async def test_update_case(self, client: AsyncClient, test_user_data, test_case_data):
        """Test updating a case."""
        headers = await self.get_auth_headers(client, test_user_data)
        
        # Create case
        create_response = await client.post(
            "/api/v1/cases",
            json=test_case_data,
            headers=headers
        )
        case_id = create_response.json()["id"]
        
        # Update case
        update_data = {"status": "in_progress", "tags": ["urgent"]}
        response = await client.patch(
            f"/api/v1/cases/{case_id}",
            json=update_data,
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "in_progress"

    @pytest.mark.asyncio
    async def test_delete_case(self, client: AsyncClient, test_user_data, test_case_data):
        """Test deleting a case."""
        headers = await self.get_auth_headers(client, test_user_data)
        
        # Create case
        create_response = await client.post(
            "/api/v1/cases",
            json=test_case_data,
            headers=headers
        )
        case_id = create_response.json()["id"]
        
        # Delete case
        response = await client.delete(f"/api/v1/cases/{case_id}", headers=headers)
        assert response.status_code == 204
        
        # Verify deleted
        get_response = await client.get(f"/api/v1/cases/{case_id}", headers=headers)
        assert get_response.status_code == 404

    @pytest.mark.asyncio
    async def test_get_case_stats(self, client: AsyncClient, test_user_data, test_case_data):
        """Test getting case statistics."""
        headers = await self.get_auth_headers(client, test_user_data)
        
        # Create some cases
        await client.post("/api/v1/cases", json=test_case_data, headers=headers)
        
        # Get stats
        response = await client.get("/api/v1/cases/stats", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "total_cases" in data
        assert "by_status" in data
