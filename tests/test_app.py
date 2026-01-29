from fastapi.testclient import TestClient

from src.app import app


client = TestClient(app)


def test_get_activities_includes_known_activity():
    response = client.get("/activities")
    assert response.status_code == 200
    payload = response.json()
    assert "Chess Club" in payload
    assert "participants" in payload["Chess Club"]


def test_signup_adds_participant():
    email = "pytest-student@mergington.edu"
    response = client.post(
        "/activities/Chess%20Club/signup",
        params={"email": email},
    )
    assert response.status_code == 200

    participants = client.get("/activities/Chess%20Club/participants").json()["participants"]
    assert email in participants


def test_signup_duplicate_participant_rejected():
    email = "pytest-dup@mergington.edu"
    first = client.post(
        "/activities/Programming%20Class/signup",
        params={"email": email},
    )
    assert first.status_code == 200

    second = client.post(
        "/activities/Programming%20Class/signup",
        params={"email": email},
    )
    assert second.status_code == 400
    assert second.json()["detail"] == "Student already signed up for this activity"


def test_unregister_participant_removes_from_activity():
    email = "pytest-remove@mergington.edu"
    signup = client.post(
        "/activities/Gym%20Class/signup",
        params={"email": email},
    )
    assert signup.status_code == 200

    remove = client.delete(
        "/activities/Gym%20Class/participants",
        params={"email": email},
    )
    assert remove.status_code == 200

    participants = client.get("/activities/Gym%20Class/participants").json()["participants"]
    assert email not in participants


def test_unregister_missing_participant_returns_404():
    response = client.delete(
        "/activities/Science%20Club/participants",
        params={"email": "missing-student@mergington.edu"},
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Participant not found"
