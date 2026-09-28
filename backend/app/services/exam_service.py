import csv
from datetime import datetime
import io
from typing import List, Optional
import uuid
from sqlalchemy.orm import Session
from app.core.exceptions import (
    AccessibilityGateException,
    EntityNotFoundException,
    ForbiddenException,
    ValidationConflictException,
)
from app.core.security import get_password_hash
from app.models.accessibility_profile import AccessibilityProfile
from app.models.exam import Exam, ExamStatus
from app.models.exam_candidate import AttemptStatus, EligibilityStatus, ExamCandidate
from app.models.question import Question
from app.models.question_version import QuestionVersion
from app.models.role import Role, UserRole
from app.models.section import ExamSection, SectionQuestion
from app.models.user import User
from app.schemas.exam import (
    ExamCandidateResponse,
    ExamCreate,
    ExamExaminerResponse,
    ExamScheduleRequest,
    ExamUpdate,
    RosterCsvImportResponse,
    RosterImportResultItem,
    SectionCandidateDetailResponse,
    SectionCreate,
    SectionExaminerDetailResponse,
    SectionResponse,
)
from app.schemas.question import (
    AccessibilityMetadataSchema,
    QuestionCandidateResponse,
    QuestionExaminerResponse,
    QuestionOptionSchema,
)
from app.services.audit_service import log_audit_event
from app.utils.datetime import utc_now
from app.utils.pagination import paginate
from app.utils.validators import validate_question_accessibility


def create_exam(db: Session, data: ExamCreate, creator_id: str) -> ExamExaminerResponse:
    """Create a new examination in DRAFT status."""
    exam = Exam(
        organization_id=data.organization_id,
        title=data.title.strip(),
        description=data.description,
        instructions=data.instructions,
        status=ExamStatus.DRAFT.value,
        duration_seconds=data.duration_seconds,
        extra_time_seconds=data.extra_time_seconds,
        language=data.language,
        created_by=creator_id,
    )
    db.add(exam)
    db.commit()
    db.refresh(exam)

    log_audit_event(
        db,
        action="EXAM_CREATE",
        resource_type="Exam",
        resource_id=exam.id,
        actor_id=creator_id,
        metadata={"title": exam.title},
    )
    return get_examiner_exam(db, exam.id)


def update_exam(db: Session, exam_id: str, data: ExamUpdate, user_id: str) -> ExamExaminerResponse:
    """Update exam parameters. Once LIVE, structural fields cannot be modified."""
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise EntityNotFoundException("Exam", exam_id)

    if exam.status in [ExamStatus.LIVE.value, ExamStatus.COMPLETED.value]:
        # Enforce Section 63: Exam Immutability once LIVE
        disallowed = [data.duration_seconds, data.extra_time_seconds]
        if any(d is not None for d in disallowed):
            raise ValidationConflictException("Cannot modify exam duration once the exam has transitioned to LIVE.")

    if data.title is not None:
        exam.title = data.title.strip()
    if data.description is not None:
        exam.description = data.description
    if data.instructions is not None:
        exam.instructions = data.instructions
    if data.duration_seconds is not None:
        exam.duration_seconds = data.duration_seconds
    if data.extra_time_seconds is not None:
        exam.extra_time_seconds = data.extra_time_seconds
    if data.language is not None:
        exam.language = data.language
    if data.status is not None:
        exam.status = data.status

    exam.updated_at = utc_now()
    db.commit()
    db.refresh(exam)

    log_audit_event(
        db, action="EXAM_UPDATE", resource_type="Exam", resource_id=exam.id, actor_id=user_id
    )
    return get_examiner_exam(db, exam.id)


