"""
FHIR-compliant export schemas and utilities for MediVision AI.
Generates HL7 FHIR R4 compatible resources.
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from enum import Enum
import json
import uuid


class FHIRResourceType(str, Enum):
    """FHIR Resource Types"""
    DIAGNOSTIC_REPORT = "DiagnosticReport"
    IMAGING_STUDY = "ImagingStudy"
    OBSERVATION = "Observation"
    PATIENT = "Patient"
    PRACTITIONER = "Practitioner"
    MEDIA = "Media"
    DEVICE = "Device"


class FHIRCoding(BaseModel):
    """FHIR Coding element"""
    system: str
    code: str
    display: str


class FHIRCodeableConcept(BaseModel):
    """FHIR CodeableConcept"""
    coding: List[FHIRCoding]
    text: Optional[str] = None


class FHIRReference(BaseModel):
    """FHIR Reference"""
    reference: str
    display: Optional[str] = None


class FHIRIdentifier(BaseModel):
    """FHIR Identifier"""
    system: str
    value: str


class FHIRMeta(BaseModel):
    """FHIR Meta element"""
    versionId: str = "1"
    lastUpdated: str
    profile: Optional[List[str]] = None


# FHIR Resources
class FHIRPatient(BaseModel):
    """FHIR Patient resource (de-identified)"""
    resourceType: str = "Patient"
    id: str
    meta: FHIRMeta
    identifier: List[FHIRIdentifier]
    active: bool = True


class FHIRPractitioner(BaseModel):
    """FHIR Practitioner resource"""
    resourceType: str = "Practitioner"
    id: str
    meta: FHIRMeta
    identifier: List[FHIRIdentifier]
    name: Optional[List[Dict[str, Any]]] = None


class FHIRDevice(BaseModel):
    """FHIR Device resource (AI system)"""
    resourceType: str = "Device"
    id: str
    meta: FHIRMeta
    identifier: List[FHIRIdentifier]
    status: str = "active"
    manufacturer: str = "MediVision AI"
    deviceName: List[Dict[str, str]]
    type: FHIRCodeableConcept
    version: Optional[List[Dict[str, str]]] = None


class FHIRImagingStudySeries(BaseModel):
    """FHIR ImagingStudy Series"""
    uid: str
    number: int
    modality: FHIRCoding
    description: Optional[str] = None
    numberOfInstances: int
    bodySite: Optional[FHIRCoding] = None


class FHIRImagingStudy(BaseModel):
    """FHIR ImagingStudy resource"""
    resourceType: str = "ImagingStudy"
    id: str
    meta: FHIRMeta
    identifier: List[FHIRIdentifier]
    status: str = "available"
    subject: FHIRReference
    started: str
    numberOfSeries: int
    numberOfInstances: int
    modality: List[FHIRCoding]
    series: List[FHIRImagingStudySeries]
    description: Optional[str] = None


class FHIRObservationComponent(BaseModel):
    """FHIR Observation component"""
    code: FHIRCodeableConcept
    valueQuantity: Optional[Dict[str, Any]] = None
    valueString: Optional[str] = None
    valueCodeableConcept: Optional[FHIRCodeableConcept] = None


class FHIRObservation(BaseModel):
    """FHIR Observation resource (AI finding)"""
    resourceType: str = "Observation"
    id: str
    meta: FHIRMeta
    identifier: List[FHIRIdentifier]
    status: str = "final"
    category: List[FHIRCodeableConcept]
    code: FHIRCodeableConcept
    subject: FHIRReference
    effectiveDateTime: str
    issued: str
    performer: List[FHIRReference]
    device: Optional[FHIRReference] = None
    valueCodeableConcept: Optional[FHIRCodeableConcept] = None
    valueQuantity: Optional[Dict[str, Any]] = None
    interpretation: Optional[List[FHIRCodeableConcept]] = None
    note: Optional[List[Dict[str, str]]] = None
    component: Optional[List[FHIRObservationComponent]] = None


class FHIRDiagnosticReport(BaseModel):
    """FHIR DiagnosticReport resource"""
    resourceType: str = "DiagnosticReport"
    id: str
    meta: FHIRMeta
    identifier: List[FHIRIdentifier]
    status: str = "final"
    category: List[FHIRCodeableConcept]
    code: FHIRCodeableConcept
    subject: FHIRReference
    effectiveDateTime: str
    issued: str
    performer: List[FHIRReference]
    result: List[FHIRReference]
    imagingStudy: Optional[List[FHIRReference]] = None
    conclusion: Optional[str] = None
    conclusionCode: Optional[List[FHIRCodeableConcept]] = None
    presentedForm: Optional[List[Dict[str, Any]]] = None


class FHIRBundle(BaseModel):
    """FHIR Bundle resource"""
    resourceType: str = "Bundle"
    id: str
    meta: FHIRMeta
    type: str = "document"
    timestamp: str
    entry: List[Dict[str, Any]]


class FHIRExporter:
    """Utility class for exporting data in FHIR R4 format"""
    
    LOINC_SYSTEM = "http://loinc.org"
    SNOMED_SYSTEM = "http://snomed.info/sct"
    DICOM_UID_SYSTEM = "urn:dicom:uid"
    MEDIVISION_SYSTEM = "https://medivision.ai/fhir"
    
    def __init__(self):
        self.device_id = str(uuid.uuid4())
    
    def _create_meta(self, profile: Optional[str] = None) -> FHIRMeta:
        """Create FHIR Meta element"""
        return FHIRMeta(
            lastUpdated=datetime.utcnow().isoformat() + "Z",
            profile=[profile] if profile else None
        )
    
    def _create_identifier(self, value: str, system: str = None) -> FHIRIdentifier:
        """Create FHIR Identifier"""
        return FHIRIdentifier(
            system=system or self.MEDIVISION_SYSTEM,
            value=value
        )
    
    def create_ai_device(self, version: str = "1.0.0") -> FHIRDevice:
        """Create FHIR Device resource for AI system"""
        return FHIRDevice(
            id=self.device_id,
            meta=self._create_meta(),
            identifier=[self._create_identifier(f"medivision-ai-{version}")],
            deviceName=[{"name": "MediVision AI Analysis System", "type": "user-friendly-name"}],
            type=FHIRCodeableConcept(
                coding=[FHIRCoding(
                    system=self.SNOMED_SYSTEM,
                    code="706689003",
                    display="Artificial intelligence software"
                )],
                text="AI Medical Imaging Analysis System"
            ),
            version=[{"value": version}]
        )
    
    def create_patient(self, patient_id: str) -> FHIRPatient:
        """Create de-identified FHIR Patient resource"""
        return FHIRPatient(
            id=str(uuid.uuid4()),
            meta=self._create_meta(),
            identifier=[self._create_identifier(patient_id)]
        )
    
    def create_imaging_study(
        self,
        study_uid: str,
        patient_ref: str,
        modality: str,
        series_count: int,
        instance_count: int,
        study_date: datetime,
        description: Optional[str] = None,
        series: Optional[List[dict]] = None
    ) -> FHIRImagingStudy:
        """Create FHIR ImagingStudy resource"""
        modality_coding = FHIRCoding(
            system="http://dicom.nema.org/resources/ontology/DCM",
            code=modality,
            display=self._get_modality_display(modality)
        )
        
        fhir_series = []
        if series:
            for i, s in enumerate(series):
                fhir_series.append(FHIRImagingStudySeries(
                    uid=s.get("uid", f"1.2.3.{i}"),
                    number=i + 1,
                    modality=modality_coding,
                    description=s.get("description"),
                    numberOfInstances=s.get("instance_count", 1)
                ))
        
        return FHIRImagingStudy(
            id=str(uuid.uuid4()),
            meta=self._create_meta(),
            identifier=[FHIRIdentifier(system=self.DICOM_UID_SYSTEM, value=study_uid)],
            subject=FHIRReference(reference=f"Patient/{patient_ref}"),
            started=study_date.isoformat() + "Z",
            numberOfSeries=series_count,
            numberOfInstances=instance_count,
            modality=[modality_coding],
            series=fhir_series,
            description=description
        )
    
    def create_observation(
        self,
        finding_type: str,
        finding_code: str,
        finding_display: str,
        patient_ref: str,
        value: Optional[str] = None,
        confidence: Optional[float] = None,
        location: Optional[str] = None,
        measurements: Optional[Dict[str, Any]] = None
    ) -> FHIRObservation:
        """Create FHIR Observation for AI finding"""
        obs_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat() + "Z"
        
        components = []
        if confidence is not None:
            components.append(FHIRObservationComponent(
                code=FHIRCodeableConcept(
                    coding=[FHIRCoding(
                        system=self.MEDIVISION_SYSTEM,
                        code="ai-confidence",
                        display="AI Confidence Score"
                    )]
                ),
                valueQuantity={
                    "value": round(confidence * 100, 1),
                    "unit": "%",
                    "system": "http://unitsofmeasure.org",
                    "code": "%"
                }
            ))
        
        if measurements:
            for key, val in measurements.items():
                components.append(FHIRObservationComponent(
                    code=FHIRCodeableConcept(
                        coding=[FHIRCoding(
                            system=self.LOINC_SYSTEM,
                            code=self._get_measurement_loinc(key),
                            display=key.replace("_", " ").title()
                        )]
                    ),
                    valueQuantity={
                        "value": val.get("value"),
                        "unit": val.get("unit", "mm"),
                        "system": "http://unitsofmeasure.org",
                        "code": val.get("unit", "mm")
                    }
                ))
        
        return FHIRObservation(
            id=obs_id,
            meta=self._create_meta(),
            identifier=[self._create_identifier(obs_id)],
            category=[FHIRCodeableConcept(
                coding=[FHIRCoding(
                    system="http://terminology.hl7.org/CodeSystem/observation-category",
                    code="imaging",
                    display="Imaging"
                )]
            )],
            code=FHIRCodeableConcept(
                coding=[FHIRCoding(
                    system=self.SNOMED_SYSTEM,
                    code=finding_code,
                    display=finding_display
                )],
                text=finding_display
            ),
            subject=FHIRReference(reference=f"Patient/{patient_ref}"),
            effectiveDateTime=now,
            issued=now,
            performer=[FHIRReference(
                reference=f"Device/{self.device_id}",
                display="MediVision AI"
            )],
            device=FHIRReference(reference=f"Device/{self.device_id}"),
            valueCodeableConcept=FHIRCodeableConcept(
                coding=[FHIRCoding(
                    system=self.SNOMED_SYSTEM,
                    code=finding_code,
                    display=value or finding_display
                )]
            ) if value else None,
            note=[{"text": f"Location: {location}"}] if location else None,
            component=components if components else None
        )
    
    def create_diagnostic_report(
        self,
        patient_ref: str,
        study_ref: str,
        observations: List[str],
        conclusion: str,
        modality: str
    ) -> FHIRDiagnosticReport:
        """Create FHIR DiagnosticReport"""
        report_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat() + "Z"
        
        return FHIRDiagnosticReport(
            id=report_id,
            meta=self._create_meta(),
            identifier=[self._create_identifier(report_id)],
            category=[FHIRCodeableConcept(
                coding=[FHIRCoding(
                    system="http://terminology.hl7.org/CodeSystem/v2-0074",
                    code="RAD",
                    display="Radiology"
                )]
            )],
            code=FHIRCodeableConcept(
                coding=[FHIRCoding(
                    system=self.LOINC_SYSTEM,
                    code=self._get_report_loinc(modality),
                    display=f"{modality} Report"
                )],
                text=f"AI-Assisted {modality} Analysis Report"
            ),
            subject=FHIRReference(reference=f"Patient/{patient_ref}"),
            effectiveDateTime=now,
            issued=now,
            performer=[
                FHIRReference(reference=f"Device/{self.device_id}", display="MediVision AI")
            ],
            result=[FHIRReference(reference=f"Observation/{obs_id}") for obs_id in observations],
            imagingStudy=[FHIRReference(reference=f"ImagingStudy/{study_ref}")],
            conclusion=conclusion
        )
    
    def create_bundle(self, resources: List[BaseModel]) -> FHIRBundle:
        """Create FHIR Bundle containing multiple resources"""
        entries = []
        for resource in resources:
            resource_dict = resource.model_dump(exclude_none=True)
            entries.append({
                "fullUrl": f"urn:uuid:{resource_dict.get('id', str(uuid.uuid4()))}",
                "resource": resource_dict
            })
        
        return FHIRBundle(
            id=str(uuid.uuid4()),
            meta=self._create_meta(),
            timestamp=datetime.utcnow().isoformat() + "Z",
            entry=entries
        )
    
    def export_to_json(self, resource: BaseModel) -> str:
        """Export FHIR resource to JSON string"""
        return json.dumps(resource.model_dump(exclude_none=True), indent=2)
    
    @staticmethod
    def _get_modality_display(modality: str) -> str:
        """Get display name for DICOM modality code"""
        modality_map = {
            "CT": "Computed Tomography",
            "US": "Ultrasound",
            "MR": "Magnetic Resonance",
            "XR": "X-Ray",
            "NM": "Nuclear Medicine",
            "PT": "PET Scan"
        }
        return modality_map.get(modality, modality)
    
    @staticmethod
    def _get_measurement_loinc(measurement_type: str) -> str:
        """Get LOINC code for measurement type"""
        loinc_map = {
            "length": "18156-0",
            "diameter": "18155-2",
            "area": "18154-5",
            "volume": "18153-7",
            "max_diameter": "18155-2"
        }
        return loinc_map.get(measurement_type.lower(), "18156-0")
    
    @staticmethod
    def _get_report_loinc(modality: str) -> str:
        """Get LOINC code for report type"""
        loinc_map = {
            "CT": "24725-4",
            "US": "18748-4",
            "MR": "18755-9",
            "XR": "18782-3"
        }
        return loinc_map.get(modality, "18782-3")


# Export function for API use
def export_report_as_fhir(
    patient_id: str,
    study_data: dict,
    findings: List[dict],
    conclusion: str
) -> dict:
    """Export a complete report as FHIR Bundle"""
    exporter = FHIRExporter()
    
    # Create resources
    device = exporter.create_ai_device()
    patient = exporter.create_patient(patient_id)
    
    imaging_study = exporter.create_imaging_study(
        study_uid=study_data.get("uid", f"1.2.3.{uuid.uuid4()}"),
        patient_ref=patient.id,
        modality=study_data.get("modality", "CT"),
        series_count=study_data.get("series_count", 1),
        instance_count=study_data.get("instance_count", 1),
        study_date=datetime.fromisoformat(study_data.get("date", datetime.utcnow().isoformat())),
        description=study_data.get("description")
    )
    
    observations = []
    for finding in findings:
        obs = exporter.create_observation(
            finding_type=finding.get("type", "finding"),
            finding_code=finding.get("code", "404684003"),
            finding_display=finding.get("label", "Clinical finding"),
            patient_ref=patient.id,
            confidence=finding.get("confidence"),
            location=finding.get("location"),
            measurements=finding.get("measurements")
        )
        observations.append(obs)
    
    report = exporter.create_diagnostic_report(
        patient_ref=patient.id,
        study_ref=imaging_study.id,
        observations=[obs.id for obs in observations],
        conclusion=conclusion,
        modality=study_data.get("modality", "CT")
    )
    
    # Create bundle
    all_resources = [device, patient, imaging_study] + observations + [report]
    bundle = exporter.create_bundle(all_resources)
    
    return bundle.model_dump(exclude_none=True)
