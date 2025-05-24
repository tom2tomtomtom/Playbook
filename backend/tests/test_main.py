import pytest
from fastapi.testclient import TestClient
from main import app
from auth import create_access_token
import os
import tempfile
from datetime import timedelta

# Test client
client = TestClient(app)

# Test authentication token
test_token = create_access_token(
    data={"sub": "admin"}, 
    expires_delta=timedelta(minutes=30)
)
auth_headers = {"Authorization": f"Bearer {test_token}"}

class TestAPI:
    """Test API endpoints"""
    
    def test_root(self):
        """Test root endpoint"""
        response = client.get("/")
        assert response.status_code == 200
        assert "message" in response.json()
        assert "version" in response.json()
    
    def test_health_check(self):
        """Test health check endpoint"""
        response = client.get("/api/v2/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "version" in data
    
    def test_login(self):
        """Test login endpoint"""
        response = client.post(
            "/api/v2/auth/login",
            data={"username": "admin", "password": "admin123"}
        )
        assert response.status_code == 200
        assert "access_token" in response.json()
        assert response.json()["token_type"] == "bearer"
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = client.post(
            "/api/v2/auth/login",
            data={"username": "admin", "password": "wrong"}
        )
        assert response.status_code == 401
    
    def test_upload_without_auth(self):
        """Test upload without authentication"""
        # Create a test file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(b"Test PDF content")
            tmp_path = tmp.name
        
        try:
            with open(tmp_path, "rb") as f:
                response = client.post(
                    "/api/v2/upload",
                    files={"file": ("test.pdf", f, "application/pdf")}
                )
            assert response.status_code == 401
        finally:
            os.unlink(tmp_path)
    
    def test_list_playbooks_with_auth(self):
        """Test list playbooks with authentication"""
        response = client.get(
            "/api/v2/playbooks",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "playbooks" in data
        assert "total" in data
        assert "page" in data
    
    def test_list_playbooks_pagination(self):
        """Test list playbooks with pagination"""
        response = client.get(
            "/api/v2/playbooks?page=1&page_size=5",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["page"] == 1
        assert data["page_size"] == 5
    
    def test_ask_question_without_playbook(self):
        """Test asking a question without specifying a playbook"""
        response = client.post(
            "/api/v2/ask",
            json={"question": "What are the brand colors?"},
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "answer" in data
        assert "passages" in data
        assert "confidence" in data
    
    def test_get_statistics(self):
        """Test get statistics endpoint"""
        response = client.get(
            "/api/v2/stats",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "vector_store" in data
        assert "token_usage" in data
        assert "api_version" in data

if __name__ == "__main__":
    pytest.main([__file__])
