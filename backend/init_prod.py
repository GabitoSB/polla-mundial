"""
Script de inicialización para producción.
- Elimina todas las predicciones
- Elimina todos los partidos
- Inserta los 104 partidos oficiales del Mundial 2026
- Conserva todos los usuarios (incluido admin)

Uso: python init_prod.py
Se ejecuta como Cloud Run Job (una sola vez, no en cada deploy).
"""
import os
import sys
from datetime import datetime, timezone

from app.core.database import SessionLocal
from app.models.match import Match
from app.models.prediction import Prediction


def dt(iso: str) -> datetime:
    return datetime.fromisoformat(iso).replace(tzinfo=timezone.utc)


MATCHES = [
    # ══════════════════════════════════════════════════════════════
    # FASE DE GRUPOS  (P1–P72)
    # ══════════════════════════════════════════════════════════════

    # ── Grupo A ──────────────────────────────────────────────────
    dict(match_number=1,  home_team="México",          away_team="Sudáfrica",        round_name="Grupo A", start_time=dt("2026-06-11T19:00:00")),
    dict(match_number=2,  home_team="Corea del Sur",   away_team="República Checa",  round_name="Grupo A", start_time=dt("2026-06-12T02:00:00")),
    dict(match_number=25, home_team="República Checa", away_team="Sudáfrica",        round_name="Grupo A", start_time=dt("2026-06-18T16:00:00")),
    dict(match_number=28, home_team="México",          away_team="Corea del Sur",    round_name="Grupo A", start_time=dt("2026-06-19T01:00:00")),
    dict(match_number=53, home_team="Sudáfrica",       away_team="Corea del Sur",    round_name="Grupo A", start_time=dt("2026-06-25T01:00:00")),
    dict(match_number=54, home_team="República Checa", away_team="México",           round_name="Grupo A", start_time=dt("2026-06-25T01:00:00")),

    # ── Grupo B ──────────────────────────────────────────────────
    dict(match_number=3,  home_team="Canadá",              away_team="Bosnia-Herzegovina", round_name="Grupo B", start_time=dt("2026-06-12T19:00:00")),
    dict(match_number=5,  home_team="Catar",               away_team="Suiza",              round_name="Grupo B", start_time=dt("2026-06-13T19:00:00")),
    dict(match_number=26, home_team="Suiza",               away_team="Bosnia-Herzegovina", round_name="Grupo B", start_time=dt("2026-06-18T19:00:00")),
    dict(match_number=27, home_team="Canadá",              away_team="Catar",              round_name="Grupo B", start_time=dt("2026-06-18T22:00:00")),
    dict(match_number=49, home_team="Suiza",               away_team="Canadá",             round_name="Grupo B", start_time=dt("2026-06-24T19:00:00")),
    dict(match_number=50, home_team="Bosnia-Herzegovina",  away_team="Catar",              round_name="Grupo B", start_time=dt("2026-06-24T19:00:00")),

    # ── Grupo C ──────────────────────────────────────────────────
    dict(match_number=6,  home_team="Brasil",    away_team="Marruecos", round_name="Grupo C", start_time=dt("2026-06-13T22:00:00")),
    dict(match_number=7,  home_team="Haití",     away_team="Escocia",   round_name="Grupo C", start_time=dt("2026-06-14T01:00:00")),
    dict(match_number=30, home_team="Escocia",   away_team="Marruecos", round_name="Grupo C", start_time=dt("2026-06-19T22:00:00")),
    dict(match_number=31, home_team="Brasil",    away_team="Haití",     round_name="Grupo C", start_time=dt("2026-06-20T00:30:00")),
    dict(match_number=51, home_team="Marruecos", away_team="Haití",     round_name="Grupo C", start_time=dt("2026-06-24T22:00:00")),
    dict(match_number=52, home_team="Brasil",    away_team="Escocia",   round_name="Grupo C", start_time=dt("2026-06-24T22:00:00")),

    # ── Grupo D ──────────────────────────────────────────────────
    dict(match_number=4,  home_team="Estados Unidos", away_team="Paraguay",        round_name="Grupo D", start_time=dt("2026-06-13T01:00:00")),
    dict(match_number=8,  home_team="Australia",      away_team="Turquía",         round_name="Grupo D", start_time=dt("2026-06-14T04:00:00")),
    dict(match_number=29, home_team="Estados Unidos", away_team="Australia",       round_name="Grupo D", start_time=dt("2026-06-19T19:00:00")),
    dict(match_number=32, home_team="Turquía",        away_team="Paraguay",        round_name="Grupo D", start_time=dt("2026-06-20T03:00:00")),
    dict(match_number=59, home_team="Paraguay",       away_team="Australia",       round_name="Grupo D", start_time=dt("2026-06-26T02:00:00")),
    dict(match_number=60, home_team="Turquía",        away_team="Estados Unidos",  round_name="Grupo D", start_time=dt("2026-06-26T02:00:00")),

    # ── Grupo E ──────────────────────────────────────────────────
    dict(match_number=9,  home_team="Alemania",        away_team="Curazao",         round_name="Grupo E", start_time=dt("2026-06-14T17:00:00")),
    dict(match_number=11, home_team="Costa de Marfil", away_team="Ecuador",         round_name="Grupo E", start_time=dt("2026-06-14T23:00:00")),
    dict(match_number=34, home_team="Alemania",        away_team="Costa de Marfil", round_name="Grupo E", start_time=dt("2026-06-20T20:00:00")),
    dict(match_number=35, home_team="Ecuador",         away_team="Curazao",         round_name="Grupo E", start_time=dt("2026-06-21T00:00:00")),
    dict(match_number=55, home_team="Curazao",         away_team="Costa de Marfil", round_name="Grupo E", start_time=dt("2026-06-25T20:00:00")),
    dict(match_number=56, home_team="Ecuador",         away_team="Alemania",        round_name="Grupo E", start_time=dt("2026-06-25T20:00:00")),

    # ── Grupo F ──────────────────────────────────────────────────
    dict(match_number=10, home_team="Países Bajos", away_team="Japón",         round_name="Grupo F", start_time=dt("2026-06-14T20:00:00")),
    dict(match_number=12, home_team="Suecia",       away_team="Túnez",         round_name="Grupo F", start_time=dt("2026-06-15T02:00:00")),
    dict(match_number=33, home_team="Países Bajos", away_team="Suecia",        round_name="Grupo F", start_time=dt("2026-06-20T17:00:00")),
    dict(match_number=36, home_team="Túnez",        away_team="Japón",         round_name="Grupo F", start_time=dt("2026-06-21T04:00:00")),
    dict(match_number=57, home_team="Japón",        away_team="Suecia",        round_name="Grupo F", start_time=dt("2026-06-25T23:00:00")),
    dict(match_number=58, home_team="Túnez",        away_team="Países Bajos",  round_name="Grupo F", start_time=dt("2026-06-25T23:00:00")),

    # ── Grupo G ──────────────────────────────────────────────────
    dict(match_number=14, home_team="Bélgica",      away_team="Egipto",        round_name="Grupo G", start_time=dt("2026-06-15T19:00:00")),
    dict(match_number=16, home_team="Irán",          away_team="Nueva Zelanda", round_name="Grupo G", start_time=dt("2026-06-16T01:00:00")),
    dict(match_number=38, home_team="Bélgica",       away_team="Irán",          round_name="Grupo G", start_time=dt("2026-06-21T19:00:00")),
    dict(match_number=40, home_team="Nueva Zelanda", away_team="Egipto",        round_name="Grupo G", start_time=dt("2026-06-22T01:00:00")),
    dict(match_number=65, home_team="Egipto",        away_team="Irán",          round_name="Grupo G", start_time=dt("2026-06-27T03:00:00")),
    dict(match_number=66, home_team="Nueva Zelanda", away_team="Bélgica",       round_name="Grupo G", start_time=dt("2026-06-27T03:00:00")),

    # ── Grupo H ──────────────────────────────────────────────────
    dict(match_number=13, home_team="España",       away_team="Cabo Verde",   round_name="Grupo H", start_time=dt("2026-06-15T16:00:00")),
    dict(match_number=15, home_team="Arabia Saudí", away_team="Uruguay",      round_name="Grupo H", start_time=dt("2026-06-15T22:00:00")),
    dict(match_number=37, home_team="España",       away_team="Arabia Saudí", round_name="Grupo H", start_time=dt("2026-06-21T16:00:00")),
    dict(match_number=39, home_team="Uruguay",      away_team="Cabo Verde",   round_name="Grupo H", start_time=dt("2026-06-21T22:00:00")),
    dict(match_number=63, home_team="Cabo Verde",   away_team="Arabia Saudí", round_name="Grupo H", start_time=dt("2026-06-27T00:00:00")),
    dict(match_number=64, home_team="Uruguay",      away_team="España",       round_name="Grupo H", start_time=dt("2026-06-27T00:00:00")),

    # ── Grupo I ──────────────────────────────────────────────────
    dict(match_number=17, home_team="Francia",  away_team="Senegal", round_name="Grupo I", start_time=dt("2026-06-16T19:00:00")),
    dict(match_number=18, home_team="Irak",     away_team="Noruega", round_name="Grupo I", start_time=dt("2026-06-16T22:00:00")),
    dict(match_number=42, home_team="Francia",  away_team="Irak",    round_name="Grupo I", start_time=dt("2026-06-22T21:00:00")),
    dict(match_number=43, home_team="Noruega",  away_team="Senegal", round_name="Grupo I", start_time=dt("2026-06-23T00:00:00")),
    dict(match_number=61, home_team="Noruega",  away_team="Francia", round_name="Grupo I", start_time=dt("2026-06-26T19:00:00")),
    dict(match_number=62, home_team="Senegal",  away_team="Irak",    round_name="Grupo I", start_time=dt("2026-06-26T19:00:00")),

    # ── Grupo J ──────────────────────────────────────────────────
    dict(match_number=19, home_team="Argentina", away_team="Argelia",  round_name="Grupo J", start_time=dt("2026-06-17T01:00:00")),
    dict(match_number=20, home_team="Austria",   away_team="Jordania", round_name="Grupo J", start_time=dt("2026-06-17T04:00:00")),
    dict(match_number=41, home_team="Argentina", away_team="Austria",  round_name="Grupo J", start_time=dt("2026-06-22T17:00:00")),
    dict(match_number=44, home_team="Jordania",  away_team="Argelia",  round_name="Grupo J", start_time=dt("2026-06-23T03:00:00")),
    dict(match_number=71, home_team="Argelia",   away_team="Austria",  round_name="Grupo J", start_time=dt("2026-06-28T02:00:00")),
    dict(match_number=72, home_team="Jordania",  away_team="Argentina",round_name="Grupo J", start_time=dt("2026-06-28T02:00:00")),

    # ── Grupo K ──────────────────────────────────────────────────
    dict(match_number=21, home_team="Portugal",   away_team="RD Congo",   round_name="Grupo K", start_time=dt("2026-06-17T17:00:00")),
    dict(match_number=24, home_team="Uzbekistán", away_team="Colombia",   round_name="Grupo K", start_time=dt("2026-06-18T02:00:00")),
    dict(match_number=45, home_team="Portugal",   away_team="Uzbekistán", round_name="Grupo K", start_time=dt("2026-06-23T17:00:00")),
    dict(match_number=48, home_team="Colombia",   away_team="RD Congo",   round_name="Grupo K", start_time=dt("2026-06-24T02:00:00")),
    dict(match_number=69, home_team="Colombia",   away_team="Portugal",   round_name="Grupo K", start_time=dt("2026-06-27T23:30:00")),
    dict(match_number=70, home_team="RD Congo",   away_team="Uzbekistán", round_name="Grupo K", start_time=dt("2026-06-27T23:30:00")),

    # ── Grupo L ──────────────────────────────────────────────────
    dict(match_number=22, home_team="Inglaterra", away_team="Croacia",    round_name="Grupo L", start_time=dt("2026-06-17T20:00:00")),
    dict(match_number=23, home_team="Ghana",      away_team="Panamá",     round_name="Grupo L", start_time=dt("2026-06-17T23:00:00")),
    dict(match_number=46, home_team="Inglaterra", away_team="Ghana",      round_name="Grupo L", start_time=dt("2026-06-23T20:00:00")),
    dict(match_number=47, home_team="Panamá",     away_team="Croacia",    round_name="Grupo L", start_time=dt("2026-06-23T23:00:00")),
    dict(match_number=67, home_team="Croacia",    away_team="Ghana",      round_name="Grupo L", start_time=dt("2026-06-27T21:00:00")),
    dict(match_number=68, home_team="Panamá",     away_team="Inglaterra", round_name="Grupo L", start_time=dt("2026-06-27T21:00:00")),

    # ══════════════════════════════════════════════════════════════
    # DIECISEISAVOS  (P73–P88)
    # ══════════════════════════════════════════════════════════════
    dict(match_number=73, home_team="2° Grupo A",  away_team="2° Grupo B",           round_name="Dieciseisavos", start_time=dt("2026-06-28T19:00:00")),
    dict(match_number=76, home_team="1° Grupo C",  away_team="2° Grupo F",           round_name="Dieciseisavos", start_time=dt("2026-06-29T17:00:00")),
    dict(match_number=74, home_team="1° Grupo E",  away_team="3° Grupos A/B/C/D/F",  round_name="Dieciseisavos", start_time=dt("2026-06-29T20:30:00")),
    dict(match_number=75, home_team="1° Grupo F",  away_team="2° Grupo C",           round_name="Dieciseisavos", start_time=dt("2026-06-30T01:00:00")),
    dict(match_number=78, home_team="2° Grupo E",  away_team="2° Grupo I",           round_name="Dieciseisavos", start_time=dt("2026-06-30T17:00:00")),
    dict(match_number=77, home_team="1° Grupo I",  away_team="3° Grupos C/D/F/G/H",  round_name="Dieciseisavos", start_time=dt("2026-06-30T21:00:00")),
    dict(match_number=79, home_team="1° Grupo A",  away_team="3° Grupos C/E/F/H/I",  round_name="Dieciseisavos", start_time=dt("2026-07-01T01:00:00")),
    dict(match_number=80, home_team="1° Grupo L",  away_team="3° Grupos E/H/I/J/K",  round_name="Dieciseisavos", start_time=dt("2026-07-01T16:00:00")),
    dict(match_number=82, home_team="1° Grupo G",  away_team="3° Grupos A/E/H/I/J",  round_name="Dieciseisavos", start_time=dt("2026-07-01T20:00:00")),
    dict(match_number=81, home_team="1° Grupo D",  away_team="3° Grupos B/E/F/I/J",  round_name="Dieciseisavos", start_time=dt("2026-07-02T00:00:00")),
    dict(match_number=84, home_team="1° Grupo H",  away_team="2° Grupo J",           round_name="Dieciseisavos", start_time=dt("2026-07-02T19:00:00")),
    dict(match_number=83, home_team="2° Grupo K",  away_team="2° Grupo L",           round_name="Dieciseisavos", start_time=dt("2026-07-02T23:00:00")),
    dict(match_number=85, home_team="1° Grupo B",  away_team="3° Grupos E/F/G/I/J",  round_name="Dieciseisavos", start_time=dt("2026-07-03T03:00:00")),
    dict(match_number=88, home_team="2° Grupo D",  away_team="2° Grupo G",           round_name="Dieciseisavos", start_time=dt("2026-07-03T18:00:00")),
    dict(match_number=86, home_team="1° Grupo J",  away_team="2° Grupo H",           round_name="Dieciseisavos", start_time=dt("2026-07-03T22:00:00")),
    dict(match_number=87, home_team="1° Grupo K",  away_team="3° Grupos D/E/I/J/L",  round_name="Dieciseisavos", start_time=dt("2026-07-04T01:30:00")),

    # ══════════════════════════════════════════════════════════════
    # OCTAVOS DE FINAL  (P89–P96)
    # ══════════════════════════════════════════════════════════════
    dict(match_number=90, home_team="Ganador P73", away_team="Ganador P75", round_name="Octavos de Final", start_time=dt("2026-07-04T17:00:00")),
    dict(match_number=89, home_team="Ganador P74", away_team="Ganador P77", round_name="Octavos de Final", start_time=dt("2026-07-04T21:00:00")),
    dict(match_number=91, home_team="Ganador P76", away_team="Ganador P78", round_name="Octavos de Final", start_time=dt("2026-07-05T20:00:00")),
    dict(match_number=92, home_team="Ganador P79", away_team="Ganador P80", round_name="Octavos de Final", start_time=dt("2026-07-06T00:00:00")),
    dict(match_number=93, home_team="Ganador P83", away_team="Ganador P84", round_name="Octavos de Final", start_time=dt("2026-07-06T19:00:00")),
    dict(match_number=94, home_team="Ganador P81", away_team="Ganador P82", round_name="Octavos de Final", start_time=dt("2026-07-07T00:00:00")),
    dict(match_number=95, home_team="Ganador P86", away_team="Ganador P88", round_name="Octavos de Final", start_time=dt("2026-07-07T16:00:00")),
    dict(match_number=96, home_team="Ganador P85", away_team="Ganador P87", round_name="Octavos de Final", start_time=dt("2026-07-07T20:00:00")),

    # ══════════════════════════════════════════════════════════════
    # CUARTOS DE FINAL  (P97–P100)
    # ══════════════════════════════════════════════════════════════
    dict(match_number=97,  home_team="Ganador P89", away_team="Ganador P90", round_name="Cuartos de Final", start_time=dt("2026-07-09T20:00:00")),
    dict(match_number=98,  home_team="Ganador P93", away_team="Ganador P94", round_name="Cuartos de Final", start_time=dt("2026-07-10T19:00:00")),
    dict(match_number=99,  home_team="Ganador P91", away_team="Ganador P92", round_name="Cuartos de Final", start_time=dt("2026-07-11T21:00:00")),
    dict(match_number=100, home_team="Ganador P95", away_team="Ganador P96", round_name="Cuartos de Final", start_time=dt("2026-07-12T01:00:00")),

    # ══════════════════════════════════════════════════════════════
    # SEMIFINALES  (P101–P102)
    # ══════════════════════════════════════════════════════════════
    dict(match_number=101, home_team="Ganador P97",  away_team="Ganador P98",  round_name="Semifinal", start_time=dt("2026-07-14T19:00:00")),
    dict(match_number=102, home_team="Ganador P99",  away_team="Ganador P100", round_name="Semifinal", start_time=dt("2026-07-15T19:00:00")),

    # ══════════════════════════════════════════════════════════════
    # TERCER PUESTO Y FINAL  (P103–P104)
    # ══════════════════════════════════════════════════════════════
    dict(match_number=103, home_team="Perdedor P101", away_team="Perdedor P102", round_name="Tercer Puesto", start_time=dt("2026-07-18T21:00:00")),
    dict(match_number=104, home_team="Ganador P101",  away_team="Ganador P102",  round_name="Final",         start_time=dt("2026-07-19T19:00:00")),
]


def main():
    db = SessionLocal()
    try:
        pred_count = db.query(Prediction).delete()
        print(f"Eliminadas {pred_count} predicciones.")

        match_count = db.query(Match).delete()
        print(f"Eliminados {match_count} partidos.")

        db.commit()

        for m in MATCHES:
            db.add(Match(**m))
        db.commit()

        print(f"\n{len(MATCHES)} partidos cargados exitosamente.")
        print("  - Grupos A–L (P1–P72):         72 partidos")
        print("  - Dieciseisavos (P73–P88):      16 partidos")
        print("  - Octavos de Final (P89–P96):    8 partidos")
        print("  - Cuartos de Final (P97–P100):   4 partidos")
        print("  - Semifinales (P101–P102):        2 partidos")
        print("  - Tercer Puesto + Final (P103–P104): 2 partidos")
        print("\nUsuarios conservados.")
    except Exception as e:
        db.rollback()
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
