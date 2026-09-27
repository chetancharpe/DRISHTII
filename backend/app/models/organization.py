import uuid
from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import relationship
from app.db.base import Base


class Organization(Base):
    __tablename__ = "organizations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(200), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    users = relationship("UserOrganization", back_populates="organization", cascade="all, delete-orphan")
    exams = relationship("Exam", back_populates="organization", cascade="all, delete-orphan")
    candidate_groups = relationship("CandidateGroup", back_populates="organization", cascade="all, delete-orphan")


class UserOrganization(Base):
    __tablename__ = "user_organizations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    role_in_org = Column(String(50), default="MEMBER", nullable=False)

    user = relationship("User", back_populates="organizations")
    organization = relationship("Organization", back_populates="users")
