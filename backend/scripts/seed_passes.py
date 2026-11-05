import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.base import Base
from app.db.database import engine, SessionLocal
from app.models.candidate_access_pass import CandidateAccessPass
from app.models.user import User

Base.metadata.create_all(bind=engine)
db = SessionLocal()

cand = db.query(User).filter(User.email == "candidate1@gowow.org").first()
ex = db.query(User).filter(User.email == "examiner@gowow.org").first()

if cand:
    p = db.query(CandidateAccessPass).filter(CandidateAccessPass.pass_code == "DRISHTI-PASS-8842").first()
    if not p:
        p = CandidateAccessPass(
            pass_code="DRISHTI-PASS-8842",
            candidate_id=cand.id,
            examiner_id=ex.id if ex else None,
            candidate_name="Rahul Sharma (Visually Impaired Candidate)",
            candidate_email=cand.email,
            is_active=True,
            accommodations="audio_assistance;high_contrast;screen_reader",
        )
        db.add(p)
        db.commit()
        print("Created DRISHTI-PASS-8842")
    else:
        print("DRISHTI-PASS-8842 already exists")
db.close()