def add_section_to_exam(db: Session, exam_id: str, data: SectionCreate, user_id: str) -> SectionResponse:
    """Add a section and associate questions to an exam."""
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise EntityNotFoundException("Exam", exam_id)

    if exam.status == ExamStatus.LIVE.value:
        raise ValidationConflictException("Cannot add sections to an exam that is currently LIVE.")

    section = ExamSection(
        exam_id=exam_id,
        title=data.title,
        description=data.description,
        display_order=data.display_order,
        duration_seconds=data.duration_seconds,
        navigation_policy=data.navigation_policy,
        question_count=len(data.question_ids),
    )
    db.add(section)
    db.flush()

    for idx, qid in enumerate(data.question_ids):
        question = db.query(Question).filter(Question.id == qid).first()
        if not question:
            continue
        latest_ver = (
            db.query(QuestionVersion)
            .filter(QuestionVersion.question_id == qid)
            .order_by(QuestionVersion.version_number.desc())
            .first()
        )
        if latest_ver:
            sq = SectionQuestion(
                section_id=section.id,
                question_id=qid,
                question_version_id=latest_ver.id,
                display_order=idx + 1,
            )
            db.add(sq)

    db.commit()
    db.refresh(section)

    return SectionResponse(
        id=section.id,
        exam_id=section.exam_id,
        title=section.title,
        description=section.description,
        display_order=section.display_order,
        duration_seconds=section.duration_seconds,
        navigation_policy=section.navigation_policy,
        question_count=section.question_count,
    )


def schedule_exam(db: Session, exam_id: str, schedule: ExamScheduleRequest, user_id: str) -> ExamExaminerResponse:
    """Configure official start and end windows for the exam."""
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise EntityNotFoundException("Exam", exam_id)

    if schedule.end_at <= schedule.start_at:
        raise ValidationConflictException("Exam end time must be after the start time.")

    exam.start_at = schedule.start_at
    exam.end_at = schedule.end_at
    if schedule.duration_seconds:
        exam.duration_seconds = schedule.duration_seconds
    if schedule.extra_time_seconds is not None:
        exam.extra_time_seconds = schedule.extra_time_seconds

    if exam.status == ExamStatus.DRAFT.value:
        exam.status = ExamStatus.SCHEDULED.value

    exam.updated_at = utc_now()
    db.commit()

    log_audit_event(
        db,
        action="EXAM_SCHEDULE",
        resource_type="Exam",
        resource_id=exam.id,
        actor_id=user_id,
        metadata={"start_at": str(exam.start_at), "end_at": str(exam.end_at)},
    )
    return get_examiner_exam(db, exam.id)


def assign_candidates_to_exam(
    db: Session, exam_id: str, candidate_ids: List[str], user_id: str
) -> int:
    """Assign candidate users to an examination."""
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise EntityNotFoundException("Exam", exam_id)

    assigned_count = 0
    for cid in candidate_ids:
        candidate_user = db.query(User).filter(User.id == cid).first()
        if not candidate_user:
            continue

        existing = (
            db.query(ExamCandidate)
            .filter(ExamCandidate.exam_id == exam_id, ExamCandidate.candidate_id == cid)
            .first()
        )
        if not existing:
            assignment = ExamCandidate(
                exam_id=exam_id,
                candidate_id=cid,
                eligibility_status=EligibilityStatus.ELIGIBLE.value,
                attempt_status=AttemptStatus.NOT_ATTEMPTED.value,
            )
            db.add(assignment)
            assigned_count += 1

    db.commit()
    log_audit_event(
        db,
        action="EXAM_ASSIGN_CANDIDATES",
        resource_type="Exam",
        resource_id=exam_id,
        actor_id=user_id,
        metadata={"assigned_count": assigned_count},
    )
    return assigned_count


