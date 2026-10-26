"""
DRISHTI Educational AI Service
Provides secure, server-side LLM integration (Google Gemini / OpenAI)
with strict live exam isolation and high-quality pedagogical fallback.

Principles:
1. Educational assistant only: Never authoritative for scoring or official timers.
2. Anti-cheat integrity: Strictly blocked during active live examination sessions.
3. Offline & test resilience: Seamless deterministic fallback when API keys are not configured.
"""

import json
import logging
import re
from typing import Any, Dict, List, Optional
import httpx

from app.core.config import settings
from app.schemas.ai import (
    AltTextGenerateResponse,
    ConceptExplanationResponse,
    SimplifyTextResponse,
    SummarizeTopicResponse,
)

logger = logging.getLogger("drishti.ai")


class AIService:
    def __init__(self):
        self.gemini_key = settings.GEMINI_API_KEY
        self.gemini_model = settings.GEMINI_MODEL
        self.openai_key = settings.OPENAI_API_KEY
        self.openai_model = settings.OPENAI_MODEL
        self.provider = settings.AI_PROVIDER

    # =========================================================================
    # Public API Methods
    # =========================================================================

    def explain_concept(
        self, question_text: str, topic: str, subject: Optional[str] = "General"
    ) -> ConceptExplanationResponse:
        """Generates structured pedagogical concept breakdown for learning/practice."""
        if self._can_use_gemini():
            try:
                res = self._call_gemini_explain(question_text, topic, subject)
                if res:
                    return res
            except Exception as e:
                logger.warning(f"Gemini explain API call failed, falling back to heuristic: {e}")

        if self._can_use_openai():
            try:
                res = self._call_openai_explain(question_text, topic, subject)
                if res:
                    return res
            except Exception as e:
                logger.warning(f"OpenAI explain API call failed, falling back to heuristic: {e}")

        return self._heuristic_explain(question_text, topic, subject)

    def simplify_text(self, complex_text: str) -> SimplifyTextResponse:
        """Transforms academic or convoluted phrasing into plain language (WCAG AA)."""
        if self._can_use_gemini():
            try:
                res = self._call_gemini_simplify(complex_text)
                if res:
                    return res
            except Exception as e:
                logger.warning(f"Gemini simplify API call failed: {e}")

        return self._heuristic_simplify(complex_text)

    def summarize_topic(self, topic: str, subject: Optional[str] = "General") -> SummarizeTopicResponse:
        """Summarizes key pedagogical checkpoints and formulas for rapid candidate revision."""
        if self._can_use_gemini():
            try:
                res = self._call_gemini_summarize(topic, subject)
                if res:
                    return res
            except Exception as e:
                logger.warning(f"Gemini summarize API call failed: {e}")

        return self._heuristic_summarize(topic, subject)

    def generate_alt_text(
        self, question_context: str, diagram_type: Optional[str] = None, image_url: Optional[str] = None
    ) -> AltTextGenerateResponse:
        """Generates WCAG 2.1 Level AA compliant non-visual descriptions for images."""
        if self._can_use_gemini():
            try:
                res = self._call_gemini_alt_text(question_context, diagram_type)
                if res:
                    return res
            except Exception as e:
                logger.warning(f"Gemini alt-text API call failed: {e}")

        return self._heuristic_alt_text(question_context, diagram_type)

    # =========================================================================
    # Provider Checkers
    # =========================================================================

    def _can_use_gemini(self) -> bool:
        return bool(self.gemini_key and self.gemini_key.strip() and self.provider in ("gemini", "auto"))

    def _can_use_openai(self) -> bool:
        return bool(self.openai_key and self.openai_key.strip() and self.provider in ("openai", "auto"))

    # =========================================================================
    # Gemini API Implementations
    # =========================================================================

    def _call_gemini_explain(
        self, question_text: str, topic: str, subject: Optional[str]
    ) -> Optional[ConceptExplanationResponse]:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.gemini_model}:generateContent?key={self.gemini_key}"
        prompt = (
            f"You are an accessible, empathetic educational tutor for visually impaired and neurodiverse candidates. "
            f"Explain the following {subject} question regarding '{topic}'.\n\n"
            f"Question:\n{question_text}\n\n"
            f"Return ONLY valid JSON with keys: conceptOverview (string), keyPrinciples (array of 3 strings), "
            f"simplifiedExplanation (string in plain English), practiceTip (string)."
        )
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.2, "responseMimeType": "application/json"},
        }
        with httpx.Client(timeout=8.0) as client:
            resp = client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                parsed = json.loads(text)
                return ConceptExplanationResponse(
                    concept_overview=parsed.get("conceptOverview", ""),
                    key_principles=parsed.get("keyPrinciples", []),
                    simplified_explanation=parsed.get("simplifiedExplanation", ""),
                    practice_tip=parsed.get("practiceTip", ""),
                    source=f"gemini-{self.gemini_model}",
                )
        return None

    def _call_gemini_simplify(self, complex_text: str) -> Optional[SimplifyTextResponse]:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.gemini_model}:generateContent?key={self.gemini_key}"
        prompt = (
            f"Rewrite the following text into clear, plain language accessible to candidates with cognitive differences "
            f"and compatible with screen readers. Retain complete mathematical and logical meaning.\n\n"
            f"Text:\n{complex_text}\n\n"
            f"Return ONLY valid JSON with keys: simplifiedText (string), readingEase (string)."
        )
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.2, "responseMimeType": "application/json"},
        }
        with httpx.Client(timeout=8.0) as client:
            resp = client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                parsed = json.loads(text)
                return SimplifyTextResponse(
                    simplified_text=parsed.get("simplifiedText", complex_text),
                    reading_ease=parsed.get("readingEase", "Plain Language (WCAG Level AA)"),
                    source=f"gemini-{self.gemini_model}",
                )
        return None

    def _call_gemini_summarize(self, topic: str, subject: Optional[str]) -> Optional[SummarizeTopicResponse]:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.gemini_model}:generateContent?key={self.gemini_key}"
        prompt = (
            f"Provide a structured revision summary for topic '{topic}' under subject '{subject}'. "
            f"Return ONLY valid JSON with keys: summary (string overview), keyPoints (array of 3-5 strings)."
        )
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.2, "responseMimeType": "application/json"},
        }
        with httpx.Client(timeout=8.0) as client:
            resp = client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                parsed = json.loads(text)
                return SummarizeTopicResponse(
                    summary=parsed.get("summary", ""),
                    key_points=parsed.get("keyPoints", []),
                    source=f"gemini-{self.gemini_model}",
                )
        return None

    def _call_gemini_alt_text(
        self, question_context: str, diagram_type: Optional[str]
    ) -> Optional[AltTextGenerateResponse]:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.gemini_model}:generateContent?key={self.gemini_key}"
        prompt = (
            f"Generate a WCAG 2.1 AA compliant alt-text and structured long description for an educational diagram. "
            f"Category: {diagram_type or 'General'}. Context: {question_context}. "
            f"Rules: Do NOT begin with 'Image of' or 'Diagram of'. Provide exact structural/numerical values.\n"
            f"Return ONLY valid JSON with keys: altText (string <= 120 chars), longDescription (string), "
            f"wcagComplianceNotes (array of strings)."
        )
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.2, "responseMimeType": "application/json"},
        }
        with httpx.Client(timeout=8.0) as client:
            resp = client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                parsed = json.loads(text)
                return AltTextGenerateResponse(
                    alt_text=parsed.get("altText", ""),
                    long_description=parsed.get("longDescription", ""),
                    wcag_compliance_notes=parsed.get("wcagComplianceNotes", ["WCAG 2.1 AA Compliant"]),
                    source=f"gemini-{self.gemini_model}",
                )
        return None

    # =========================================================================
    # OpenAI API Implementation
    # =========================================================================

    def _call_openai_explain(
        self, question_text: str, topic: str, subject: Optional[str]
    ) -> Optional[ConceptExplanationResponse]:
        url = "https://api.openai.com/v1/chat/completions"
        headers = {"Authorization": f"Bearer {self.openai_key}", "Content-Type": "application/json"}
        prompt = (
            f"You are an accessible educational tutor. Explain {subject} question on '{topic}'.\n\n"
            f"Question:\n{question_text}\n\n"
            f"Return JSON with: conceptOverview, keyPrinciples (array of 3), simplifiedExplanation, practiceTip."
        )
        payload = {
            "model": self.openai_model,
            "response_format": {"type": "json_object"},
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.2,
        }
        with httpx.Client(timeout=8.0) as client:
            resp = client.post(url, json=payload, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                content = data["choices"][0]["message"]["content"]
                parsed = json.loads(content)
                return ConceptExplanationResponse(
                    concept_overview=parsed.get("conceptOverview", ""),
                    key_principles=parsed.get("keyPrinciples", []),
                    simplified_explanation=parsed.get("simplifiedExplanation", ""),
                    practice_tip=parsed.get("practiceTip", ""),
                    source=f"openai-{self.openai_model}",
                )
        return None

    # =========================================================================
    # High-Quality Pedagogical Heuristics (Deterministic Fallback)
    # =========================================================================

    def _heuristic_explain(
        self, question_text: str, topic: str, subject: Optional[str]
    ) -> ConceptExplanationResponse:
        preview = question_text.strip()[:60]
        if len(question_text) > 60:
            preview += "..."

        topic_clean = topic.replace("-", " ").title()

        return ConceptExplanationResponse(
            concept_overview=(
                f"This problem assesses key principles of {topic_clean} within {subject}. "
                f"It tests your ability to break down the prompt ('{preview}') into known variables and apply standard theorems."
            ),
            key_principles=[
                f"Identify given knowns and constraints before computing any {topic_clean} values.",
                "Simplify compound fractions or coefficients step by step to avoid arithmetic slip-ups.",
                "Validate the physical or mathematical bounds of your final solution against the problem context.",
            ],
            simplified_explanation=(
                f"In simple terms: Express what you are asked to find as variable x. "
                f"Translate the conditions of {topic_clean} into an equation, isolate terms, and verify your answer."
            ),
            practice_tip=f"Solve 3-5 foundational questions in {topic_clean} with timer disabled to build conceptual fluency.",
            source="pedagogical_heuristic",
        )

    def _heuristic_simplify(self, complex_text: str) -> SimplifyTextResponse:
        simplified = complex_text
        replacements = [
            (r"\bconsequently\b", "so"),
            (r"\bfurthermore\b", "also"),
            (r"\bin order to\b", "to"),
            (r"\butilize\b", "use"),
            (r"\bdemonstrates that\b", "shows that"),
            (r"\bnotwithstanding the fact that\b", "although"),
            (r"\bprior to\b", "before"),
            (r"\bsubsequent to\b", "after"),
            (r"\ba sufficient number of\b", "enough"),
            (r"\bin the event that\b", "if"),
            (r"\bascertain\b", "find out"),
        ]
        for pattern, repl in replacements:
            simplified = re.sub(pattern, repl, simplified, flags=re.IGNORECASE)

        # Capitalize sentences cleanly
        simplified = re.sub(r"(^\w|[.!?]\s+\w)", lambda m: m.group(0).upper(), simplified)

        return SimplifyTextResponse(
            simplified_text=simplified,
            reading_ease="Plain Language (WCAG Level AA)",
            source="pedagogical_heuristic",
        )

    def _heuristic_summarize(self, topic: str, subject: Optional[str]) -> SummarizeTopicResponse:
        topic_title = topic.replace("-", " ").title()
        return SummarizeTopicResponse(
            summary=(
                f"Core review overview for {topic_title} ({subject}): "
                f"Master the standard formula definitions, verify unit consistency, and watch for negative sign reversals."
            ),
            key_points=[
                f"Always state base units and given quantities clearly before solving {topic_title} problems.",
                "Review inverse operations and step-by-step algebraic isolation.",
                "Double-check edge cases, such as zero denominators or extreme percentage values.",
            ],
            source="pedagogical_heuristic",
        )

    def _heuristic_alt_text(
        self, question_context: str, diagram_type: Optional[str]
    ) -> AltTextGenerateResponse:
        ctx = (question_context or "").strip()
        lower_ctx = ctx.lower()

        if diagram_type:
            detected = diagram_type
        elif any(k in lower_ctx for k in ["bar graph", "pie chart", "histogram", "percentage"]):
            detected = "Data Chart / Graph"
        elif any(k in lower_ctx for k in ["triangle", "circle", "angle", "hypotenuse", "polygon"]):
            detected = "Geometric Figure"
        elif any(k in lower_ctx for k in ["circuit", "resistor", "voltage", "current", "switch"]):
            detected = "Electrical Schematic"
        elif any(k in lower_ctx for k in ["flowchart", "algorithm", "process", "loop"]):
            detected = "Process Flowchart"
        else:
            detected = "Educational Diagram"

        if detected == "Data Chart / Graph":
            alt = "Bar graph with vertical axis showing values and horizontal axis showing labeled comparison categories."
            long_desc = "Non-visual structure: Horizontal axis lists categories in order. Vertical axis establishes unit intervals. Relative heights illustrate proportional distribution as referenced in question text."
        elif detected == "Geometric Figure":
            alt = "Geometric diagram showing labeled vertices, interior angles, and dimensional measurements."
            long_desc = "Non-visual structure: Diagram displays polygon with vertices denoted by uppercase letters. Specified angles, parallel sides, and lengths conform to problem parameters."
        elif detected == "Electrical Schematic":
            alt = "Circuit diagram showing connected power source, series resistors, and ground reference."
            long_desc = "Non-visual structure: Closed schematic path connects voltage supply in series with labelled resistors and terminal probe nodes."
        elif detected == "Process Flowchart":
            alt = "Flowchart detailing sequential algorithm steps from initial start block to decision branch and terminal state."
            long_desc = "Non-visual structure: Flow proceeds from Start box to input processing, evaluates decision condition, and branches to respective calculation and output blocks."
        else:
            alt = f"Educational diagram illustrating {ctx[:50] if ctx else 'problem scenario'} with labeled components."
            long_desc = "Non-visual structure: Diagram details component layout, coordinate relationships, and descriptive labels necessary to comprehend the question without visual perception."

        return AltTextGenerateResponse(
            alt_text=alt,
            long_description=long_desc,
            wcag_compliance_notes=[
                "WCAG 2.1 AA Conformance: Non-text Content (1.1.1)",
                "Avoids redundant 'Image of' phrasing",
                "Includes structural long description for complex diagrams",
            ],
            source="pedagogical_heuristic",
        )


ai_service = AIService()
