# AI-4-Creativity-Project-Krishna-Kumar-Sah-mediscan

<div align="center">

![MediScan AI](https://img.shields.io/badge/MediScan-AI-blue?style=for-the-badge&logo=medical)
![Python](https://img.shields.io/badge/Python-3.11+-green?style=for-the-badge&logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-teal?style=for-the-badge&logo=fastapi)
![React](https://img.shields.io/badge/React-18+-blue?style=for-the-badge&logo=react)
![PyTorch](https://img.shields.io/badge/PyTorch-2.0+-red?style=for-the-badge&logo=pytorch)

**An AI-powered platform for CT scan and Ultrasound analysis with explainable AI, voice-enabled reporting, and multimodal interaction.**

</div>

---

## 👨‍🎓 Student Details

| **Field**              | **Details**                                                                                             |
| :--------------------- | :------------------------------------------------------------------------------------------------------ |
| **Student Name**       | **Krishna Kumar Sah**                                                                                   |
| **Student Number**     | **2318616**                                                                                             |
| **Project Repository** | [GitHub Repository](https://github.com/krishnasahnp/AI-4-Creativity-Project-Krishna-Kumar-Sah-mediscan) |
| **Project Video**      | [Watch the Demo](https://youtu.be/b5mRqapmSuk)                                                          |

### 🎥 Project Demo

[![MediScan AI Demo](https://img.youtube.com/vi/b5mRqapmSuk/0.jpg)](https://youtu.be/b5mRqapmSuk)

---

## 🎯 Overview

**MediScan AI** is a comprehensive medical imaging analysis platform that leverages state-of-the-art AI to assist healthcare professionals in interpreting CT scans and ultrasound images. The platform provides:

- **Clinical Findings**: Classification, segmentation, and automated measurements
- **Structured Reports**: AI-generated radiology-style reports with voice dictation
- **Explainability**: Attention heatmaps, confidence scores, and counterfactual explanations
- **Multimodal Chat**: Natural language interaction with image context awareness
- **Speech Pipeline**: Voice commands and clinician dictation support

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React/Next.js)                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Dashboard │  │   Viewers   │  │  Assistant  │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────┴────────────────────────────────────┐
│                    BACKEND (FastAPI + Python)                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │  Auth    │  │  Upload  │  │ Inference│  │  Report  │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────┴────────────────────────────────────┐
│                      AI SERVICES (PyTorch/GPU)                   │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │Transformer│ │  LLM   │ │  GAN   │ │Diffusion│ │ Speech │  │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 AI Modules

| Module                     | Implementation | Purpose                                  |
| :------------------------- | :------------- | :--------------------------------------- |
| **Image Processing**       | Custom toolkit | DICOM handling, windowing, preprocessing |
| **Transformer**            | Swin-T / ViT   | CT/US classification and segmentation    |
| **Multimodal Transformer** | CLIP-style     | Image-text alignment and retrieval       |
| **LLM Fine-tuning**        | LoRA/Mistral   | Medical report generation                |
| **GANs**                   | DCGAN/StyleGAN | Ultrasound speckle augmentation          |
| **Diffusion**              | DDPM/LDM       | Counterfactual inpainting                |
| **Speech Processing**      | Whisper        | Voice dictation and commands             |
| **Audio Processing**       | Custom DSP     | Noise reduction, quality scoring         |

---

## 🚀 Setup Instructions

Follow these instructions to set up the project locally.

### prerequisites

Ensure you have the following installed:

- **Conda** (Anaconda or Miniconda)
- **Node.js** (v18+)
- **Docker** (Optional, for containerized run)

### 1. 🐍 Conda Environment Setup (Recommended)

Create a dedicated Conda environment to manage Python dependencies.

```bash
# Create a new conda environment named 'mediscan' with Python 3.11
conda create -n mediscan python=3.11 -y

# Activate the environment
conda activate mediscan
```

### 2. 🔌 Backend Setup

The backend is built with FastAPI.

```bash
# Navigate to the backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Run initial setup script (if available) or DB init
# python -c "from app.db.init_db import init_db; init_db()"

# Start the Backend Server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

> The backend server will start at `http://localhost:8000`. API docs are available at `http://localhost:8000/docs`.

### 3. 💻 Frontend Setup

The frontend is built with Next.js/React.

```bash
# Open a new terminal and navigate to the frontend directory
cd frontend

# Install Node dependencies
npm install

# Start the Development Server
npm run dev
```

> The frontend application will be accessible at `http://localhost:3000`.

### 4. 🧠 AI Services Setup (Optional)

If you wish to run training or specific AI modules locally:

```bash
cd ai
pip install -r requirements.txt
python -m training.download_models  # Download pre-trained weights
```

### 5. 🐳 Docker Setup (Alternative)

You can run the entire stack using Docker Compose.

```bash
# Build and run containers
docker-compose up --build
```

---

## 📁 Project Structure

```text
medivision/
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── api/               # API routes
│   │   ├── core/              # Core configuration
│   │   ├── db/                # Database models
│   │   ├── services/          # Business logic
│   │   └── utils/             # Utilities
│   ├── tests/
│   └── requirements.txt
│
├── ai/                         # AI/ML modules
│   ├── image_processing/      # Image ops toolkit
│   ├── transformers/          # ViT/Swin models
│   ├── multimodal/            # CLIP-style retrieval
│   ├── llm/                   # Report generation
│   ├── gan/                   # Speckle augmentation
│   ├── diffusion/             # Counterfactual inpainting
│   ├── speech/                # STT pipeline
│   ├── audio/                 # Audio processing
│   └── training/              # Training scripts
│
├── frontend/                   # React/Next.js frontend
│   ├── app/
│   ├── components/
│   ├── styles/
│   └── package.json
│
├── data/                       # Data directory
│   ├── raw/                   # Raw datasets
│   ├── processed/             # Preprocessed data
│   └── models/                # Trained models
│
├── docs/                       # Documentation
├── scripts/                    # Utility scripts
└── docker-compose.yml          # Container orchestration
```

---

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- CUDA 11.8+ (for GPU inference)

### Backend Setup

```bash
# Create virtual environment
cd backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows

# Install dependencies
pip install -r requirements.txt

# Setup database
python -c "from app.db.init_db import init_db; init_db()"

# Run server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### AI Services Setup

```bash
cd ai
pip install -r requirements.txt
python -m training.download_models  # Download pre-trained weights
```

---

## 📊 Features

### MVP Features

- ✅ DICOM upload and CT slice viewer
- ✅ Basic windowing presets
- ✅ CT classification (normal/abnormal)
- ✅ Simple segmentation overlay
- ✅ Basic report template

### V1 Features

- ✅ Ultrasound image/video upload
- ✅ Cine viewer with frame scrubbing
- ✅ Voice dictation
- ✅ Similar case retrieval
- ✅ LLM-generated reports
- ✅ Attention heatmaps

### V2 Features

- ✅ GAN-augmented training
- ✅ Counterfactual explanations
- ✅ Multimodal chat assistant
- ✅ Voice commands
- ✅ Admin analytics dashboard

---

## 📈 Performance Metrics

| Metric                  | Target | Current |
| :---------------------- | :----- | :------ |
| CT Classification AUROC | ≥ 0.90 | -       |
| Segmentation Dice       | ≥ 0.85 | -       |
| Report Factuality       | ≥ 0.95 | -       |
| Inference Latency       | < 30s  | -       |
| Speech WER              | ≤ 10%  | -       |

---

## 🔒 Security & Compliance

- **End-to-end encryption** for data in transit
- **Patient data anonymization** (de-identification)
- **Role-based access control** (Admin/Clinician/Student)
- **Comprehensive audit logging**
- **HIPAA-aware** design principles

---

## 📚 Documentation

- [API Documentation](docs/api.md)
- [Model Architecture](docs/models.md)
- [Dataset Specification](docs/dataset.md)
- [Deployment Guide](docs/deployment.md)

---

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest tests/ -v --cov=app

# Frontend tests
cd frontend
npm test

# AI module tests
cd ai
pytest tests/ -v
```

---

## 📄 License

This project is developed for educational and research purposes. Not for clinical use without proper regulatory approval.

---

<div align="center">

**⚠️ DISCLAIMER: This is a research/educational project. Not intended for clinical diagnosis.**

</div>
