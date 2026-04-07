# Backend Startup Guide

## Prerequisites

The backend requires:
- Python 3.10 or higher
- PostgreSQL database running
- `uv` package manager (or pip/poetry)

## Quick Start

### 1. Install Dependencies

The backend uses `uv` for dependency management. If you don't have it installed:

```bash
# Install uv (Python package manager)
curl -LsSf https://astral.sh/uv/install.sh | sh
# OR
pip install uv
```

Then install project dependencies:

```bash
cd backend
uv sync
```

### 2. Configure Environment

Make sure `.env` file exists in `backend/` directory with:

```env
DATABASE_URL=postgresql+psycopg://user:password@localhost:5432/pingsight
SECRET_KEY=your-secret-key-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 3. Run Database Migrations

Apply all pending migrations including the new Slack notifications:

```bash
cd backend
alembic upgrade head
```

This will apply:
- Initial migration
- User notification settings
- Slack notifications (new)
- Status pages
- All other migrations

### 4. Start the Backend

```bash
cd backend
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Or if using the virtual environment directly:

```bash
cd backend
source .venv/bin/activate  # On Linux/Mac
# OR
.venv\Scripts\activate  # On Windows

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend will start on `http://localhost:8000`

### 5. Verify Backend is Running

Open your browser and go to:
- API docs: http://localhost:8000/docs
- Health check: http://localhost:8000/api/status

## Common Issues

### Issue: "ModuleNotFoundError: No module named 'dotenv'"

**Solution**: Install dependencies
```bash
cd backend
uv sync
```

### Issue: "alembic.util.exc.CommandError: Can't locate revision identified by..."

**Solution**: Reset migrations or check migration order
```bash
cd backend
alembic downgrade base
alembic upgrade head
```

### Issue: "sqlalchemy.exc.OperationalError: could not connect to server"

**Solution**: Make sure PostgreSQL is running
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql  # Linux
brew services list  # Mac

# Start PostgreSQL if needed
sudo systemctl start postgresql  # Linux
brew services start postgresql  # Mac
```

### Issue: "Port 8000 already in use"

**Solution**: Kill the existing process or use a different port
```bash
# Find process using port 8000
lsof -i :8000  # Mac/Linux
netstat -ano | findstr :8000  # Windows

# Kill the process
kill -9 <PID>  # Mac/Linux
taskkill /PID <PID> /F  # Windows

# Or use a different port
uvicorn app.main:app --reload --port 8001
```

## Development Workflow

### Running Backend with Auto-Reload

The `--reload` flag automatically restarts the server when code changes:

```bash
cd backend
uv run uvicorn app.main:app --reload
```

### Running Background Workers

The monitoring engine runs automatically when the backend starts. To run it separately:

```bash
cd backend
uv run python -m app.worker.engine
```

### Viewing Logs

Backend logs are written to `backend/backend.log`:

```bash
tail -f backend/backend.log
```

### Testing API Endpoints

Use the interactive API docs at http://localhost:8000/docs

Or use curl:

```bash
# Health check
curl http://localhost:8000/api/status

# List monitors (requires authentication)
curl -X GET http://localhost:8000/api/monitors \
  -H "Cookie: session=your-session-cookie"
```

## Production Deployment

### Using Gunicorn (Recommended)

```bash
cd backend
uv run gunicorn app.main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --access-logfile - \
  --error-logfile -
```

### Using Docker

```dockerfile
FROM python:3.12-slim

WORKDIR /app

# Install uv
RUN pip install uv

# Copy project files
COPY pyproject.toml uv.lock ./
COPY app ./app
COPY alembic ./alembic
COPY alembic.ini ./

# Install dependencies
RUN uv sync --frozen

# Run migrations and start server
CMD alembic upgrade head && \
    uv run uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Environment Variables for Production

```env
DATABASE_URL=postgresql+psycopg://user:password@db-host:5432/pingsight
SECRET_KEY=generate-a-strong-random-key
GOOGLE_CLIENT_ID=your-production-client-id
GOOGLE_CLIENT_SECRET=your-production-client-secret
ENVIRONMENT=production
LOG_LEVEL=INFO
```

## Monitoring

### Health Checks

The backend exposes a health check endpoint:

```bash
curl http://localhost:8000/api/status
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2026-04-07T12:00:00Z"
}
```

### Database Connection

Check database connectivity:

```bash
cd backend
uv run python -c "from app.db.session import engine; print('DB OK' if engine else 'DB FAIL')"
```

### Worker Status

Check if background workers are running:

```bash
ps aux | grep "app.worker"
```

## Troubleshooting

### Backend starts but frontend can't connect

1. Check CORS settings in `backend/app/main.py`
2. Verify frontend is using correct API URL
3. Check browser console for CORS errors
4. Ensure credentials: 'include' is set in fetch calls

### Migrations fail

1. Check database connection
2. Verify migration files are not corrupted
3. Check for conflicting migrations
4. Review alembic version table: `SELECT * FROM alembic_version;`

### Authentication not working

1. Verify Google OAuth credentials
2. Check callback URL matches Google Console
3. Ensure SECRET_KEY is set
4. Check cookie settings (httpOnly, secure, sameSite)

## Next Steps

After starting the backend:

1. Start the frontend: `cd frontend && npm run dev`
2. Open http://localhost:3000
3. Login with Google OAuth
4. Configure notification settings (Discord/Slack)
5. Create your first monitor

## Support

For issues:
1. Check logs: `tail -f backend/backend.log`
2. Review API docs: http://localhost:8000/docs
3. Check database: `psql -d pingsight -c "SELECT * FROM users;"`
4. Verify environment variables: `env | grep DATABASE_URL`
