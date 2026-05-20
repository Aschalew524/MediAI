"use client";

import { useEffect, useRef } from "react";

import Link from "next/link";
import { Loader2, Sparkles, X } from "lucide-react";

import type { MyBillingResponse } from "@/lib/payments-api";
import { cn } from "@/lib/utils";

import { AssistantPaywallPanel } from "./assistant-paywall-panel";

type Props = {
  open: boolean;
  onClose: () => void;
  billing: MyBillingResponse | null;
  onStartTrial: () => void;
  onAccessActive?: () => void;
};

export function PersonalAccessSheet({
  open,
  onClose,
  billing,
  onStartTrial,
  onAccessActive,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || billing?.assistantAccess.active) {
    return null;
  }

  const trial = billing?.personalTrial;
  const trialRemaining = trial?.remaining ?? 0;
  const showTrialCta = Boolean(trial?.enabled && trialRemaining > 0);
  const showPayOnly = Boolean(trial?.exhausted);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="personal-access-sheet-title"
        className={cn(
          "relative z-10 w-full max-w-lg rounded-t-3xl border border-primary/15 bg-white shadow-[0_35px_120px_-50px_rgba(0,0,0,0.55)]",
          "max-h-[min(90vh,720px)] overflow-y-auto sm:rounded-3xl",
        )}
      >
        <div className="sticky top-0 z-10 flex justify-end border-b border-primary/10 bg-white/95 px-4 py-3 backdrop-blur-sm">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
            aria-label="Close dialog"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="px-6 pb-8 pt-2">
          {showTrialCta ? (
            <div className="space-y-6 text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                <Sparkles className="size-3.5" aria-hidden />
                Free trial
              </span>
              <div className="space-y-2">
                <h2
                  id="personal-access-sheet-title"
                  className="text-2xl font-semibold tracking-tight text-foreground"
                >
                  Try personalized AI Doctor
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  Uses your saved health profile for tailored answers. You have{" "}
                  <strong className="font-medium text-foreground">
                    {trialRemaining} of {trial?.limit ?? 3}
                  </strong>{" "}
                  free chats — no payment required to start.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onStartTrial();
                  onClose();
                }}
                className="flex h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Start free trial
              </button>
              <p className="text-xs text-muted-foreground">
                Or{" "}
                <Link
                  href="/pricing"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  view paid plans
                </Link>{" "}
                for unlimited access.
              </p>
              <Link
                href="/dashboard/ai-doctor/general"
                className="inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
                onClick={onClose}
              >
                Continue with General chat (free)
              </Link>
            </div>
          ) : null}

          {showPayOnly ? (
            <div className="space-y-4">
              <div className="text-center">
                <h2
                  id="personal-access-sheet-title"
                  className="text-2xl font-semibold tracking-tight text-foreground"
                >
                  You&apos;ve used your free chats
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Unlock unlimited personalized AI Doctor access with a secure Chapa
                  payment. General chat remains free.
                </p>
              </div>
              <AssistantPaywallPanel
                variant="compact"
                onAccessActive={() => {
                  onAccessActive?.();
                  onClose();
                }}
              />
              <p className="text-center text-xs text-muted-foreground">
                <Link
                  href="/dashboard/ai-doctor/general"
                  className="text-primary underline-offset-4 hover:underline"
                  onClick={onClose}
                >
                  Use General chat (free)
                </Link>
              </p>
            </div>
          ) : null}

          {!showTrialCta && !showPayOnly ? (
            <div className="py-6 text-center">
              <Loader2 className="mx-auto size-8 animate-spin text-primary" />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
