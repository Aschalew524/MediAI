import { isAxiosError } from "axios";

import { getFriendlyAxiosMessage } from "@/lib/axios-error-messages";

/** User-facing hint when live chart API is unavailable. */
export function getAdminAnalyticsLoadMessage(reason: unknown): string {
  if (!isAxiosError(reason)) {
    return getFriendlyAxiosMessage(reason, "Could not load chart data.");
  }

  const status = reason.response?.status;

  if (status === 404) {
    return (
      "Chart API not found on the server (GET /admin/analytics). " +
      "Redeploy MediAI_backend with the latest build, then refresh."
    );
  }

  if (status === 401 || status === 403) {
    return "Sign in as an admin to load dashboard charts.";
  }

  if (status != null && status >= 500) {
    const server = getFriendlyAxiosMessage(reason, "");
    if (server.includes("Query Engine") || server.includes("Prisma")) {
      return (
        "Server database runtime error — redeploy MediAI_backend after the latest " +
        "Vercel build (Prisma engine fix). Showing billing estimates until then."
      );
    }
    return (
      server ||
      "Server error loading charts. Showing billing estimates until the API recovers."
    );
  }

  return getFriendlyAxiosMessage(reason, "Could not load chart data.");
}
