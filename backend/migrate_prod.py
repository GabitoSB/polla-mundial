"""
Aplica migraciones en producción.
Si la BD ya tiene tablas pero sin historial de Alembic, marca ff9e8dff82e5 y luego upgrade head.
"""
from alembic import command
from alembic.config import Config
from alembic.runtime.migration import MigrationContext
from sqlalchemy import create_engine

from app.core.config import settings

STAMP_IF_EMPTY = "ff9e8dff82e5"


def main() -> None:
    cfg = Config("alembic.ini")
    cfg.set_main_option("sqlalchemy.url", settings.DATABASE_URL)
    engine = create_engine(settings.DATABASE_URL)

    with engine.connect() as conn:
        ctx = MigrationContext.configure(conn)
        current = ctx.get_current_revision()

    if current is None:
        print(f"Sin version en alembic_version; stamp {STAMP_IF_EMPTY}")
        command.stamp(cfg, STAMP_IF_EMPTY)
    else:
        print(f"Revision actual: {current}")

    print("Ejecutando upgrade head...")
    command.upgrade(cfg, "head")
    print("Migraciones aplicadas.")


if __name__ == "__main__":
    main()
