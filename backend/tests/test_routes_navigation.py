def test_routes_directions_api(client):
    """Verifies route directions calculation, ETA estimation, and polyline coordinates."""
    res = client.get("/api/v1/routes/directions?origin_lat=12.9716&origin_lng=77.5946&dest_lat=12.9352&dest_lng=77.6245&mode=driving")
    assert res.status_code == 200
    data = res.get_json()
    assert "distance_km" in data
    assert data["distance_km"] > 0
    assert "duration_minutes" in data
    assert data["duration_minutes"] > 0
    assert "route_coordinates" in data
    assert len(data["route_coordinates"]) >= 2
    assert "turn_by_turn" in data
    assert len(data["turn_by_turn"]) > 0
    assert "fssai_safety" in data
    assert data["mode"] == "driving"

def test_routes_directions_missing_coords(client):
    """Verifies that missing coordinates return a 400 Bad Request error."""
    res = client.get("/api/v1/routes/directions?origin_lat=12.9716")
    assert res.status_code == 400
    assert "error" in res.get_json()

def test_routes_geocoding_api(client):
    """Verifies area geocoding search for Bangalore landmarks."""
    res = client.get("/api/v1/routes/geocode?query=Indiranagar")
    assert res.status_code == 200
    data = res.get_json()
    assert "results" in data
    assert len(data["results"]) > 0
    first = data["results"][0]
    assert "Indiranagar" in first["label"]
    assert "lat" in first
    assert "lng" in first