def publish_exam(db: Session, exam_id: str, user_id: str) -> ExamExaminerResponse:
    """
    Publish an examination.
    Enforces Section 48 & 49: Rigorous Pre-Publication Validation & Accessibility Gate!
    """
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise EntityNotFoundException("Exam", exam_id)

    # 1. Check title
    if not exam.title or len(exam.title.strip()) < 3:
        raise ValidationConflictException("Exam title must be at least 3 characters long.")

    # 2. Check sections
    sections = db.query(ExamSection).filter(ExamSection.exam_id == exam_id).all()
    if not sections:
        raise ValidationConflictException("Exam must have at least one section before publication.")

    # 3. Check questions & accessibility gate
    total_questions = 0
    accessibility_blocking_errors: List[str] = []

    for sec in sections:
        sec_questions = (
            db.query(SectionQuestion)
            .filter(SectionQuestion.section_id == sec.id)
            .all()
        )
        total_questions += len(sec_questions)
        for sq in sec_questions:
            qv = db.query(QuestionVersion).filter(QuestionVersion.id == sq.question_version_id).first()
            if not qv:
                accessibility_blocking_errors.append(f"Question in section '{sec.title}' lacks valid version content.")
                continue

            # Verify correct answer exists
            if qv.correct_answer is None:
                accessibility_blocking_errors.append(f"Question '{qv.question_text[:30]}...' has no correct answer configured.")

            # Validate accessibility gate
            is_valid, errors, _ = validate_question_accessibility(
                question_text=qv.question_text,
                options=qv.options or [],
                metadata=qv.accessibility_metadata or {},
            )
            if not is_valid:
                for err in errors:
                    accessibility_blocking_errors.append(f"Q: '{qv.question_text[:25]}...': {err}")

    if total_questions == 0:
        raise ValidationConflictException("Exam must contain at least one question before publication.")

    if accessibility_blocking_errors:
        raise AccessibilityGateException(accessibility_blocking_errors)

    # Mark exam as READY or LIVE or SCHEDULED
    if exam.start_at and exam.end_at and exam.start_at <= utc_now() <= exam.end_at:
        exam.status = ExamStatus.LIVE.value
    elif exam.start_at and exam.start_at > utc_now():
        exam.status = ExamStatus.SCHEDULED.value
    else:
        exam.status = ExamStatus.READY.value

    exam.published_at = utc_now()
    exam.updated_at = utc_now()
    db.commit()
    db.refresh(exam)

    log_audit_event(
        db,
        action="EXAM_PUBLISH",
        resource_type="Exam",
        resource_id=exam.id,
        actor_id=user_id,
        metadata={"total_questions": total_questions, "status": exam.status},
    )
    return get_examiner_exam(db, exam.id)


def get_examiner_exam(db: Session, exam_id: str) -> ExamExaminerResponse:
    """Retrieve full exam metadata for examiners and admins."""
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise EntityNotFoundException("Exam", exam_id)

    sections = (
        db.query(ExamSection)
        .filter(ExamSection.exam_id == exam_id)
        .order_by(ExamSection.display_order)
        .all()
    )
    section_responses = [
        SectionResponse(
            id=s.id,
            exam_id=s.exam_id,
            title=s.title,
            description=s.description,
            display_order=s.display_order,
            duration_seconds=s.duration_seconds,
            navigation_policy=s.navigation_policy,
            question_count=s.question_count,
        )
        for s in sections
    ]

    candidate_count = db.query(ExamCandidate).filter(ExamCandidate.exam_id == exam_id).count()

    return ExamExaminerResponse(
        id=exam.id,
        organization_id=exam.organization_id,
        title=exam.title,
        description=exam.description,
        instructions=exam.instructions,
        status=exam.status,
        duration_seconds=exam.duration_seconds,
        extra_time_seconds=exam.extra_time_seconds,
        start_at=exam.start_at,
        end_at=exam.end_at,
        language=exam.language,
        created_by=exam.created_by,
        published_at=exam.published_at,
        created_at=exam.created_at,
        updated_at=exam.updated_at,
        sections=section_responses,
        candidate_count=candidate_count,
    )


def list_candidate_exams(
    db: Session, candidate_id: str, page: int = 1, limit: int = 20
) -> tuple[List[ExamCandidateResponse], int, int]:
    """List accessible exams for candidate, including assigned exams or open ready/live exams."""
    query = db.query(Exam).filter(
        Exam.status.in_([ExamStatus.READY.value, ExamStatus.SCHEDULED.value, ExamStatus.LIVE.value])
    )
    exams_page, total, total_pages = paginate(query, page, limit)

    results: List[ExamCandidateResponse] = []
    for exam in exams_page:
        # Check candidate assignment status
        cand_assignment = (
            db.query(ExamCandidate)
            .filter(ExamCandidate.exam_id == exam.id, ExamCandidate.candidate_id == candidate_id)
            .first()
        )
        is_eligible = cand_assignment is not None and cand_assignment.eligibility_status == EligibilityStatus.ELIGIBLE.value
        attempt_status = cand_assignment.attempt_status if cand_assignment else AttemptStatus.NOT_ATTEMPTED.value

        sec_count = db.query(ExamSection).filter(ExamSection.exam_id == exam.id).count()
        total_q = sum(
            s.question_count
            for s in db.query(ExamSection).filter(ExamSection.exam_id == exam.id).all()
        )

        org_name = exam.organization.name if exam.organization else "GoWow Examination Authority"
        exam_code = f"GW-{exam.id[:8].upper()}"

        results.append(
            ExamCandidateResponse(
                id=exam.id,
                title=exam.title,
                description=exam.description,
                instructions=exam.instructions,
                duration_seconds=exam.duration_seconds,
                extra_time_seconds=exam.extra_time_seconds,
                language=exam.language,
                status=exam.status,
                start_at=exam.start_at,
                end_at=exam.end_at,
                section_count=sec_count,
                total_questions=total_q,
                is_eligible=is_eligible or True,  # Eligible if open or assigned
                attempt_status=attempt_status,
                organization_name=org_name,
                exam_code=exam_code,
            )
        )

    return results, total, total_pages


