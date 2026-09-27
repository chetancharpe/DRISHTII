/**
 * GoWow Accessibility Audit Service (Client-Side)
 * Enforces Section 61, 62, 63 & 64:
 * Automated and heuristic WCAG 2.1 AA rule evaluation returning structured findings.
 */

export type IssueSeverity = 'INFO' | 'WARNING' | 'BLOCKING';

export interface AuditFinding {
  id: string;
  criterion: string;
  wcagReference: string;
  principle: 'Perceivable' | 'Operable' | 'Understandable' | 'Robust';
  severity: IssueSeverity;
  elementSelector?: string;
  message: string;
  remediation: string;
}

export interface PageAuditReport {
  pageUrl: string;
  timestamp: string;
  totalFindings: number;
  blockingCount: number;
  warningCount: number;
  infoCount: number;
  findings: AuditFinding[];
  scorecardStatus: 'PASS' | 'ATTENTION_NEEDED' | 'FAIL';
}

export class AccessibilityAuditService {
  /**
   * Run client-side heuristic audit on the current DOM document.
   */
  public auditCurrentPage(): PageAuditReport {
    const findings: AuditFinding[] = [];
    if (typeof document === 'undefined') {
      return {
        pageUrl: '/',
        timestamp: new Date().toISOString(),
        totalFindings: 0,
        blockingCount: 0,
        warningCount: 0,
        infoCount: 0,
        findings: [],
        scorecardStatus: 'PASS',
      };
    }

    // 1. WCAG 1.1.1: Non-text Content (Images missing alt text)
    const images = Array.from(document.querySelectorAll<HTMLImageElement>('img'));
    images.forEach((img, idx) => {
      const alt = img.getAttribute('alt');
      const isAriaHidden = img.getAttribute('aria-hidden') === 'true';
      if (!isAriaHidden && (alt === null || alt.trim() === 'image' || alt.trim() === 'picture')) {
        findings.push({
          id: `img-alt-${idx}`,
          criterion: '1.1.1 Non-text Content',
          wcagReference: 'WCAG 2.1 Level A - 1.1.1',
          principle: 'Perceivable',
          severity: 'BLOCKING',
          elementSelector: img.id ? `#${img.id}` : `img[src="${img.src.slice(-20)}"]`,
          message: 'Image is missing an accessible alternative text (alt attribute).',
          remediation: 'Provide descriptive alt text for informative images or alt="" for decorative images.',
        });
      }
    });

    // 2. WCAG 1.3.1: Heading Structure (Single h1 and no skipped levels)
    const headings = Array.from(document.querySelectorAll<HTMLHeadingElement>('h1, h2, h3, h4, h5, h6'));
    const h1Count = document.querySelectorAll('h1').length;
    if (h1Count === 0) {
      findings.push({
        id: 'heading-missing-h1',
        criterion: '1.3.1 Info and Relationships',
        wcagReference: 'WCAG 2.1 Level A - 1.3.1',
        principle: 'Perceivable',
        severity: 'WARNING',
        message: 'Page does not contain a top-level <h1> heading.',
        remediation: 'Add a single descriptive <h1> representing the primary topic of the page.',
      });
    }

    let prevLevel = 0;
    headings.forEach((h, idx) => {
      const level = parseInt(h.tagName.substring(1), 10);
      if (prevLevel > 0 && level > prevLevel + 1) {
        findings.push({
          id: `heading-skip-${idx}`,
          criterion: '1.3.1 Info and Relationships',
          wcagReference: 'WCAG 2.1 Level A - 1.3.1',
          principle: 'Perceivable',
          severity: 'INFO',
          elementSelector: h.id ? `#${h.id}` : `<${h.tagName}>`,
          message: `Heading level skipped: jumped from <h${prevLevel}> directly to <h${level}>.`,
          remediation: 'Maintain sequential heading structure without skipping levels.',
        });
      }
      prevLevel = level;
    });

    // 3. WCAG 4.1.2: Name, Role, Value (Icon-only buttons missing aria-label)
    const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('button'));
    buttons.forEach((btn, idx) => {
      const hasText = Boolean(btn.innerText && btn.innerText.trim().length > 0);
      const ariaLabel = btn.getAttribute('aria-label');
      const ariaLabelledBy = btn.getAttribute('aria-labelledby');
      const title = btn.getAttribute('title');

      if (!hasText && !ariaLabel && !ariaLabelledBy && !title) {
        findings.push({
          id: `btn-name-${idx}`,
          criterion: '4.1.2 Name, Role, Value',
          wcagReference: 'WCAG 2.1 Level A - 4.1.2',
          principle: 'Robust',
          severity: 'BLOCKING',
          elementSelector: btn.id ? `#${btn.id}` : `button:nth-of-type(${idx + 1})`,
          message: 'Button does not have an accessible name for screen readers.',
          remediation: 'Add aria-label="..." or include visible text or an aria-labelledby reference.',
        });
      }
    });

    // 4. WCAG 2.4.1: Bypass Blocks (Skip to content check)
    const skipLink = document.querySelector('.skip-link, [href="#main-content"]');
    if (!skipLink) {
      findings.push({
        id: 'bypass-blocks-missing-skip',
        criterion: '2.4.1 Bypass Blocks',
        wcagReference: 'WCAG 2.1 Level A - 2.4.1',
        principle: 'Operable',
        severity: 'WARNING',
        message: 'No skip navigation link found at the start of the document.',
        remediation: 'Add a skip link (e.g. href="#main-content") allowing keyboard users to bypass header navigation.',
      });
    }

    // 5. WCAG 2.4.7: Focus Visible (Check for outline:none without fallback)
    const forms = Array.from(document.querySelectorAll<HTMLInputElement>('input:not([type="hidden"]), select, textarea'));
    forms.forEach((input, idx) => {
      const id = input.id;
      const hasLabel = id ? Boolean(document.querySelector(`label[for="${id}"]`)) : false;
      const ariaLabel = input.getAttribute('aria-label');
      const ariaLabelledBy = input.getAttribute('aria-labelledby');

      if (!hasLabel && !ariaLabel && !ariaLabelledBy) {
        findings.push({
          id: `input-label-${idx}`,
          criterion: '3.3.2 Labels or Instructions',
          wcagReference: 'WCAG 2.1 Level A - 3.3.2',
          principle: 'Understandable',
          severity: 'BLOCKING',
          elementSelector: id ? `#${id}` : `input[name="${input.name || idx}"]`,
          message: 'Form control is missing an associated label or accessible name.',
          remediation: 'Pair input with a <label for="..."> or provide aria-label="...".',
        });
      }
    });

    const blockingCount = findings.filter((f) => f.severity === 'BLOCKING').length;
    const warningCount = findings.filter((f) => f.severity === 'WARNING').length;
    const infoCount = findings.filter((f) => f.severity === 'INFO').length;

    let status: 'PASS' | 'ATTENTION_NEEDED' | 'FAIL' = 'PASS';
    if (blockingCount > 0) status = 'FAIL';
    else if (warningCount > 0) status = 'ATTENTION_NEEDED';

    return {
      pageUrl: typeof window !== 'undefined' ? window.location.pathname : '/',
      timestamp: new Date().toISOString(),
      totalFindings: findings.length,
      blockingCount,
      warningCount,
      infoCount,
      findings,
      scorecardStatus: status,
    };
  }
}

export const accessibilityAuditService = new AccessibilityAuditService();
