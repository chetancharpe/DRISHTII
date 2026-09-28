from sqlalchemy.orm import declarative_base

Base = declarative_base()

# Import all models here so that Base.metadata has all entity tables registered
from app.models.user import User  # noqa
from app.models.role import Role, UserRole, RolePermission  # noqa
from app.models.organization import Organization, UserOrganization  # noqa
from app.models.exam import Exam  # noqa
from app.models.section import ExamSection, SectionQuestion  # noqa
from app.models.question import Question  # noqa
from app.models.question_version import QuestionVersion  # noqa
from app.models.candidate_group import CandidateGroup, CandidateGroupMember  # noqa
from app.models.exam_candidate import ExamCandidate  # noqa
from app.models.exam_session import ExamSession  # noqa
from app.models.exam_answer import ExamAnswer  # noqa
from app.models.exam_submission import ExamSubmission  # noqa
from app.models.result import Result  # noqa
from app.models.evaluation import Evaluation  # noqa
from app.models.announcement import Announcement  # noqa
from app.models.audit_log import AuditLog  # noqa
from app.models.accessibility_profile import AccessibilityProfile, AccessibilityIssue  # noqa
from app.models.learning_profile import LearningProfile, TopicProgress, LearningActivity, Recommendation  # noqa
from app.models.refresh_token import RefreshToken  # noqa
from app.models.password_reset_token import PasswordResetToken  # noqa
