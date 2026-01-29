# MediVision AI - Developer Guide

## Project Structure

```
medivision-ai/
├── ai/                          # AI modules
│   ├── image_processing/        # DICOM processing, filters
│   ├── transformers/            # Swin Transformer
│   ├── multimodal/              # CLIP image-text
│   ├── llm/                     # Report generation
│   ├── speech/                  # Whisper transcription
│   ├── explainability/          # Attention, Grad-CAM
│   ├── inference/               # Unified inference
│   ├── gan/                     # Speckle augmentation
│   └── diffusion/               # Counterfactual inpainting
│
├── backend/                     # FastAPI backend
│   ├── app/
│   │   ├── main.py             # Application entry
│   │   ├── core/               # Config, security, logging
│   │   ├── db/                 # Models, session
│   │   └── api/                # Endpoints
│   ├── tests/                  # Pytest tests
│   └── alembic/                # Migrations
│
├── frontend/                    # Next.js frontend
│   ├── src/
│   │   ├── app/                # Pages (App Router)
│   │   ├── components/         # React components
│   │   ├── lib/                # API client
│   │   └── store/              # Zustand state
│   └── public/                 # Static assets
│
├── nginx/                       # Reverse proxy config
├── monitoring/                  # Prometheus & Grafana
└── docs/                        # Documentation
```

---

## Development Setup

### Prerequisites

- Python 3.11+
- Node.js 20+
- Docker & Docker Compose
- CUDA 11.8+ (for GPU)

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

### Database

```bash
# Start PostgreSQL & Redis
docker-compose up -d postgres redis

# Run migrations
cd backend
alembic upgrade head
```

---

## Code Style

### Python

We use:

- **Ruff** for linting
- **Black** for formatting
- **isort** for imports

```bash
# Format code
black app/
isort app/

# Check linting
ruff check app/
```

### TypeScript

We use:

- **ESLint** for linting
- **Prettier** for formatting

```bash
npm run lint
npm run format
```

---

## Testing

### Backend Tests

```bash
cd backend

# Run all tests
pytest tests/ -v

# With coverage
pytest tests/ --cov=app --cov-report=html

# Specific test file
pytest tests/test_auth.py -v
```

### Frontend Tests

```bash
cd frontend

# Type checking
npm run type-check

# Build test
npm run build
```

---

## Adding New Features

### New API Endpoint

1. Create endpoint file:

```python
# backend/app/api/endpoints/new_feature.py
from fastapi import APIRouter, Depends

router = APIRouter()

@router.get("/")
async def get_items():
    return {"items": []}
```

2. Register in main router:

```python
# backend/app/api/__init__.py
from app.api.endpoints.new_feature import router as new_feature_router

api_router.include_router(new_feature_router, prefix="/new-feature", tags=["New Feature"])
```

### New AI Module

1. Create module directory:

```
ai/new_module/
├── __init__.py
└── model.py
```

2. Import in inference service:

```python
# ai/inference/service.py
from ai.new_module import NewModel
```

### New Frontend Page

1. Create page file:

```tsx
// frontend/src/app/new-page/page.tsx
export default function NewPage() {
  return <div>New Page</div>;
}
```

---

## Database Migrations

### Create Migration

```bash
cd backend

# Auto-generate from models
alembic revision --autogenerate -m "Add new table"

# Manual migration
alembic revision -m "Custom migration"
```

### Apply Migration

```bash
# Upgrade to latest
alembic upgrade head

# Downgrade one step
alembic downgrade -1
```

---

## API Design Guidelines

1. **RESTful conventions** - Use proper HTTP methods
2. **Consistent responses** - All responses follow same structure
3. **Pagination** - Use `limit` and `offset` for lists
4. **Validation** - Use Pydantic models for request/response
5. **Authentication** - JWT tokens via Bearer header

---

## AI Model Training

### Swin Transformer

```python
from ai.transformers.swin_medical import create_medivision_swin, MediVisionTrainer

# Create model
model = create_medivision_swin(num_classes=3)

# Train
trainer = MediVisionTrainer(model, device='cuda')
trainer.train(train_loader, val_loader, epochs=50)
```

### CLIP Model

```python
from ai.multimodal.clip_medical import create_medivision_clip

model = create_medivision_clip()
# Train with image-text pairs
```

---

## Debugging

### Backend Logs

```bash
# View logs
docker-compose logs -f backend

# In development
tail -f backend/logs/app.log
```

### Frontend DevTools

- React Developer Tools
- Redux DevTools (for Zustand)

### API Testing

Use the interactive docs at `/docs` for API testing.

---

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -m "Add new feature"`
4. Push branch: `git push origin feature/new-feature`
5. Submit Pull Request

---

## Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [PyTorch Documentation](https://pytorch.org/docs/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
