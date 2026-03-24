# PingSight

A FastAPI-based monitoring application.

## Project Structure

```
pingSight/
├── backend/           # FastAPI backend application
│   ├── .venv/        # Virtual environment (only one needed)
│   ├── app/          # Application code
│   ├── alembic/      # Database migrations
│   └── pyproject.toml # Python dependencies
├── .gitignore
└── README.md
```

## Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Activate the virtual environment:
   ```bash
   source .venv/bin/activate  # Linux/Mac
   # or
   .venv\Scripts\activate     # Windows
   ```

3. Install dependencies:
   ```bash
   uv sync
   ```

4. Run the application:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

## Development

All development should be done within the `backend/` directory using the virtual environment located at `backend/.venv/`.