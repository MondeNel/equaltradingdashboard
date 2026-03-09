import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_success(client: AsyncClient):
    res = await client.post("/api/auth/register", json={
        "email": "newuser@equal.test",
        "password": "SecurePass1",
        "display_name": "New User",
    })
    assert res.status_code == 201
    data = res.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    payload = {"email": "dup@equal.test", "password": "SecurePass1"}
    await client.post("/api/auth/register", json=payload)
    res = await client.post("/api/auth/register", json=payload)
    assert res.status_code == 409
    assert "already registered" in res.json()["detail"]


@pytest.mark.asyncio
async def test_register_short_password(client: AsyncClient):
    res = await client.post("/api/auth/register", json={
        "email": "short@equal.test",
        "password": "abc",
    })
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    await client.post("/api/auth/register", json={
        "email": "logintest@equal.test",
        "password": "SecurePass1",
    })
    res = await client.post("/api/auth/login", json={
        "email": "logintest@equal.test",
        "password": "SecurePass1",
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert "refresh_token" in data


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient):
    await client.post("/api/auth/register", json={
        "email": "wrongpass@equal.test",
        "password": "SecurePass1",
    })
    res = await client.post("/api/auth/login", json={
        "email": "wrongpass@equal.test",
        "password": "WrongPassword",
    })
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_login_unknown_email(client: AsyncClient):
    res = await client.post("/api/auth/login", json={
        "email": "nobody@equal.test",
        "password": "SecurePass1",
    })
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_token_refresh(client: AsyncClient):
    reg = await client.post("/api/auth/register", json={
        "email": "refresh@equal.test",
        "password": "SecurePass1",
    })
    refresh_token = reg.json()["refresh_token"]
    res = await client.post("/api/auth/refresh", json={"refresh_token": refresh_token})
    assert res.status_code == 200
    assert "access_token" in res.json()


@pytest.mark.asyncio
async def test_refresh_invalid_token(client: AsyncClient):
    res = await client.post("/api/auth/refresh", json={"refresh_token": "not.a.real.token"})
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_me_authenticated(client: AsyncClient, registered_user: dict):
    res = await client.get("/api/auth/me", headers=registered_user["headers"])
    assert res.status_code == 200
    assert res.json()["email"] == registered_user["user"].email


@pytest.mark.asyncio
async def test_me_unauthenticated(client: AsyncClient):
    res = await client.get("/api/auth/me")
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_me_invalid_token(client: AsyncClient):
    res = await client.get("/api/auth/me", headers={"Authorization": "Bearer invalid.token.here"})
    assert res.status_code == 401