def get_candidate_exam_details(db: Session, exam_id: str, candidate_id: str) -> ExamCandidateResponse:
    """Retrieve detailed candidate view for a specific examination."""
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise EntityNotFoundException("Exam", exam_id)

    cand_assignment = (
        db.query(ExamCandidate)
        .filter(ExamCandidate.exam_id == exam.id, ExamCandidate.candidate_id == candidate_id)
        .first()
    )
    is_eligible = cand_assignment is not None and cand_assignment.eligibility_status == EligibilityStatus.ELIGIBLE.value
    attempt_status = cand_assignment.attempt_status if cand_assignment else AttemptStatus.NOT_ATTEMPTED.value

    sec_count = db.query(ExamSection).filter(ExamSection.exam_id == exam.id).count()
    total_q = sum(
        s.question_count
        for s in db.query(ExamSection).filter(ExamSection.exam_id == exam.id).all()
    )
    org_name = exam.organization.name if exam.organization else "GoWow Examination Authority"
    exam_code = f"GW-{exam.id[:8].upper()}"

    return ExamCandidateResponse(
        id=exam.id,
        title=exam.title,
        description=exam.description,
        instructions=exam.instructions,
        duration_seconds=exam.duration_seconds,
        extra_time_seconds=exam.extra_time_seconds,
        language=exam.language,
        status=exam.status,
        start_at=exam.start_at,
        end_at=exam.end_at,
        section_count=sec_count,
        total_questions=total_q,
        is_eligible=is_eligible or True,
        attempt_status=attempt_status,
        organization_name=org_name,
        exam_code=exam_code,
    )


def list_examiner_exams(
    db: Session, page: int = 1, limit: int = 50
) -> List[ExamExaminerResponse]:
    """List all exams for examiner management."""
    exams = db.query(Exam).order_by(Exam.created_at.desc()).offset((page - 1) * limit).limit(limit).all()
    results: List[ExamExaminerResponse] = []
    for ex in exams:
        results.append(get_examiner_exam(db, ex.id))
    return results


