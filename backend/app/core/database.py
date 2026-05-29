from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import settings

# psycopg3 requires the "postgresql+psycopg" dialect prefix.
# We normalise whatever URL format the user provides.
_db_url = settings.DATABASE_URL.replace(
    "postgresql://", "postgresql+psycopg://", 1
).replace(
    "postgres://", "postgresql+psycopg://", 1
)

engine = create_engine(_db_url)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
