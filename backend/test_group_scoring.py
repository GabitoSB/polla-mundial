"""
Unit tests for group-stage scoring and bracket propagation.
Run: python test_group_scoring.py
"""
from app.services.scoring import score_prediction


def test_group_base_points():
    """Fase de grupos: solo puntos base (5/3/0), sin bonos de eliminatoria."""
    cases = [
        ((2, 1), (2, 1), 5),
        ((3, 1), (2, 1), 3),
        ((1, 0), (2, 1), 3),
        ((0, 2), (2, 1), 0),
        ((1, 1), (1, 1), 5),
        ((0, 0), (1, 1), 3),
    ]
    for pred, real, expected in cases:
        pts = score_prediction(*pred, *real, round_name="Grupo A")
        assert pts == expected, f"pred={pred} real={real}: got {pts}, want {expected}"

    # Sin bono en grupos; con bono en eliminatorias
    assert score_prediction(2, 1, 2, 1, round_name="Grupo A") == 5
    assert score_prediction(2, 1, 2, 1, round_name="Dieciseisavos") == 6


def test_grupo_a_standings():
    """Simula los 6 partidos del Grupo A y verifica el orden de la tabla."""
    results = [
        ("México", "Sudáfrica", 2, 0),
        ("Corea del Sur", "República Checa", 1, 1),
        ("República Checa", "Sudáfrica", 0, 1),
        ("México", "Corea del Sur", 3, 1),
        ("Sudáfrica", "Corea del Sur", 0, 2),
        ("República Checa", "México", 1, 2),
    ]
    teams: dict[str, dict] = {}
    for h, a, hs, aws in results:
        for team, gf, ga in [(h, hs, aws), (a, aws, hs)]:
            if team not in teams:
                teams[team] = {"pts": 0, "gf": 0, "ga": 0}
            teams[team]["pts"] += 3 if gf > ga else (1 if gf == ga else 0)
            teams[team]["gf"] += gf
            teams[team]["ga"] += ga

    sorted_teams = sorted(
        teams.items(),
        key=lambda x: (-x[1]["pts"], -(x[1]["gf"] - x[1]["ga"]), -x[1]["gf"], x[0]),
    )

    assert sorted_teams[0][0] == "México"
    assert sorted_teams[1][0] == "Corea del Sur"
    assert sorted_teams[2][0] == "Sudáfrica"
    assert sorted_teams[3][0] == "República Checa"


def test_grupo_a_knockout_placeholders():
    """Verifica que los placeholders 1°/2° Grupo A se resuelven correctamente."""
    results = [
        ("México", "Sudáfrica", 2, 0),
        ("Corea del Sur", "República Checa", 1, 1),
        ("República Checa", "Sudáfrica", 0, 1),
        ("México", "Corea del Sur", 3, 1),
        ("Sudáfrica", "Corea del Sur", 0, 2),
        ("República Checa", "México", 1, 2),
    ]
    teams: dict[str, dict] = {}
    for h, a, hs, aws in results:
        for team, gf, ga in [(h, hs, aws), (a, aws, hs)]:
            if team not in teams:
                teams[team] = {"pts": 0, "gf": 0, "ga": 0}
            teams[team]["pts"] += 3 if gf > ga else (1 if gf == ga else 0)
            teams[team]["gf"] += gf
            teams[team]["ga"] += ga

    sorted_teams = sorted(
        teams.items(),
        key=lambda x: (-x[1]["pts"], -(x[1]["gf"] - x[1]["ga"]), -x[1]["gf"], x[0]),
    )

    gl = "A"
    replacements: dict[str, str] = {}
    replacements[f"1° Grupo {gl}"] = sorted_teams[0][0]
    replacements[f"2° Grupo {gl}"] = sorted_teams[1][0]
    replacements[f"3° Grupo {gl}"] = sorted_teams[2][0]

    # P73: 2° Grupo A vs 2° Grupo B
    assert replacements["2° Grupo A"] == "Corea del Sur"
    # P79: 1° Grupo A vs 3° Grupos C/E/F/H/I
    assert replacements["1° Grupo A"] == "México"


def test_partial_group_does_not_propagate():
    """Con solo P1 y P2 jugados, el grupo no está completo → no hay propagación."""
    group_matches = [
        {"home_score": 2, "away_score": 0},
        {"home_score": 1, "away_score": 1},
        {"home_score": None, "away_score": None},
        {"home_score": None, "away_score": None},
        {"home_score": None, "away_score": None},
        {"home_score": None, "away_score": None},
    ]
    all_done = all(
        m["home_score"] is not None and m["away_score"] is not None for m in group_matches
    )
    assert not all_done


def test_partial_count_includes_all_winner_hits():
    """Parciales = ganador/empate correcto sin marcador exacto (3 pts)."""
    from app.services.scoring import _sign

    real_home, real_away = 1, 0
    preds = [(2, 1), (3, 1), (2, 0), (1, 0)]
    partials = sum(
        1
        for ph, pa in preds
        if not (ph == real_home and pa == real_away)
        and _sign(ph - pa) == _sign(real_home - real_away)
    )
    assert partials == 3  # 2-1, 3-1, 2-0; 1-0 es exacto


if __name__ == "__main__":
    test_group_base_points()
    test_grupo_a_standings()
    test_grupo_a_knockout_placeholders()
    test_partial_group_does_not_propagate()
    test_partial_count_includes_all_winner_hits()
    print("OK: todos los tests de fase de grupos pasaron")
