from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Any, Literal

class HoleSpec(BaseModel):
    shape: str = Field(description="Shape of the hole, e.g., 'rond', 'oblong'")
    diameter: float = Field(ge=0, description="Diameter of the hole in mm")
    quantity: int = Field(ge=0, description="Number of identical holes")

class BendSpec(BaseModel):
    angle: float = Field(description="Bending angle in degrees")
    radius: float = Field(ge=0, description="Bending radius in mm")
    length: Optional[float] = Field(default=None, description="Length of the bend if specified")
    quantity: int = Field(ge=0, description="Number of identical bends")

class MaterialSpec(BaseModel):
    type: str = Field(description="Main material type, e.g., 'Steel', 'Aluminum', 'Stainless Steel'. If not found, output 'Non renseigné'")
    nuance: str = Field(description="Material nuance/grade, e.g., 'S235JR', '304L'. If not found, output 'Non renseigné'")
    thickness: float = Field(gt=0, description="Thickness of the material in mm")
    treatment: Literal["Peinture", "Zingage", "Anodisation", "Galvanisation", "Aucun", "None", "Non renseigné"] = Field(default="Non renseigné", description="Surface treatment")

class DimensionSpec(BaseModel):
    length: float = Field(ge=0, description="Overall length of the part in mm")
    width: float = Field(ge=0, description="Overall width of the part in mm")
    height: Optional[float] = Field(default=0, ge=0, description="Overall height in mm")
    developedSurface: Optional[float] = Field(default=0, ge=0, description="Developed surface area in m2, if given")
    cuttingLength: Optional[float] = Field(default=0, ge=0, description="Total cutting perimeter in mm, if given")
    volume: Optional[float] = Field(default=0, ge=0, description="Volume in mm3, if given")
    mass: Optional[float] = Field(default=0, ge=0, description="Estimated mass in grams, if given")

class IdentificationSpec(BaseModel):
    reference: str = Field(description="Part reference number or code")
    designation: str = Field(description="Name or designation of the part")
    client: str = Field(description="Name of the client if specified, else 'Non renseigné'")

class ToleranceSpec(BaseModel):
    iso: str = Field(description="General ISO tolerances, e.g., 'ISO 2768-m'")
    notes: str = Field(description="Additional technical notes on the drawing")

class ExtractedSpecs(BaseModel):
    identification: IdentificationSpec
    material: MaterialSpec
    dimensions: DimensionSpec
    holes: List[HoleSpec]
    bends: List[BendSpec]
    tolerances: ToleranceSpec
    confidences: Optional[Dict[str, str]] = None

# API Request/Response Models

class CalculateRequest(BaseModel):
    specs: ExtractedSpecs
    parameters: Dict[str, Any]

class ValidateRequest(BaseModel):
    specs: ExtractedSpecs
    costs: Dict[str, Any]

class ChatRequest(BaseModel):
    message: str
    context: Dict[str, Any] = Field(default_factory=dict)
    history: List[Dict[str, str]] = Field(default_factory=list)

class SaveQuotationRequest(BaseModel):
    id: str
    reference: str = "N/A"
    designation: str = "Sans nom"
    client: str = "N/A"
    status: str = "Validé"
    observation: str = ""
    totalCost: float = 0
    margin: float = Field(default=25, ge=0)
    specs: Dict[str, Any] = Field(default_factory=dict)
    costs: Dict[str, Any] = Field(default_factory=dict)

    @field_validator('margin')
    @classmethod
    def validate_margin(cls, v: float) -> float:
        if v < 0 or v > 100:
            raise ValueError("Margin must be between 0 and 100")
        return v

class UpdateStatusRequest(BaseModel):
    status: str

class APIResponse(BaseModel):
    status: str
    data: Any
    message: Optional[str] = None
