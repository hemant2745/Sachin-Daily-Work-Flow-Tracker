/**
 * Administrator Authorization & Allowlist Management
 * 
 * Enforces single-administrator access for Sachin Behera Daily Workflow.
 * All checks are performed server-side. Browser modifications cannot elevate privileges.
 */

export const DEFAULT_ADMIN_EMAIL = "sachin.behera@collegevidya.com";

/**
 * Returns the list of authorized administrator emails from trusted environment variables.
 * Server-only: Does not expose secrets or allowlist to client code.
 */
export function getAdminAllowlist(): string[] {
  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  const adminEmails = process.env.ADMIN_EMAILS?.trim();

  const allowlist = new Set<string>();

  if (adminEmail) {
    allowlist.add(adminEmail.toLowerCase());
  }

  if (adminEmails) {
    adminEmails
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
      .forEach((e) => allowlist.add(e));
  }

  // If no environment variable is explicitly provided yet, use default Sachin Behera identity
  if (allowlist.size === 0) {
    allowlist.add(DEFAULT_ADMIN_EMAIL.toLowerCase());
  }

  return Array.from(allowlist);
}

/**
 * Evaluates whether an email string matches the authorized administrator allowlist.
 */
export function isAuthorizedAdminEmail(email?: string | null): boolean {
  if (!email || typeof email !== "string") {
    return false;
  }
  const normalized = email.trim().toLowerCase();
  const allowlist = getAdminAllowlist();
  return allowlist.includes(normalized);
}

export type SessionAccessStatus = 
  | "UNAUTHENTICATED"
  | "AUTHORIZED_ADMIN"
  | "UNAUTHORIZED_USER";

export interface SessionAccessResult {
  isAuthorized: boolean;
  status: SessionAccessStatus;
  userEmail: string | null;
  message?: string;
}

/**
 * Evaluates access status for a given user record.
 */
export function evaluateSessionAccess(user: { email?: string | null } | null): SessionAccessResult {
  if (!user || !user.email) {
    return {
      isAuthorized: false,
      status: "UNAUTHENTICATED",
      userEmail: null,
      message: "No active session found. Please sign in.",
    };
  }

  const isAuthorized = isAuthorizedAdminEmail(user.email);

  if (isAuthorized) {
    return {
      isAuthorized: true,
      status: "AUTHORIZED_ADMIN",
      userEmail: user.email,
    };
  }

  return {
    isAuthorized: false,
    status: "UNAUTHORIZED_USER",
    userEmail: user.email,
    message: `Access denied. The account (${user.email}) is not authorized as an administrator for Sachin Behera Daily Workflow.`,
  };
}

export interface RouteAccessEvaluation {
  shouldRedirect: boolean;
  redirectTo?: string;
  reason?: string;
}

/**
 * Pure evaluation function for route protection.
 * Can be tested deterministically in unit tests without live network calls.
 */
export function evaluateRouteAccess(
  pathname: string,
  user: { email?: string | null } | null,
  isConfigured: boolean
): RouteAccessEvaluation {
  const isProtectedPath = pathname.startsWith("/dashboard");
  const isAuthPath = pathname === "/login" || pathname === "/";

  // If Supabase is not configured yet:
  if (!isConfigured) {
    if (isProtectedPath) {
      return {
        shouldRedirect: true,
        redirectTo: "/login?notice=setup_required",
        reason: "Supabase credentials are not configured in .env.local",
      };
    }
    return { shouldRedirect: false };
  }

  const session = evaluateSessionAccess(user);

  // Protected route handling
  if (isProtectedPath) {
    if (session.status === "UNAUTHENTICATED") {
      return {
        shouldRedirect: true,
        redirectTo: `/login?redirect=${encodeURIComponent(pathname)}&error=unauthenticated`,
        reason: "User is not authenticated",
      };
    }

    if (session.status === "UNAUTHORIZED_USER") {
      return {
        shouldRedirect: true,
        redirectTo: "/login?error=unauthorized",
        reason: "User is authenticated but not an authorized administrator",
      };
    }

    return { shouldRedirect: false };
  }

  // Auth route handling (prevent authenticated admin from seeing login)
  if (isAuthPath) {
    if (session.status === "AUTHORIZED_ADMIN") {
      return {
        shouldRedirect: true,
        redirectTo: "/dashboard",
        reason: "Authorized administrator already has an active session",
      };
    }
  }

  return { shouldRedirect: false };
}
