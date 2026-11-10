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

export type UserRole = "admin" | "counselor" | "unauthorized" | "unauthenticated";

export type SessionAccessStatus = 
  | "UNAUTHENTICATED"
  | "AUTHORIZED_ADMIN"
  | "AUTHORIZED_COUNSELOR"
  | "UNAUTHORIZED_USER";

export interface SessionAccessResult {
  isAuthorized: boolean;
  role: UserRole;
  status: SessionAccessStatus;
  userEmail: string | null;
  counselorId?: string | null;
  message?: string;
}

/**
 * Evaluates access status for a given user record.
 * Supports both Admin and Counselor roles.
 */
export function evaluateSessionAccess(
  user: { email?: string | null; id?: string; app_metadata?: any; user_metadata?: any } | null,
  counselorInfo?: { id: string; email?: string | null; is_active: boolean } | null
): SessionAccessResult {
  if (!user || !user.email) {
    return {
      isAuthorized: false,
      role: "unauthenticated",
      status: "UNAUTHENTICATED",
      userEmail: null,
      message: "No active session found. Please sign in.",
    };
  }

  const isAdmin = isAuthorizedAdminEmail(user.email);
  if (isAdmin) {
    return {
      isAuthorized: true,
      role: "admin",
      status: "AUTHORIZED_ADMIN",
      userEmail: user.email,
    };
  }

  // Check if user is an authorized counselor
  const isCounselor =
    Boolean(counselorInfo && counselorInfo.is_active) ||
    user.app_metadata?.role === "counselor" ||
    user.user_metadata?.role === "counselor";

  if (isCounselor) {
    return {
      isAuthorized: true,
      role: "counselor",
      status: "AUTHORIZED_COUNSELOR",
      userEmail: user.email,
      counselorId: counselorInfo?.id || null,
    };
  }

  return {
    isAuthorized: false,
    role: "unauthorized",
    status: "UNAUTHORIZED_USER",
    userEmail: user.email,
    message: `Access denied. The account (${user.email}) is not authorized for Sachin Daily Work Flow Tracker.`,
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
  user: { email?: string | null; id?: string; app_metadata?: any; user_metadata?: any } | null,
  isConfigured: boolean,
  counselorInfo?: { id: string; email?: string | null; is_active: boolean } | null
): RouteAccessEvaluation {
  const isAdminPath = pathname.startsWith("/dashboard");
  const isCounselorPath = pathname.startsWith("/counselor");
  const isProtectedPath = isAdminPath || isCounselorPath;
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

  const session = evaluateSessionAccess(user, counselorInfo);

  // 1. Admin protected routes (/dashboard/*)
  if (isAdminPath) {
    if (session.status === "UNAUTHENTICATED") {
      return {
        shouldRedirect: true,
        redirectTo: `/login?redirect=${encodeURIComponent(pathname)}&error=unauthenticated`,
        reason: "User is not authenticated",
      };
    }

    if (session.status === "AUTHORIZED_COUNSELOR") {
      // Counselors are strictly restricted from /dashboard admin console
      return {
        shouldRedirect: true,
        redirectTo: "/counselor",
        reason: "Counselors are redirected to their individual counselor dashboard",
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

  // 2. Counselor protected routes (/counselor/*)
  if (isCounselorPath) {
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
        reason: "User is not authorized as a team counselor",
      };
    }

    // Both Counselors and Admins can view counselor route (Admin has supervisor view)
    return { shouldRedirect: false };
  }

  // 3. Auth routes (/login or /)
  if (isAuthPath) {
    if (session.status === "AUTHORIZED_ADMIN") {
      return {
        shouldRedirect: true,
        redirectTo: "/dashboard",
        reason: "Authorized administrator already has an active session",
      };
    }

    if (session.status === "AUTHORIZED_COUNSELOR") {
      return {
        shouldRedirect: true,
        redirectTo: "/counselor",
        reason: "Authorized counselor already has an active session",
      };
    }
  }

  return { shouldRedirect: false };
}
