# Workflow: Deploy Lead Management System

## Objective
Deploy the Benetic lead management API to a production environment (Railway or Render).

## Inputs
- Docker image built from the project root
- `.env` file with production credentials
- PostgreSQL database URL
- Redis URL

## Steps

### Local Development
1. **Start all services**
   - Command: `docker compose up --build`
   - Expected: App at http://localhost:8000/docs, Postgres on 5432, Redis on 6379

2. **Run migrations**
   - Command: `docker compose exec app alembic upgrade head`
   - Expected: All tables created in Postgres

3. **Run tests**
   - Command: `pip install pytest httpx && pytest tests/ -v`
   - Expected: All tests pass

### Railway Deployment
1. **Create project on Railway**
   - Add PostgreSQL plugin (provides DATABASE_URL)
   - Add Redis plugin (provides REDIS_URL)

2. **Set environment variables**
   - DATABASE_URL: from Railway Postgres plugin
   - REDIS_URL: from Railway Redis plugin
   - JWT_SECRET: generate with `python -c "import secrets; print(secrets.token_hex(32))"`
   - All other .env vars as needed

3. **Deploy app service**
   - Connect GitHub repo
   - Railway auto-detects Dockerfile
   - Set start command: `gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT`

4. **Deploy worker service**
   - Same repo, different start command: `celery -A app.workers.celery_app worker --loglevel=info`

5. **Deploy beat service**
   - Same repo: `celery -A app.workers.celery_app beat --loglevel=info`

6. **Run migrations**
   - Railway CLI: `railway run alembic upgrade head`

### Render Deployment
1. **Create services on Render**
   - Web service: Dockerfile, start command as above
   - Background worker: same Dockerfile, celery command
   - PostgreSQL: managed database
   - Redis: managed Redis instance

2. **Set env vars in Render dashboard** (same as Railway)

3. **Run migrations** via Render shell or deploy hook

## Outputs
- API accessible at the deployed URL
- `/health` returns `{"status": "ok"}`
- `/docs` shows interactive API documentation

## Edge Cases
- If migrations fail, check DATABASE_URL format (must be `postgresql://`, not `postgres://`)
- Railway free tier has sleep after inactivity — use a paid plan for production
- Celery beat should run as a single instance to avoid duplicate job scheduling

## Last Updated
2026-02-15 — Initial deployment SOP
