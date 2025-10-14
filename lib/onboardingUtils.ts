/* Utilities to log onboarding visits and validate local user storage */

export type VisitEntry = {
  step: string;
  at: string; // ISO timestamp
};

export function logOnboardingVisit(step: string) {
  try {
    const raw = localStorage.getItem('onboardingVisitLog');
    const list: VisitEntry[] = raw ? JSON.parse(raw) : [];
    list.push({ step, at: new Date().toISOString() });
    localStorage.setItem('onboardingVisitLog', JSON.stringify(list));
  } catch (error: unknown) {
    // ignore errors from storage but keep the message to satisfy linters
    console.warn('Could not log onboarding visit', error instanceof Error ? error.message : String(error));
  }
}

export function validateCurrentUser() {
  const issues: string[] = [];

  try {
    const raw = localStorage.getItem('currentUser');
    if (!raw) {
      issues.push('No currentUser in localStorage');
      return { ok: false, issues };
    }

    const user = JSON.parse(raw);

    if (!user.id) issues.push('missing id');
    if (!user.email) issues.push('missing email');
    if (!user.password) issues.push('missing password');
    if (!user.fullName) issues.push('missing fullName');
    if (!user.createdAt) issues.push('missing createdAt');
  } catch (error: unknown) {
    console.warn('validateCurrentUser parse error', error instanceof Error ? error.message : String(error));
    issues.push('currentUser JSON parse error');
  }

  return { ok: issues.length === 0, issues };
}
