from pydantic import BaseModel, Field
from typing import List, Optional

class HoleSpec(BaseModel):
    shape: str = Field(description="Shape of the hole, e.g., 'rond', 'oblong'")
    diameter: float = Field(description="Diameter of the hole in mm")
    quantity: int = Field(description="Number of identical holes")

class BendSpec(BaseModel):
    angle: float = Field(description="Bending angle in degrees")
    radius: float = Field(description="Bending radius in mm")
    length: Optional[float] = Field(default=None, description="Length of the bend if specified")
    quantity: int = Field(description="Number of identical bends")

class MaterialSpec(BaseModel):
    type: str = Field(description="Main material type, e.g., 'Steel', 'Aluminum', 'Stainless Steel'. If not found, output 'Non renseigné'")
    nuance: str = Field(description="Material nuance/grade, e.g., 'S235JR', '304L'. If not found, output 'Non renseigné'")
    thickness: float = Field(description="Thickness of the material in mm")
    treatment: str = Field(description="Surface treatment, e.g., 'Peinture', 'Zingage'. If not found, output 'Non renseigné'")

class DimensionSpec(BaseModel):
    length: float = Field(description="Overall length of the part in mm")
    width: float = Field(description="Overall width of the part in mm")
    height: Optional[float] = Field(default=0, description="Overall height in mm")
    developedSurface: Optional[float] = Field(default=0, description="Developed surface area in m2, if given")
    cuttingLength: Optional[float] = Field(default=0, description="Total cutting perimeter in mm, if given")
    volume: Optional[float] = Field(default=0, description="Volume in mm3, if given")
    mass: Optional[float] = Field(default=0, description="Estimated mass in grams, if given")

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
