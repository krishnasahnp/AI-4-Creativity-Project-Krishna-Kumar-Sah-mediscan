# MediVision AI - API Documentation

## Overview

MediVision AI provides a comprehensive REST API for medical imaging analysis. This document describes all available endpoints, authentication, and usage examples.

## Base URL

```
Development: http://localhost:8000/api/v1
Production: https://your-domain.com/api/v1
```

## Authentication

All API requests (except login/register) require a JWT Bearer token.

### Get Token

```bash
POST /auth/login
Content-Type: application/x-www-form-urlencoded

username=doctor@hospital.com&password=yourpassword
```

**Response:**

```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer"
}
```

### Use Token

```bash
Authorization: Bearer eyJ...
```

---

## Endpoints

### 🔐 Authentication (`/auth`)

| Method | Endpoint         | Description          |
| ------ | ---------------- | -------------------- |
| POST   | `/auth/register` | Register new user    |
| POST   | `/auth/login`    | Login, get tokens    |
| POST   | `/auth/refresh`  | Refresh access token |
| GET    | `/auth/me`       | Get current user     |

---

### 📁 Cases (`/cases`)

| Method | Endpoint       | Description     |
| ------ | -------------- | --------------- |
| GET    | `/cases`       | List all cases  |
| POST   | `/cases`       | Create new case |
| GET    | `/cases/{id}`  | Get case by ID  |
| PATCH  | `/cases/{id}`  | Update case     |
| DELETE | `/cases/{id}`  | Delete case     |
| GET    | `/cases/stats` | Get statistics  |

**Create Case:**

```json
POST /cases
{
  "patient_id": "MRN-12345",
  "clinical_notes": "Patient presents with chest pain"
}
```

---

### 🔬 Studies (`/studies`)

| Method | Endpoint                    | Description         |
| ------ | --------------------------- | ------------------- |
| GET    | `/studies/{id}`             | Get study details   |
| PATCH  | `/studies/{id}`             | Update study        |
| DELETE | `/studies/{id}`             | Delete study        |
| GET    | `/studies/{id}/images`      | Get images in study |
| GET    | `/studies/{id}/annotations` | Get annotations     |

---

### 📤 Upload (`/upload`)

| Method | Endpoint             | Description           |
| ------ | -------------------- | --------------------- |
| POST   | `/upload/ct`         | Upload CT DICOM files |
| POST   | `/upload/ultrasound` | Upload ultrasound     |
| POST   | `/upload/audio`      | Upload dictation      |

**Upload CT:**

```bash
POST /upload/ct
Content-Type: multipart/form-data

files: [DICOM files]
case_id: uuid
body_part: Chest
```

---

### 🤖 Inference (`/inference`)

| Method | Endpoint                 | Description       |
| ------ | ------------------------ | ----------------- |
| POST   | `/inference/start`       | Start AI analysis |
| GET    | `/inference/{id}/status` | Check status      |
| GET    | `/inference/{id}/result` | Get results       |
| POST   | `/inference/batch`       | Batch processing  |

**Start Inference:**

```json
POST /inference/start
{
  "study_id": "uuid",
  "analysis_types": ["classification", "segmentation"]
}
```

**Response:**

```json
{
  "job_id": "uuid",
  "status": "processing",
  "estimated_time_seconds": 30
}
```

---

### 📋 Reports (`/reports`)

| Method | Endpoint               | Description        |
| ------ | ---------------------- | ------------------ |
| POST   | `/reports/generate`    | AI-generate report |
| GET    | `/reports/{id}`        | Get report         |
| PUT    | `/reports/{id}`        | Update report      |
| POST   | `/reports/{id}/sign`   | Digitally sign     |
| GET    | `/reports/{id}/export` | Export PDF         |

**Generate Report:**

```json
POST /reports/generate
{
  "study_id": "uuid",
  "include_ai_findings": true,
  "template": "standard"
}
```

---

### 💬 AI Assistant (`/assistant`)

| Method | Endpoint             | Description   |
| ------ | -------------------- | ------------- |
| POST   | `/assistant/chat`    | Send message  |
| POST   | `/assistant/voice`   | Voice query   |
| GET    | `/assistant/similar` | Similar cases |

**Chat:**

```json
POST /assistant/chat
{
  "message": "What does the AI finding in slice 45 indicate?",
  "study_id": "uuid"
}
```

---

### 🎙️ Audio (`/audio`)

| Method | Endpoint              | Description      |
| ------ | --------------------- | ---------------- |
| POST   | `/audio/transcribe`   | Dictation → text |
| GET    | `/audio/{id}/quality` | Audio quality    |

---

### ⚙️ Admin (`/admin`)

| Method | Endpoint           | Description     |
| ------ | ------------------ | --------------- |
| GET    | `/admin/analytics` | Usage analytics |
| GET    | `/admin/models`    | Model stats     |
| GET    | `/admin/logs`      | Audit logs      |
| GET    | `/admin/users`     | Manage users    |

---

## Error Responses

```json
{
  "detail": "Error message",
  "status_code": 400
}
```

| Code | Description      |
| ---- | ---------------- |
| 400  | Bad Request      |
| 401  | Unauthorized     |
| 403  | Forbidden        |
| 404  | Not Found        |
| 422  | Validation Error |
| 500  | Server Error     |

---

## Rate Limits

| Endpoint  | Limit    |
| --------- | -------- |
| General   | 10 req/s |
| Upload    | 2 req/s  |
| Inference | 5 req/s  |

---

## WebSocket

Real-time updates available at:

```
wss://your-domain.com/ws/{user_id}
```

Events:

- `inference_complete` - AI analysis finished
- `report_ready` - Report generated
- `notification` - System notifications
