# MediScan AI - ML Backend

Medical image processing backend with AI-powered analysis capabilities.

## Features

- **DICOM Processing**: Parse and extract metadata from DICOM files
- **Modality Detection**: Auto-detect X-ray, CT, MRI, Ultrasound
- **Quality Assessment**: Blur, contrast, orientation checks
- **AI Classification**: Multi-label finding detection (14 CheXpert labels)
- **Segmentation**: U-Net for lung/heart region segmentation
- **Explainability**: Grad-CAM attention heatmaps
- **Report Generation**: Visual report cards with findings

## Quick Start

### Local Development

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run server
uvicorn app.main:app --reload --port 8000
```

### Docker

```bash
# Build image
docker build -t mediscan-backend .

# Run container
docker run -p 8000:8000 mediscan-backend
```

## API Endpoints

| Method | Endpoint                     | Description              |
| ------ | ---------------------------- | ------------------------ |
| POST   | `/api/upload`                | Upload DICOM/image file  |
| POST   | `/api/analyze`               | Run ML analysis pipeline |
| GET    | `/api/analyze/{id}/findings` | Get analysis findings    |
| GET    | `/api/analyze/{id}/gradcam`  | Get Grad-CAM heatmap     |
| POST   | `/api/report/generate`       | Generate visual report   |
| GET    | `/api/report/{id}/download`  | Download report image    |

## Example Usage

```python
import requests

# Upload image
files = {"file": open("chest_xray.dcm", "rb")}
response = requests.post("http://localhost:8000/api/upload", files=files)
image_id = response.json()["image_id"]

# Run analysis
response = requests.post(
    "http://localhost:8000/api/analyze",
    json={"image_id": image_id, "modality": "CT"}
)
findings = response.json()["findings"]

# Generate report
response = requests.post(
    "http://localhost:8000/api/report/generate",
    json={"image_id": image_id}
)
report_path = response.json()["report_path"]
```

## Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI entry point
│   ├── api/routes/
│   │   ├── upload.py        # Upload endpoints
│   │   ├── analyze.py       # Analysis endpoints
│   │   └── report.py        # Report endpoints
│   ├── services/
│   │   ├── dicom_parser.py  # DICOM processing
│   │   ├── modality_detector.py
│   │   ├── quality_checker.py
│   │   ├── preprocessor.py
│   │   ├── inference_engine.py
│   │   └── report_generator.py
│   ├── models/
│   │   ├── classifier.py    # DenseNet-121
│   │   ├── segmentor.py     # U-Net
│   │   └── gradcam.py       # Grad-CAM++
│   └── utils/
│       └── config.py
├── weights/                  # Model weights
├── uploads/                  # Uploaded files
├── reports/                  # Generated reports
├── requirements.txt
├── Dockerfile
└── README.md
```

## Model Training

For real deployment, train models on:

- [CheXpert](https://stanfordmlgroup.github.io/competitions/chexpert/) - 224K chest X-rays
- [MIMIC-CXR](https://physionet.org/content/mimic-cxr/) - 377K images + reports

## License

MIT License - For educational and research purposes only.

## Disclaimer

This system is for educational and decision support purposes only. It is NOT a medical diagnosis tool. Always consult qualified healthcare professionals for clinical decisions.
