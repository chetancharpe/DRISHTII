# GoWow User Guide

**Target Audience:** Candidates, Examiners, and Administrators  
**Platform Version:** 1.0.0

---

## 1. Candidate Guide

### A. Getting Started & Accessibility Calibration
1. **Sign Up / Login**: Navigate to `/register` or `/login`. Enter your email and password. Public registration assigns candidate privileges safely with strict password strength enforcement.
2. **Open Accessibility Preferences**:
   - Press **`Alt + A`** anywhere in the application to open the Quick Accessibility Settings modal.
   - Alternatively, choose **Accessibility** in the navigation header or sidebar.
3. **Configure Your Experience**:
   - **Language & Accent**: Switch between English and हिन्दी. The dynamic `<html lang="...">` attribute updates immediately and screen readers confirm the change.
   - **Synthesizer Voice**: Select your preferred browser speech synthesis voice matched to the active language (e.g. Hindi or English voices) and click **Listen to Voice Sample** to verify audio clarity.
   - **Contrast**: Select Standard, High Contrast (AAA Yellow on OLED Dark), or Maximum Contrast. In high-contrast mode, cyan `#00ffff` focus indicators and 2px borders are applied.
   - **Text Scale**: Choose from Default (100%), Large (125%), X-Large (150%), or Maximum (200%) with fluid responsive layout scaling.
   - **Screen Reader Optimization**: Enable to turn on explicit ARIA landmark labels, polite live region announcements, and enhanced keyboard trapping.
   - **Audio Assistance / TTS**: Enable in-app speech assistance to have question stems and choices read aloud with adjustable speech rate.

### B. Blind-First Learning & Practice
1. Open **Practice** or **Learn** from the candidate navigation.
2. Filter topics by subject or difficulty.
3. **Audio-Guided Lessons**: Control audio playback speed (0.75x, 1.0x, 1.25x, 1.5x) with dedicated keyboard shortcuts.
4. **Mathematical Expressions**: Equations render visually via KaTeX and simultaneously provide accessible spoken transcripts ("fraction x over y") for screen readers.
5. **Accessible Data Tables**: Tabular pedagogical content announces cell coordinates (Row X, Column Y) alongside row and column headers.
6. Practice immediate-feedback questions to strengthen weaker concepts before taking an official exam.

### C. Taking a Live Examination
1. Navigate to **Examinations** and select your scheduled test.
2. Review the accessible exam instructions and timing policy.
3. Click **Start Examination**:
   - The authoritative server timer will begin counting down, synchronized via server time offset to eliminate local clock tampering.
   - You will hear spoken audio warnings at 15 minutes, 5 minutes, and 1 minute remaining.
4. **Keyboard Navigation Shortcuts**:
   - Keys **`1`**, **`2`**, **`3`**, **`4`**: Select multiple-choice option A, B, C, or D.
   - Key **`N`** or **`Alt + N`**: Navigate to the Next question (auto-saves response).
   - Key **`P`** or **`Alt + P`**: Navigate to the Previous question.
   - Key **`M`** or **`Alt + M`**: Mark / unmark question for review.
   - Key **`C`** or **`Alt + C`**: Clear selected answer.
   - Key **`L`** or **`Alt + L`**: Read question aloud via Text-to-Speech.
   - Key **`Alt + S`**: Open Submit Examination Confirmation Dialog.
5. **Answer Saving & Internet Loss**:
   - Answers save automatically upon selection with an immediate visual and ARIA live confirmation.
   - If your network disconnects, an accessible offline badge appears. Continue answering questions without disruption; all answers are stored in an indexed offline queue and synchronized automatically with replay verification once reconnected.
6. **Submitting the Examination**:
   - Click **Submit Examination** or press `Alt + S`.
   - A confirmation dialog appears summarizing answered, flagged, and unanswered items with complete keyboard focus trapping.
   - Confirm submission to finalize. Your immutable submission receipt code (`GW-XXXXXXXX`) will be issued.

---

## 2. Examiner Guide

### A. Creating an Accessible Examination
1. Log in to your Examiner account and navigate to **Exams** $\rightarrow$ **Create Exam**.
2. Enter the exam title, duration in minutes, and candidate instructions.
3. Add examination sections (e.g., *Section 1: General Science*, *Section 2: Logic*).

### B. Authoring Questions & AI Alt-Text Verification Gate
1. Use the **Question Bank** or add questions directly within an exam section.
2. Provide clear, self-contained question text and distinct options.
3. **Accessibility Requirements & AI Verification Gate**:
   - If your question includes an image or chart, you **must** supply descriptive **Alternative Text**.
   - The integrated **AI Alt-Text Verification Gate** automatically inspects descriptions to ensure they exceed 20 characters and provides specific structural feedback before allowing questions to be saved.
   - For mathematical equations, supply the **Spoken Formula Transcript** so blind examinees hear "fraction x over y" rather than raw LaTeX syntax.
   - Avoid color-only cues such as "refer to the red box". Use textual labels like "in Table 1, Column 2".

### C. Candidate Roster CSV Bulk Import
1. Navigate to **Examiner** $\rightarrow$ **Candidates** or **Roster Import**.
2. Upload a standard CSV roster containing `full_name`, `email`, and `accommodation_multiplier`.
3. The platform automatically provisions candidate accounts with secure password hashing and applies custom accommodation multipliers (`1.0x`, `1.5x`, `2.0x`) granting extra time during live exams.

### D. Psychometric Item Analytics & Reports
1. Navigate to **Analytics** for any published or completed exam.
2. Review real-time psychometric metrics calculated across all submissions:
   - **Difficulty Index ($p$)**: Proportion of examinees answering correctly (flagging items with $p < 0.2$ as too hard or $p > 0.9$ as too easy).
   - **Discrimination Index ($D$)**: Upper 27% vs lower 27% performance differential.
   - **Cronbach's Alpha ($\alpha$)**: Internal consistency reliability metric.
   - **Point-Biserial Correlation ($r_{pbis}$)**: Correlation between question score and total exam performance.
   - **Distractor Distribution**: Frequency analysis across incorrect options.
   - **Accommodation Equity Analysis**: Compares average scores between standard test-takers and candidates using extra-time accommodations.
3. Click **Export CSV** to stream an accessible CSV performance report.

### E. Pre-Publication Gate & Publishing
1. Click **Validate Accessibility** to audit your exam prior to release.
2. Address any **BLOCKING** errors reported by the system.
3. Click **Publish Exam**. Once published, structural questions are locked to protect testing integrity.

---

## 3. Administrator Guide

### A. User & Role Governance
1. Log in to the Admin Dashboard at `/admin/dashboard`.
2. Manage candidate and examiner accounts, activate/deactivate credentials, and enforce password resets.
3. Verify organization boundaries to ensure institutional candidate records remain strictly isolated.

### B. Health Telemetry & Audit Logs
1. Inspect live system readiness at `/health/ready`.
2. Review the **Audit Log** for security events, authentication successes/failures, exam publications, and score finalizations.
