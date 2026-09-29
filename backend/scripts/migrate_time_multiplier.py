import sqlite3
import glob

dbs = glob.glob("*.db") + glob.glob("backend/*.db")
print("Found DBs:", dbs)

for db_path in dbs:
    try:
        conn = sqlite3.connect(db_path)
        tables = [r[0] for r in conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
        if "exam_candidates" in tables:
            cols = [c[1] for c in conn.execute("PRAGMA table_info(exam_candidates)").fetchall()]
            print(f"{db_path}: cols in exam_candidates: {cols}")
            if "time_multiplier" not in cols:
                conn.execute("ALTER TABLE exam_candidates ADD COLUMN time_multiplier FLOAT DEFAULT 1.0")
                conn.commit()
                print(f"Added time_multiplier column to {db_path}")
            else:
                print(f"time_multiplier already exists in {db_path}")
        conn.close()
    except Exception as e:
        print(f"Error on {db_path}: {e}")
