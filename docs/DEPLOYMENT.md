# MediVision AI - Deployment Guide

## Prerequisites

- Docker & Docker Compose v2+
- NVIDIA GPU with drivers (for AI inference)
- Domain name with DNS configured
- SSL certificate (Let's Encrypt recommended)

---

## Quick Start (Development)

```bash
# Clone repository
git clone https://github.com/your-org/medivision-ai.git
cd medivision-ai

# Copy environment file
cp .env.example .env

# Start infrastructure
docker-compose up -d postgres redis

# Run backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# Run frontend
cd frontend
npm install
npm run dev
```

**Access:**

- Frontend: http://localhost:3000
- API: http://localhost:8000
- Docs: http://localhost:8000/docs

---

## Production Deployment

### 1. Server Setup

```bash
# Ubuntu 22.04 LTS recommended
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install NVIDIA Container Toolkit
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | \
  sudo tee /etc/apt/sources.list.d/nvidia-docker.list
sudo apt update && sudo apt install -y nvidia-container-toolkit
```

### 2. SSL Certificates

```bash
# Install Certbot
sudo apt install certbot

# Get certificates
sudo certbot certonly --standalone -d your-domain.com

# Copy to nginx directory
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/
```

### 3. Environment Configuration

```bash
# Edit production environment
cp .env.example .env.prod
nano .env.prod
```

**Required variables:**

```env
# Security
JWT_SECRET_KEY=<generate-256-bit-key>
JWT_REFRESH_SECRET_KEY=<generate-256-bit-key>

# Database
POSTGRES_USER=medivision
POSTGRES_PASSWORD=<strong-password>
POSTGRES_DB=medivision_prod

# Domain
DOMAIN=your-domain.com
CORS_ORIGINS=https://your-domain.com

# Monitoring
GRAFANA_PASSWORD=<admin-password>
```

### 4. Deploy

```bash
# Build and start all services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Check status
docker-compose ps

# View logs
docker-compose logs -f backend
```

### 5. Database Migration

```bash
# Run migrations
docker-compose exec backend alembic upgrade head

# Create admin user
docker-compose exec backend python -c "
from app.core.security import get_password_hash
from app.db.session import SessionLocal
from app.db.models import User
import uuid

db = SessionLocal()
admin = User(
    id=uuid.uuid4(),
    email='admin@your-domain.com',
    password_hash=get_password_hash('admin-password'),
    full_name='Admin',
    role='admin'
)
db.add(admin)
db.commit()
"
```

---

## Scaling

### Horizontal Scaling (Multiple Workers)

```yaml
# docker-compose.override.yml
services:
  backend:
    deploy:
      replicas: 4

  celery_worker:
    deploy:
      replicas: 2
```

### Kubernetes Deployment

See `kubernetes/` directory for Helm charts.

---

## Monitoring

### Grafana Dashboard

1. Access Grafana: `https://your-domain.com:3001`
2. Login with admin credentials
3. Import dashboards from `monitoring/grafana/dashboards/`

### Prometheus Metrics

Available at: `http://localhost:9090`

Key metrics:

- `http_requests_total` - Request count
- `inference_latency_seconds` - AI processing time
- `gpu_utilization` - GPU usage

---

## Backup & Recovery

### Database Backup

```bash
# Create backup
docker-compose exec postgres pg_dump -U medivision medivision > backup_$(date +%Y%m%d).sql

# Restore backup
docker-compose exec -T postgres psql -U medivision medivision < backup_20240115.sql
```

### File Backup

```bash
# Backup uploads
tar -czvf uploads_backup.tar.gz ./uploads

# Backup models
tar -czvf models_backup.tar.gz ./models
```

---

## Troubleshooting

### Common Issues

**GPU not detected:**

```bash
# Verify NVIDIA drivers
nvidia-smi

# Restart Docker
sudo systemctl restart docker
```

**Database connection fails:**

```bash
# Check PostgreSQL status
docker-compose logs postgres

# Reset database
docker-compose down -v
docker-compose up -d postgres
```

**Memory issues:**

```bash
# Increase swap
sudo fallocate -l 16G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

---

## Security Checklist

- [ ] Change all default passwords
- [ ] Enable SSL/TLS
- [ ] Configure firewall (UFW)
- [ ] Enable audit logging
- [ ] Set up log rotation
- [ ] Configure backup schedule
- [ ] Enable 2FA for admin accounts
- [ ] Review CORS settings
- [ ] Test rate limiting
