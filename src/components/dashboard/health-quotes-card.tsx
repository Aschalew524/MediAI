"use client";

import { useCallback, useEffect, useState } from "react";

import { Heart, Quote, Sparkles } from "lucide-react";

import {
  HEALTH_MOTIVATION_QUOTES,
  HEALTH_QUOTE_ROTATE_MS,
  type HealthQuote,
} from "@/lib/health-quotes";
import { cn } from "@/lib/utils";

import { DashboardPanel } from "./primitives";

const FADE_MS = 650;

function pickRandomIndex(exclude: number, total: number): number {
  if (total <= 1) return 0;
  let next = exclude;
  while (next === exclude) {
    next = Math.floor(Math.random() * total);
  }
  return next;
}

export function HealthQuotesCard({ className }: { className?: string }) {
  const total = HEALTH_MOTIVATION_QUOTES.length;
  const [index, setIndex] = useState(() =>
    Math.floor(Math.random() * HEALTH_MOTIVATION_QUOTES.length),
  );
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(0);

  const quote: HealthQuote = HEALTH_MOTIVATION_QUOTES[index] ?? HEALTH_MOTIVATION_QUOTES[0]!;

  const advance = useCallback(() => {
    setVisible(false);
    window.setTimeout(() => {
      setIndex((current) => pickRandomIndex(current, total));
      setProgress(0);
      setVisible(true);
    }, FADE_MS);
  }, [total]);

  useEffect(() => {
    const started = Date.now();
    const tick = window.setInterval(() => {
      const elapsed = Date.now() - started;
      setProgress(Math.min(100, (elapsed / HEALTH_QUOTE_ROTATE_MS) * 100));
    }, 120);
    return () => window.clearInterval(tick);
  }, [index]);

  useEffect(() => {
    const timer = window.setInterval(advance, HEALTH_QUOTE_ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [advance]);

  return (
    <DashboardPanel
      className={cn(
        "relative overflow-hidden border-primary/15 px-5 py-5 sm:px-7 sm:py-6",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute -right-12 -top-12 size-40 rounded-full bg-primary/10 blur-2xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-16 left-1/4 size-48 rounded-full bg-emerald-400/10 blur-3xl"
        aria-hidden
      />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
        <div className="flex shrink-0 items-center gap-3">
          <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-linear-to-br from-primary/20 to-primary/5 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
            <Heart className="size-5" aria-hidden />
          </span>
          <div className="sm:hidden">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Daily inspiration
            </p>
            <p className="text-[11px] text-muted-foreground">Refreshes every few minutes</p>
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-4">
          <div className="hidden sm:block">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Daily inspiration
            </p>
            <p className="text-[11px] text-muted-foreground">
              A gentle reminder for your health journey
            </p>
          </div>

          <div className="relative min-h-[4.5rem] sm:min-h-[5rem]">
            <Quote
              className="absolute -left-1 -top-1 size-8 text-primary/15"
              aria-hidden
            />
            <blockquote
              className={cn(
                "pl-7 text-base font-medium leading-relaxed text-foreground transition-all duration-700 ease-out motion-reduce:transition-none sm:text-lg sm:leading-relaxed",
                visible
                  ? "translate-y-0 opacity-100 blur-0 motion-reduce:translate-y-0"
                  : "translate-y-2 opacity-0 blur-[2px] motion-reduce:opacity-100 motion-reduce:blur-0",
              )}
            >
              &ldquo;{quote.text}&rdquo;
            </blockquote>
            {quote.author ? (
              <p
                className={cn(
                  "mt-2 pl-7 text-sm text-muted-foreground transition-opacity duration-700",
                  visible ? "opacity-100" : "opacity-0",
                )}
              >
                — {quote.author}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <Sparkles className="size-3.5 text-primary/70" aria-hidden />
              <span>New quote in a few minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={advance}
                className="rounded-full border border-primary/15 bg-white/80 px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/8"
                aria-label="Show another quote"
              >
                Another quote
              </button>
            </div>
          </div>

          <div
            className="h-1 overflow-hidden rounded-full bg-primary/10"
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Time until next quote"
          >
            <div
              className="h-full rounded-full bg-linear-to-r from-primary/60 to-primary transition-[width] duration-150 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </DashboardPanel>
  );
}
