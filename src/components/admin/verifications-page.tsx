"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { isAxiosError } from "axios";

import {
  approveProfessionalVerification,
  getAdminProfessionalVerifications,
  rejectProfessionalVerification,
  type AdminProfessionalVerificationItem,
  type AdminVerificationFilter,
  type AdminVerificationStatus,
} from "@/lib/admin-ops-api";
import { messageFromAxiosData } from "@/lib/auth.types";
import { cn } from "@/lib/utils";

<<<<<<< HEAD
import { DashboardBackLink } from "@/components/dashboard/primitives";

=======
>>>>>>> dd2ad00 (Implement doctor verification feature with admin page and related components. Update TypeScript configuration to exclude test files. Add new pages for doctor verifications and verification management, including UI for approving and rejecting verifications. Enhance dashboard navigation to include doctor verification links.)
const FILTERS: { id: AdminVerificationFilter; label: string }[] = [
  { id: "awaiting", label: "Awaiting review" },
  { id: "verified", label: "Verified" },
  { id: "rejected", label: "Rejected" },
  { id: "pending", label: "All pending" },
  { id: "all", label: "All doctors" },
];

export function AdminVerificationsPage() {
  const [filter, setFilter] = useState<AdminVerificationFilter>("awaiting");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [items, setItems] = useState<AdminProfessionalVerificationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getAdminProfessionalVerifications({
          page,
          pageSize,
          status: filter,
          signal,
        });
        setItems(data.items);
        setTotal(data.total);
      } catch (err) {
        if (isAxiosError(err) && err.code === "ERR_CANCELED") return;
        setError(
          messageFromAxiosData(
            isAxiosError(err) ? err.response?.data : undefined,
          ) ?? "Could not load the verification queue.",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [filter, page, pageSize],
  );

  useEffect(() => {
    const ac = new AbortController();
    void load(ac.signal);
    return () => ac.abort();
  }, [load]);

  async function handleApprove(userId: string) {
    setBusyUserId(userId);
    setActionError(null);
    try {
      await approveProfessionalVerification(userId);
      await load();
    } catch (err) {
      setActionError(
        messageFromAxiosData(
          isAxiosError(err) ? err.response?.data : undefined,
        ) ?? "Approval failed. Please try again.",
      );
    } finally {
      setBusyUserId(null);
    }
  }

  async function handleReject(userId: string, notes: string) {
    setBusyUserId(userId);
    setActionError(null);
    try {
      await rejectProfessionalVerification(userId, notes);
      await load();
    } catch (err) {
      setActionError(
        messageFromAxiosData(
          isAxiosError(err) ? err.response?.data : undefined,
        ) ?? "Rejection failed. Please try again.",
      );
    } finally {
      setBusyUserId(null);
    }
  }

  return (
    <div className="space-y-6">
<<<<<<< HEAD
      <header className="flex flex-wrap items-start gap-3">
        <DashboardBackLink href="/admin" ariaLabel="Back to admin home" className="mt-0.5" />
        <div className="min-w-0 flex-1">
=======
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
>>>>>>> dd2ad00 (Implement doctor verification feature with admin page and related components. Update TypeScript configuration to exclude test files. Add new pages for doctor verifications and verification management, including UI for approving and rejecting verifications. Enhance dashboard navigation to include doctor verification links.)
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-foreground">
            <BadgeCheck className="size-6 text-primary" /> Doctor verifications
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Approve or reject professional accounts. Verified doctors can use
            the dashboard and appear on the public Top Doctors page.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
<<<<<<< HEAD
          className="inline-flex shrink-0 items-center gap-2 rounded-full border border-primary/20 bg-white px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/5 disabled:opacity-50"
=======
          className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/5 disabled:opacity-50"
>>>>>>> dd2ad00 (Implement doctor verification feature with admin page and related components. Update TypeScript configuration to exclude test files. Add new pages for doctor verifications and verification management, including UI for approving and rejecting verifications. Enhance dashboard navigation to include doctor verification links.)
          disabled={isLoading}
        >
          <RefreshCw className={cn("size-4", isLoading && "animate-spin")} />
          Refresh
        </button>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => {
              setFilter(f.id);
              setPage(1);
            }}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-medium transition",
              filter === f.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-primary/15 bg-white text-foreground hover:bg-primary/5",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error ? (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <AlertTriangle className="size-4" />
          {error}
        </div>
      ) : null}
      {actionError ? (
        <div
          role="alert"
          className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {actionError}
        </div>
      ) : null}

      {isLoading && items.length === 0 ? (
        <div className="flex items-center justify-center rounded-3xl border border-primary/15 bg-white px-6 py-16 text-sm text-muted-foreground">
          <Loader2 className="mr-2 size-4 animate-spin" /> Loading…
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-primary/15 bg-white px-6 py-12 text-center text-sm text-muted-foreground">
          No doctors match the current filter.
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <VerificationRow
              key={item.userId}
              item={item}
              busy={busyUserId === item.userId}
              onApprove={() => handleApprove(item.userId)}
              onReject={(notes) => handleReject(item.userId, notes)}
            />
          ))}
        </ul>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Page {page} of {totalPages} — {total} doctor
            {total === 1 ? "" : "s"}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || isLoading}
              className="rounded-full border border-primary/15 bg-white px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-primary/5 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || isLoading}
              className="rounded-full border border-primary/15 bg-white px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-primary/5 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Row                                                                        */
