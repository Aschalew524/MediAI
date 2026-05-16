import { getMeProfile } from "@/lib/me-api";

function isSafeReturnPath(path: string | null | undefined): path is string {
  if (!path || path.startsWith("//")) return false;
  return path.startsWith("/dashboard") || path.startsWith("/admin");
}

/**
 * Where to send the user after a successful sign-in (or "Continue" when already
 * authenticated). Admins → `/admin`; patients and doctors → `/dashboard` (home
 * UI differs by profile); users without onboarding → `/onboarding`.
 */
export async function resolvePostLoginDestination(options: {
  appRole?: "admin" | "user";
  from?: string | null;
}): Promise<string> {
  const safeFrom = isSafeReturnPath(options.from) ? options.from : null;

  if (options.appRole === "admin") {
    return safeFrom?.startsWith("/admin") ? safeFrom : "/admin";
  }

  try {
    const me = await getMeProfile();
    if (!me.profile) {
      return "/onboarding";
    }
    if (me.profile.professionalProfile) {
      return safeFrom ?? "/dashboard";
    }
    return safeFrom ?? "/dashboard";
  } catch {
    return safeFrom ?? "/dashboard";
  }
}
