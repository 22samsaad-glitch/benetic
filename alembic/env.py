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

# Hard-require DATABASE_URL — raises KeyError immediately if not set,
# so we never silently fall back to SQLite on Render/Railway.
_raw_url = os.environ["DATABASE_URL"]
if _raw_url.startswith("postgres://"):
    _raw_url = _raw_url.replace("postgres://", "postgresql://", 1)

print("ALEMBIC CONNECTING TO:", _raw_url[:40], "...")


def run_migrations_offline() -> None:
    context.configure(
        url=_raw_url,
        target_metadata=target_metadata,
        literal_binds=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = create_engine(_raw_url, poolclass=pool.NullPool)
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