/* -------------------------------------------------------------------------- */

function VerificationRow({
  item,
  busy,
  onApprove,
  onReject,
}: {
  item: AdminProfessionalVerificationItem;
  busy: boolean;
  onApprove: () => void;
  onReject: (notes: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [rejectMode, setRejectMode] = useState(false);
  const [notes, setNotes] = useState("");
  const prof = item.professionalProfile ?? {};
  const fullName = stringFrom(prof, "fullName") ?? item.email;
  const specialty = stringFrom(prof, "specialty") ?? "—";
  const license = stringFrom(prof, "licenseNumber") ?? "—";
  const years = numberFrom(prof, "yearsOfExperience");
  const bio = stringFrom(prof, "bio") ?? "";

  return (
    <li className="rounded-2xl border border-primary/15 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-base font-semibold text-foreground">
              {fullName}
            </p>
            <StatusBadge
              status={item.status}
              hasSubmitted={!!item.submittedAt}
            />
          </div>
          <p className="text-sm text-muted-foreground">{item.email}</p>
          <dl className="mt-2 grid gap-x-4 gap-y-1 text-xs text-muted-foreground sm:grid-cols-2 md:grid-cols-3">
            <div>
              <dt className="inline font-medium text-foreground">
                Specialty:
              </dt>{" "}
              <dd className="inline">{specialty}</dd>
            </div>
            <div>
              <dt className="inline font-medium text-foreground">License:</dt>{" "}
              <dd className="inline">{license}</dd>
            </div>
            <div>
              <dt className="inline font-medium text-foreground">
                Experience:
              </dt>{" "}
              <dd className="inline">
                {years !== null ? `${years} year${years === 1 ? "" : "s"}` : "—"}
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-foreground">Submitted:</dt>{" "}
              <dd className="inline">
                {item.submittedAt
                  ? formatIsoLocal(item.submittedAt)
                  : "Not submitted"}
              </dd>
            </div>
            {item.reviewedAt ? (
              <div>
                <dt className="inline font-medium text-foreground">
                  Last reviewed:
                </dt>{" "}
                <dd className="inline">{formatIsoLocal(item.reviewedAt)}</dd>
              </div>
            ) : null}
          </dl>
          {item.notes ? (
            <p className="mt-2 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-900">
              <strong className="font-semibold">Previous rejection note:</strong>{" "}
              {item.notes}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-white px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-primary/5"
          >
            {open ? (
              <ChevronUp className="size-3.5" />
            ) : (
              <ChevronDown className="size-3.5" />
            )}
            {open ? "Hide details" : "View details"}
          </button>
          {item.status !== "verified" ? (
            <button
              type="button"
              onClick={onApprove}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {busy ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="size-3.5" />
              )}
              Approve
            </button>
          ) : null}
          {item.status !== "rejected" ? (
            <button
              type="button"
              onClick={() => setRejectMode((v) => !v)}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-full border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
            >
              <XCircle className="size-3.5" />
              {rejectMode ? "Cancel" : "Reject"}
            </button>
          ) : null}
        </div>
      </div>

      {rejectMode ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!notes.trim()) return;
            onReject(notes.trim());
            setRejectMode(false);
            setNotes("");
          }}
          className="mt-3 space-y-2 rounded-xl border border-rose-200 bg-rose-50/50 p-3"
        >
          <label className="block text-xs font-semibold text-rose-900">
            Reason (the doctor will see this)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="block w-full rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm focus:border-rose-400 focus:ring-2 focus:ring-rose-200 focus:outline-none"
            placeholder="e.g. Please attach a clearer license document and update your bio."
            rows={3}
            required
          />
          <div className="flex justify-end gap-2">
            <button
              type="submit"
              disabled={busy || !notes.trim()}
              className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
            >
              {busy ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Send rejection
            </button>
          </div>
        </form>
      ) : null}

      {open ? (
        <div className="mt-4 grid gap-3 rounded-xl border border-primary/10 bg-primary/3 p-3 text-sm">
          {bio ? (
            <Detail label="Bio">
              <p className="whitespace-pre-line">{bio}</p>
            </Detail>
          ) : null}
          <DetailRow label="Sub-specialty" value={stringFrom(prof, "subSpecialty")} />
          <DetailRow
            label="Hospital affiliation"
            value={stringFrom(prof, "hospitalAffiliation")}
          />
          <DetailRow
            label="License authority"
            value={stringFrom(prof, "licenseAuthority")}
          />
          <DetailRow
            label="Education"
            value={[
              stringFrom(prof, "educationDegree"),
              stringFrom(prof, "educationYear"),
            ]
              .filter(Boolean)
              .join(" • ")}
          />
          <DetailRow
            label="Diseases / conditions"
            value={
              Array.isArray(prof.diseases)
                ? (prof.diseases as unknown[])
                    .filter((d): d is string => typeof d === "string")
                    .join(", ")
                : ""
            }
          />
          <ExperienceListView
            label="Experience"
            items={prof.experienceItems}
          />
          <ExperienceListView
            label="Affiliations"
            items={prof.affiliationItems}
          />
        </div>
      ) : null}
    </li>
  );
}

