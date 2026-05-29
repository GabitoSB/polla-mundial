# ⚽ Polla Mundial

Plataforma web de predicciones para el Mundial de Fútbol. Los usuarios se registran, predicen resultados de partidos y compiten en una tabla de posiciones con sistema de puntuación y desempate.

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19 + Vite + Tailwind CSS |
| Backend | Python + FastAPI + SQLAlchemy |
| Base de datos | PostgreSQL |
| Autenticación | JWT (python-jose + bcrypt) |
| Migraciones | Alembic |

---

## Reglas de Puntuación

| Resultado | Puntos |
|-----------|--------|
| Resultado exacto (ej. predice 2-1 y sale 2-1) | **5 pts** |
| Ganador o empate correcto (ej. predice 1-0 y sale 3-0) | **3 pts** |
| Incorrecto | **0 pts** |

### Criterios de Desempate (Tabla de Posiciones)
1. Mayor cantidad de **puntos totales**
2. Mayor cantidad de **resultados exactos** (5 pts)
3. Mayor cantidad de veces que acertó los **goles de al menos un equipo** (ej. predice 2-1 y sale 2-0 → el "2" coincide)

---

## Estructura del Proyecto

```
polla-frontend/           ← raíz del repositorio
├── src/                  ← Frontend React
│   ├── api/              ← Clientes axios (auth, matches, predictions, leaderboard)
│   ├── context/          ← AuthContext (estado global del usuario)
│   ├── components/       ← Navbar, MatchCard, ProtectedRoute
│   └── pages/            ← Login, Register, Matches, Leaderboard, Admin
├── backend/              ← Backend FastAPI
│   ├── app/
│   │   ├── api/          ← Routers (auth, matches, predictions, leaderboard)
│   │   ├── core/         ← Config, DB session, Security (JWT + bcrypt)
│   │   ├── models/       ← SQLAlchemy models (User, Match, Prediction)
│   │   ├── schemas/      ← Pydantic schemas
│   │   ├── services/     ← scoring.py (lógica de puntuación)
│   │   └── main.py       ← FastAPI app + CORS + routers
│   ├── alembic/          ← Migraciones de base de datos
│   ├── requirements.txt
│   └── .env.example
└── README.md
```

---

## Instalación y Ejecución

### Requisitos previos
- Python 3.12+ (recomendado) o 3.14+
- Node.js 18+
- PostgreSQL 14+

---

### Backend

```bash
# 1. Entrar a la carpeta del backend
cd backend

# 2. Crear y activar entorno virtual
python -m venv venv

# Windows
venv\Scripts\activate
# Linux / Mac
source venv/bin/activate

# 3. Instalar dependencias
pip install -r requirements.txt

# 4. Configurar variables de entorno
copy .env.example .env
# Editar .env con tus credenciales de PostgreSQL
```

Contenido del `.env`:
```env
DATABASE_URL=postgresql://postgres:TU_CONTRASEÑA@localhost:5432/polla_db
SECRET_KEY=cambia-esta-clave-secreta-en-produccion
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
```

```bash
# 5. Crear la base de datos
python create_db.py

# 6. Aplicar migraciones
alembic revision --autogenerate -m "initial schema"
alembic upgrade head

# 7. Crear usuario administrador
python create_admin.py

# 8. Iniciar el servidor (queda en http://localhost:8000)
uvicorn app.main:app --reload
```

Documentación interactiva de la API: **http://localhost:8000/docs**

---

### Frontend

```bash
# Desde la raíz del proyecto (no desde /backend)
npm install
npm run dev
```

La app queda disponible en **http://localhost:5173**

---

## Credenciales por defecto

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| `admin` | `admin1234` | Administrador |

> Cambiá la contraseña del admin en producción.

---

## Funcionalidades

### Usuarios
- Registro e inicio de sesión con JWT
- Las predicciones se bloquean automáticamente cuando comienza el partido
- Se puede modificar la predicción hasta el inicio del partido
- Vista de todos los partidos con estado (Abierto / En curso / Finalizado)
- Tabla de posiciones con desempate por exactos y parciales

### Administrador
- Panel dedicado con estadísticas del torneo
- Crear enfrentamientos con equipo local, visitante, fase y fecha/hora
- Cargar y corregir resultados (el sistema recalcula puntos automáticamente)
- Eliminar partidos sin resultado

---

## API Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/auth/register` | Registrar usuario |
| `POST` | `/auth/login` | Login → JWT |
| `GET` | `/auth/me` | Perfil del usuario autenticado |
| `GET` | `/matches/` | Listar partidos |
| `POST` | `/matches/` | Crear partido *(admin)* |
| `DELETE` | `/matches/{id}` | Eliminar partido *(admin)* |
| `PUT` | `/matches/{id}/result` | Cargar resultado *(admin)* |
| `POST` | `/predictions/` | Enviar predicción |
| `PUT` | `/predictions/{id}` | Modificar predicción |
| `GET` | `/predictions/my` | Mis predicciones |
| `GET` | `/leaderboard/` | Tabla de posiciones |
