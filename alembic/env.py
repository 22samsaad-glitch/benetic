from logging.config import fileConfig
import os

from alembic import context
from sqlalchemy import create_engine, pool

from app.database import Base
from app.models import *  # noqa: F401,F403 — ensure all models are loaded

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

# Build the URL directly from the environment — never fall back to alembic.ini.
# This guarantees Render/Railway's DATABASE_URL is always used.
_db_url = os.environ.get("DATABASE_URL", "sqlite:///./jetleads.db")
if _db_url.startswith("postgres://"):
    _db_url = _db_url.replace("postgres://", "postgresql://", 1)

print("ALEMBIC DATABASE_URL:", _db_url)


def run_migrations_offline() -> None:
    context.configure(
        url=_db_url,
        target_metadata=target_metadata,
        literal_binds=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    # Build engine directly — do NOT use engine_from_config which can
    # read stale values from alembic.ini instead of the environment.
    connectable = create_engine(_db_url, poolclass=pool.NullPool)
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
