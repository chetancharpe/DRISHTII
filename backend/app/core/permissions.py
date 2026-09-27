from enum import Enum
from typing import List, Set


class RoleEnum(str, Enum):
    CANDIDATE = "CANDIDATE"
    EXAMINER = "EXAMINER"
    ADMIN = "ADMIN"


class Permission(str, Enum):
    # Exam management
    EXAM_CREATE = "exam:create"
    EXAM_EDIT = "exam:edit"
    EXAM_DELETE = "exam:delete"
    EXAM_PUBLISH = "exam:publish"
    EXAM_SCHEDULE = "exam:schedule"
    EXAM_MONITOR = "exam:monitor"
    EXAM_VIEW_ALL = "exam:view_all"
    
    # Question bank
    QUESTION_CREATE = "question:create"
    QUESTION_EDIT = "question:edit"
    QUESTION_DELETE = "question:delete"
    QUESTION_VIEW_ALL = "question:view_all"
    
    # Candidate management
    CANDIDATE_MANAGE = "candidate:manage"
    CANDIDATE_ASSIGN = "candidate:assign"
    
    # Candidate session actions
    SESSION_START = "session:start"
    SESSION_ANSWER = "session:answer"
    SESSION_SUBMIT = "session:submit"
    
    # Results & Evaluation
    RESULT_VIEW_OWN = "result:view_own"
    RESULT_VIEW_ALL = "result:view_all"
    RESULT_EVALUATE = "result:evaluate"
    RESULT_PUBLISH = "result:publish"
    
    # Analytics
    ANALYTICS_VIEW = "analytics:view"
    
    # Admin system
    ADMIN_MANAGE_USERS = "admin:manage_users"
    ADMIN_AUDIT_LOGS = "admin:audit_logs"
    ADMIN_ORGANIZATIONS = "admin:organizations"


# Default role permissions mapping
ROLE_PERMISSIONS: dict[str, Set[str]] = {
    RoleEnum.CANDIDATE.value: {
        Permission.SESSION_START.value,
        Permission.SESSION_ANSWER.value,
        Permission.SESSION_SUBMIT.value,
        Permission.RESULT_VIEW_OWN.value,
    },
    RoleEnum.EXAMINER.value: {
        Permission.EXAM_CREATE.value,
        Permission.EXAM_EDIT.value,
        Permission.EXAM_DELETE.value,
        Permission.EXAM_PUBLISH.value,
        Permission.EXAM_SCHEDULE.value,
        Permission.EXAM_MONITOR.value,
        Permission.QUESTION_CREATE.value,
        Permission.QUESTION_EDIT.value,
        Permission.QUESTION_DELETE.value,
        Permission.QUESTION_VIEW_ALL.value,
        Permission.CANDIDATE_MANAGE.value,
        Permission.CANDIDATE_ASSIGN.value,
        Permission.RESULT_VIEW_ALL.value,
        Permission.RESULT_EVALUATE.value,
        Permission.RESULT_PUBLISH.value,
        Permission.ANALYTICS_VIEW.value,
    },
    RoleEnum.ADMIN.value: {
        perm.value for perm in Permission
    },
}


def get_permissions_for_role(role: str) -> List[str]:
    """Retrieve the set of permissions assigned to a given role name."""
    return sorted(list(ROLE_PERMISSIONS.get(role, set())))


def has_permission(user_role: str, user_permissions: List[str], required_permission: str) -> bool:
    """Verify if user has specific permission via assigned role or explicit overrides."""
    if user_role == RoleEnum.ADMIN.value:
        return True
    
    # Check explicitly assigned permission list first
    if required_permission in user_permissions:
        return True
        
    # Check role fallback
    role_perms = ROLE_PERMISSIONS.get(user_role, set())
    return required_permission in role_perms
