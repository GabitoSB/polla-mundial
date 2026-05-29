# Polla Mundial — Backend

FastAPI + SQLAlchemy + PostgreSQL

## Setup

### 1. Crear entorno virtual e instalar dependencias

```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
# Editar .env con tus credenciales de PostgreSQL
```

### 3. Crear la base de datos

```sql
CREATE DATABASE polla_db;
```

### 4. Ejecutar migraciones

```bash
alembic revision --autogenerate -m "initial schema"
alembic upgrade head
```

### 5. Iniciar el servidor

```bash
uvicorn app.main:app --reload
```

La API estará disponible en `http://localhost:8000`  
Documentación interactiva: `http://localhost:8000/docs`

## Estructura

```
backend/
├── app/
│   ├── core/
│   │   ├── config.py       # Variables de entorno (Pydantic Settings)
│   │   └── database.py     # Engine y sesión de SQLAlchemy
│   ├── models/
│   │   ├── user.py         # Modelo User con stats de desempate
│   │   ├── match.py        # Modelo Match con start_time y resultado real
│   │   └── prediction.py   # Modelo Prediction (unique por user+match)
│   └── main.py             # App FastAPI + CORS + creación de tablas
├── alembic/                # Migraciones
├── requirements.txt
└── .env.example
```

## Modelos

### User
| Campo              | Tipo    | Descripción                              |
|--------------------|---------|------------------------------------------|
| total_points       | int     | Criterio 1: suma total de puntos         |
| exact_results      | int     | Criterio 2: resultados exactos (5 pts)   |
| partial_score_hits | int     | Criterio 3: goles de un equipo acertados |

### Match
| Campo       | Tipo     | Descripción                              |
|-------------|----------|------------------------------------------|
| start_time  | datetime | Predicciones se bloquean en este momento |
| home_score  | int/null | NULL = partido no jugado aún             |
| away_score  | int/null |                                          |

### Prediction
- Restricción UNIQUE en (user_id, match_id) — una predicción por partido por usuario
- `points` es NULL hasta que el admin carga el resultado real