function StatusBadge({
  status,
  hasSubmitted,
}: {
  status: AdminVerificationStatus;
  hasSubmitted: boolean;
}) {
  if (status === "verified")
    return (
<<<<<<< HEAD
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[0.625rem] leading-none font-medium uppercase tracking-wide text-emerald-800">
=======
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-800">
>>>>>>> dd2ad00 (Implement doctor verification feature with admin page and related components. Update TypeScript configuration to exclude test files. Add new pages for doctor verifications and verification management, including UI for approving and rejecting verifications. Enhance dashboard navigation to include doctor verification links.)
        Verified
      </span>
    );
  if (status === "rejected")
    return (
<<<<<<< HEAD
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[0.625rem] leading-none font-medium uppercase tracking-wide text-rose-800">
=======
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-rose-800">
>>>>>>> dd2ad00 (Implement doctor verification feature with admin page and related components. Update TypeScript configuration to exclude test files. Add new pages for doctor verifications and verification management, including UI for approving and rejecting verifications. Enhance dashboard navigation to include doctor verification links.)
        Rejected
      </span>
    );
  return (
    <span
      className={cn(
<<<<<<< HEAD
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.625rem] leading-none font-medium uppercase tracking-wide",
=======
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
>>>>>>> dd2ad00 (Implement doctor verification feature with admin page and related components. Update TypeScript configuration to exclude test files. Add new pages for doctor verifications and verification management, including UI for approving and rejecting verifications. Enhance dashboard navigation to include doctor verification links.)
        hasSubmitted
          ? "bg-amber-100 text-amber-800"
          : "bg-muted text-muted-foreground",
      )}
    >
      {hasSubmitted ? "Awaiting review" : "Drafting"}
    </span>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 text-foreground">{children}</dd>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value || value.trim() === "") return null;
  return (
    <div>
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}:{" "}
      </span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}

function ExperienceListView({
  label,
  items,
}: {
  label: string;
  items: unknown;
}) {
  if (!Array.isArray(items) || items.length === 0) return null;
  const cleaned = items
    .map((it) => {
      if (!it || typeof it !== "object") return null;
      const t = (it as Record<string, unknown>).title;
      const s = (it as Record<string, unknown>).subtitle;
      if (typeof t !== "string" && typeof s !== "string") return null;
      return {
        title: typeof t === "string" ? t : "",
        subtitle: typeof s === "string" ? s : "",
      };
    })
    .filter((x): x is { title: string; subtitle: string } => x !== null);
  if (cleaned.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-foreground">
        {cleaned.map((it, i) => (
          <li key={i}>
            {it.title}
            {it.subtitle ? (
              <span className="text-muted-foreground"> — {it.subtitle}</span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function stringFrom(
  o: Record<string, unknown>,
  key: string,
): string | null {
  const v = o[key];
  return typeof v === "string" && v.trim() !== "" ? v : null;
}

function numberFrom(
  o: Record<string, unknown>,
  key: string,
): number | null {
  const v = o[key];
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function formatIsoLocal(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
}