def import_candidate_roster_csv(
    db: Session,
    exam_id: str,
    csv_content: str,
    user_id: str,
    default_group: str = "Main Cohort",
) -> RosterCsvImportResponse:
    """
    Candidate Roster CSV Bulk Import.
    Enrolls candidates into the exam.
    Auto-provisions accounts for new candidates and applies accessibility accommodations.
    """
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise EntityNotFoundException("Exam", exam_id)

    # Find Candidate Role
    candidate_role = db.query(Role).filter(Role.name == "CANDIDATE").first()
    if not candidate_role:
        candidate_role = Role(name="CANDIDATE", description="Candidate role")
        db.add(candidate_role)
        db.flush()

    reader = csv.reader(io.StringIO(csv_content.strip()))
    results: List[RosterImportResultItem] = []
    total_rows = 0
    enrolled_count = 0
    new_users_count = 0
    skipped_count = 0

    header_skipped = False
    for row in reader:
        if not row or not any(field.strip() for field in row):
            continue

        first_val = row[0].strip().lower()
        if not header_skipped and ("name" in first_val or "email" in first_val or "roll" in first_val):
            header_skipped = True
            continue

        total_rows += 1
        name = row[0].strip() if len(row) > 0 else ""
        email = row[1].strip() if len(row) > 1 else ""
        cid_or_roll = row[2].strip() if len(row) > 2 else ""
        accommodations_raw = row[3].strip() if len(row) > 3 else ""

        if not email or "@" not in email:
            results.append(
                RosterImportResultItem(
                    name=name or "Unknown",
                    email=email or "N/A",
                    candidate_id=cid_or_roll or "N/A",
                    status="ERROR",
                    error_message="Invalid email address format.",
                )
            )
            skipped_count += 1
            continue

        # Split Name into first & last
        name_parts = name.split(None, 1)
        first_name = name_parts[0] if name_parts else "Candidate"
        last_name = name_parts[1] if len(name_parts) > 1 else "Student"

        # Check existing user
        user = db.query(User).filter(User.email.ilike(email)).first()
        is_new = False
        if not user:
            user_id_gen = (
                cid_or_roll
                if (cid_or_roll and len(cid_or_roll) <= 36 and not db.query(User).filter(User.id == cid_or_roll).first())
                else str(uuid.uuid4())
            )
            user = User(
                id=user_id_gen,
                email=email.lower(),
                first_name=first_name,
                last_name=last_name,
                password_hash=get_password_hash("Privis@2026"),
                is_active=True,
            )
            db.add(user)
            db.flush()
            user_role = UserRole(user_id=user.id, role_id=candidate_role.id)
            db.add(user_role)
            new_users_count += 1
            is_new = True

        # Process Accommodations
        applied_accommodations: List[str] = []
        if accommodations_raw:
            acc_clean = accommodations_raw.lower().replace("_", " ")
            prof = db.query(AccessibilityProfile).filter(AccessibilityProfile.user_id == user.id).first()
            if not prof:
                prof = AccessibilityProfile(user_id=user.id)
                db.add(prof)

            if "extra time" in acc_clean or "50%" in acc_clean or "time" in acc_clean:
                applied_accommodations.append("Extra Time Accommodation")
            if "screen reader" in acc_clean or "blind" in acc_clean:
                prof.screen_reader_mode = True
                prof.audio_assistance = True
                applied_accommodations.append("Screen Reader & Audio Assistance")
            if "high contrast" in acc_clean or "contrast" in acc_clean:
                prof.contrast_mode = "high_contrast"
                applied_accommodations.append("High Contrast Theme")
            if "large text" in acc_clean or "magnif" in acc_clean:
                prof.text_scale = "large"
                applied_accommodations.append("Large Text Scaling")
            if "keyboard" in acc_clean:
                prof.keyboard_navigation = True
                applied_accommodations.append("Keyboard Navigation")
            if "audio" in acc_clean:
                prof.audio_assistance = True
                if "Screen Reader & Audio Assistance" not in applied_accommodations:
                    applied_accommodations.append("Audio Assistance")

        # Check Enrollment
        existing_enrollment = (
            db.query(ExamCandidate)
            .filter(ExamCandidate.exam_id == exam_id, ExamCandidate.candidate_id == user.id)
            .first()
        )
        if existing_enrollment:
            results.append(
                RosterImportResultItem(
                    name=f"{user.first_name} {user.last_name}",
                    email=user.email,
                    candidate_id=user.id,
                    status="ALREADY_ENROLLED",
                    accommodations_applied=applied_accommodations,
                )
            )
        else:
            enrollment = ExamCandidate(
                exam_id=exam_id,
                candidate_id=user.id,
                eligibility_status=EligibilityStatus.ELIGIBLE.value,
                attempt_status=AttemptStatus.NOT_ATTEMPTED.value,
            )
            db.add(enrollment)
            enrolled_count += 1
            results.append(
                RosterImportResultItem(
                    name=f"{user.first_name} {user.last_name}",
                    email=user.email,
                    candidate_id=user.id,
                    status="NEW_USER_ENROLLED" if is_new else "ENROLLED",
                    accommodations_applied=applied_accommodations,
                )
            )

    db.commit()
    log_audit_event(
        db,
        action="EXAM_ROSTER_CSV_IMPORT",
        resource_type="Exam",
        resource_id=exam_id,
        actor_id=user_id,
        metadata={
            "total_rows": total_rows,
            "enrolled_count": enrolled_count,
            "new_users_count": new_users_count,
        },
    )

    return RosterCsvImportResponse(
        exam_id=exam_id,
        total_rows=total_rows,
        total_rows_processed=total_rows,
        success_count=enrolled_count,
        successfully_enrolled=enrolled_count,
        new_users_provisioned=new_users_count,
        new_users_created=new_users_count,
        error_count=skipped_count,
        skipped_or_errored=skipped_count,
        results=results,
    )


