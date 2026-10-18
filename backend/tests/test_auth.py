import pytest
from app.services.auth_service import verify_password, get_password_hash, create_access_token
import jwt
from app.config import settings

def test_password_hashing():
    pwd = "secret_password_123"
    hashed = get_password_hash(pwd)
    assert hashed != pwd
    assert verify_password(pwd, hashed) is True
    assert verify_password("wrong_password", hashed) is False

def test_jwt_token_creation():
    data = {"sub": "101", "role": "candidate"}
    token = create_access_token(data)
    assert isinstance(token, str)
    decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    assert decoded["sub"] == "101"
    assert decoded["role"] == "candidate"
    assert "exp" in decoded
