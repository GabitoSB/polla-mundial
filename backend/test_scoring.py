"""
Integration test for the scoring system.
Uses timestamped usernames so each run is fully isolated.

Scenarios tested:
  A) Exact result                          -> 5 pts, 1 exacto
  B) Correct winner + partial goal hit     -> 3 pts, 1 parcial
  C) Correct winner, no partial hit        -> 3 pts, 0 parciales
  D) Wrong outcome                         -> 0 pts
  E) Result correction -> points recalculated correctly
"""
import time
import requests

BASE = "http://localhost:8000"
RUN = str(int(time.time()))[-5:]   # 5-char suffix to ensure uniqueness


def login(username, password):
    r = requests.post(f"{BASE}/auth/login", data={"username": username, "password": password})
    assert r.status_code == 200, f"Login failed for {username}: {r.text}"
    return r.json()["access_token"]


def auth(token):
    return {"Authorization": f"Bearer {token}"}


# ── Auth ──────────────────────────────────────────────────────────────────────
admin_tok = login("admin", "admin1234")

users = {}
for label in ["a", "b", "c", "d"]:
    uname = f"u{label}_{RUN}"
    r = requests.post(f"{BASE}/auth/register", json={
        "username": uname, "email": f"{uname}@test.com", "password": "pass1234"
    })
    assert r.status_code == 201, f"Register failed: {r.text}"
    users[label] = login(uname, "pass1234")
    print(f"  Usuario creado: {uname}")

# ── Create match (future so predictions are accepted) ─────────────────────────
r = requests.post(f"{BASE}/matches/", headers=auth(admin_tok), json={
    "home_team": "España", "away_team": "Inglaterra",
    "start_time": "2030-07-14T20:00:00Z"
})
assert r.status_code == 201
match_id = r.json()["id"]
print(f"\nPartido creado: id={match_id} (España vs Inglaterra)")

# ── Users submit predictions ──────────────────────────────────────────────────
# Real result will be España 2-1 Inglaterra
preds = {"a": (2, 1), "b": (3, 1), "c": (1, 0), "d": (0, 2)}
pred_ids = {}
for label, (ph, pa) in preds.items():
    r = requests.post(f"{BASE}/predictions/", headers=auth(users[label]), json={
        "match_id": match_id, "predicted_home": ph, "predicted_away": pa
    })
    assert r.status_code == 201, f"Prediction failed: {r.text}"
    pred_ids[label] = r.json()["id"]
    print(f"  u{label} predice {ph}-{pa}")

# ── Admin loads real result: España 2-1 Inglaterra ───────────────────────────
r = requests.put(f"{BASE}/matches/{match_id}/result", headers=auth(admin_tok),
                 json={"home_score": 2, "away_score": 1})
assert r.status_code == 200
print(f"\nResultado cargado: España 2-1 Inglaterra")

# ── Check leaderboard ─────────────────────────────────────────────────────────
lb = requests.get(f"{BASE}/leaderboard/", headers=auth(admin_tok)).json()
name_map = {f"u{l}_{RUN}": l for l in "abcd"}
by_label = {name_map[e["username"]]: e for e in lb if e["username"] in name_map}

print("\n=== TABLA DE POSICIONES ===")
for label in "abcd":
    e = by_label[label]
    print(f"  #{e['rank']:2d} u{label}  pts={e['total_points']}  "
          f"exactos={e['exact_results']}  parciales={e['partial_score_hits']}")

# España 2-1 / pred (2-1) exact  -> 5 pts, 1 exacto, 0 parcial
assert by_label["a"]["total_points"] == 5,       "a: 5 pts (exacto)"
assert by_label["a"]["exact_results"] == 1,      "a: 1 exacto"
assert by_label["a"]["partial_score_hits"] == 0, "a: 0 parciales (es exacto)"

# España 2-1 / pred (3-1) ganador + away hit -> 3 pts, 0 exactos, 1 parcial
assert by_label["b"]["total_points"] == 3,       "b: 3 pts"
assert by_label["b"]["exact_results"] == 0,      "b: 0 exactos"
assert by_label["b"]["partial_score_hits"] == 1, "b: 1 parcial (away 1==1)"

# España 2-1 / pred (1-0) ganador, sin hit -> 3 pts, 0 exactos, 0 parciales
assert by_label["c"]["total_points"] == 3,       "c: 3 pts"
assert by_label["c"]["partial_score_hits"] == 0, "c: 0 parciales (1≠2, 0≠1)"

# España 2-1 / pred (0-2) resultado incorrecto -> 0 pts
assert by_label["d"]["total_points"] == 0,       "d: 0 pts"

print("\n✓ Primera ronda de assertions OK")

# ── Test result correction ────────────────────────────────────────────────────
# Nuevo resultado: España 3-0 Inglaterra
# a (2-1): local gana → 3 pts, sin parcial (2≠3, 1≠0)
# b (3-1): local gana → 3 pts, parcial home (3==3 ✓)
# c (1-0): local gana → 3 pts, parcial away (0==0 ✓)
# d (0-2): local pierde → 0 pts
print("\nCorrigiendo resultado a España 3-0 Inglaterra...")
r = requests.put(f"{BASE}/matches/{match_id}/result", headers=auth(admin_tok),
                 json={"home_score": 3, "away_score": 0})
assert r.status_code == 200

lb2 = requests.get(f"{BASE}/leaderboard/", headers=auth(admin_tok)).json()
by_label2 = {name_map[e["username"]]: e for e in lb2 if e["username"] in name_map}

print("tras corrección (3-0):")
for label in "abcd":
    e = by_label2[label]
    print(f"  #{e['rank']:2d} u{label}  pts={e['total_points']}  "
          f"exactos={e['exact_results']}  parciales={e['partial_score_hits']}")

assert by_label2["a"]["total_points"] == 3,          "a: 3 pts (ganador local)"
assert by_label2["a"]["exact_results"] == 0,         "a: 0 exactos"
assert by_label2["a"]["partial_score_hits"] == 0,    "a: 0 parciales (2≠3, 1≠0)"

assert by_label2["b"]["total_points"] == 3,          "b: 3 pts"
assert by_label2["b"]["partial_score_hits"] == 1,    "b: parcial home (3==3)"

assert by_label2["c"]["total_points"] == 3,          "c: 3 pts"
assert by_label2["c"]["partial_score_hits"] == 1,    "c: parcial away (0==0)"

assert by_label2["d"]["total_points"] == 0,          "d: 0 pts"

print("\n✓ Todos los tests pasaron correctamente")
