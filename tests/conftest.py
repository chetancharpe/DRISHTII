import os
import sys

# Ensure backend/ directory is on sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

os.environ["ENVIRONMENT"] = "test"
os.environ["DATABASE_URL"] = "sqlite:///./gowow_test.db"
os.environ["JWT_SECRET_KEY"] = "test_insecure_jwt_secret_key_minimum_64_characters_long_for_test_suite_runs_only"
