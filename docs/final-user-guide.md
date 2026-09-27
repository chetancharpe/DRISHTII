# GoWow User Guide

**Target Audience:** Candidates, Examiners, and Administrators  
**Platform Version:** 1.0.0

---

## 1. Candidate Guide

### A. Getting Started & Accessibility Calibration
1. **Sign Up / Login**: Navigate to `/register` or `/login`. Enter your email and password.
2. **Open Accessibility Preferences**:
   - Press **`Alt + A`** anywhere in the application to open the Quick Accessibility Settings modal.
   - Alternatively, choose **Accessibility** in the left sidebar navigation.
3. **Configure Your Experience**:
   - **Contrast**: Select Standard, High Contrast (Yellow on Dark), or Maximum Contrast.
   - **Text Scale**: Choose from Default (100%), Large (125%), X-Large (150%), or Maximum (200%).
   - **Screen Reader Optimization**: Enable to turn on explicit ARIA landmark labels, polite live region announcements, and enhanced keyboard trapping.
   - **Audio Assistance / TTS**: Enable in-app speech assistance to have question stems and choices read aloud with adjustable speech rate.

### B. Practice & Mock Examinations
1. Open **Practice** or **Mock Tests** from the candidate sidebar.
2. Filter topics by subject or difficulty.
3. Practice immediate-feedback questions to strengthen weaker concepts before taking an official exam.

### C. Taking a Live Examination
1. Navigate to **Examinations** and select your scheduled test.
2. Review the accessible exam instructions and timing policy.
3. Click **Start Examination**:
   - The authoritative server timer will begin counting down.
   - You will hear spoken audio warnings at 10 minutes, 5 minutes, and 1 minute remaining.
4. **Keyboard Navigation Shortcuts**:
   - Keys **`1`**, **`2`**, **`3`**, **`4`**: Select multiple-choice option A, B, C, or D.
   - Key **`N`**: Navigate to the Next question.
   - Key **`P`**: Navigate to the Previous question.
   - Key **`F`**: Flag question for review.
   - Key **`R`**: Repeat question audio / formula transcript.
5. **Answer Saving & Internet Loss**:
   - Answers save automatically upon selection.
   - If your internet connection disconnects, an accessible offline badge appears. Continue answering questions; all selections will synchronize automatically once reconnected.
6. **Submitting the Examination**:
   - Click **Submit Examination** or press the Submit shortcut.
   - A confirmation dialog appears summarizing answered, flagged, and unanswered items.
   - Confirm submission to finalize. Your immutable submission receipt code (`GW-XXXXXXXX`) will be issued.

---

## 2. Examiner Guide

### A. Creating an Accessible Examination
1. Log in to your Examiner account and navigate to **Exams** $\rightarrow$ **Create Exam**.
2. Enter the exam title, duration in minutes, and candidate instructions.
3. Add examination sections (e.g., *Section 1: General Science*, *Section 2: Logic*).

### B. Authoring Questions & Accessibility Compliance
1. Use the **Question Bank** or add questions directly within an exam section.
2. Provide clear, self-contained question text and distinct options.
3. **Accessibility Requirements**:
   - If your question includes an image or chart, you **must** supply descriptive **Alternative Text** explaining all key visual data.
   - For mathematical equations, supply the **Spoken Formula Transcript** so blind examinees hear "fraction x over y" rather than raw LaTeX syntax.
   - Avoid color-only cues such as "refer to the red box". Use textual labels like "in Table 1, Column 2".

### C. Pre-Publication Gate & Publishing
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
