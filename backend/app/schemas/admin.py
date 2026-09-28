from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class AdminUserRecord(BaseModel):
    id: str
    name: str
    email: str
    role: str
    organizationId: Optional[str] = "org-01"
    organizationName: Optional[str] = "GoWow Inclusive Academy"
    status: str = "active"  # "active" | "deactivated"
    assignedPermissions: List[str] = Field(default_factory=list)
    lastLoginAt: Optional[str] = None
    createdAt: str


class AdminUserStatusUpdate(BaseModel):
    status: str  # "active" | "deactivated"


class AdminUserRoleUpdate(BaseModel):
    role: str
    permissions: List[str] = Field(default_factory=list)


class OrganizationRecord(BaseModel):
    id: str
    name: str
    code: str
    domain: Optional[str] = None
    status: str = "active"
    candidateCount: int = 0
    examinerCount: int = 0
    createdAt: str


class OrganizationCreateRequest(BaseModel):
    name: str
    code: Optional[str] = None
    domain: Optional[str] = None


class AuditLogRecord(BaseModel):
    id: str
    timestamp: str
    operatorId: Optional[str] = None
    operatorName: Optional[str] = None
    operatorRole: Optional[str] = None
    action: str
    entityId: Optional[str] = None
    entityType: Optional[str] = None
    details: str
    ipAddressMasked: str = "192.168.1.***"


class AdminMetricsResponse(BaseModel):
    totalUsers: int
    candidates: int
    examiners: int
    organizations: int
    activeExams: int
    scheduledExams: int
    completedExams: int
    systemAlerts: int
