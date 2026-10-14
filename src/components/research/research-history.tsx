"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Clock, LoaderCircle, RefreshCw, XCircle } from "lucide-react";
import { AuthModal } from "@/components/auth-modal";
import { Button } from "@/components/ui/button";
import { fetchResearchHistory, isSelfHostedApp, ResearchApiError } from "@/lib/research/client";
import type { ResearchStatus, ResearchSummary } from "@/lib/research/task";
import { useAuthStore } from "@/lib/stores/use-auth-store";
import { getPlatformName } from "@/lib/tools/market-url-parser";
import { cn } from "@/lib/utils";

const REFRESH_MS = 15_000;

/** "glass" sits on the dark video backdrop; "plain" follows the app theme (menus, dropdowns). */
type Appearance = "glass" | "plain";

const STATUS: Record<
  ResearchStatus,
  { label: string; icon: typeof Clock; glass: string; plain: string; spin?: boolean }
> = {
  queued: { label: "Queued", icon: Clock, glass: "text-white/60 bg-white/10", plain: "text-muted-foreground bg-muted" },
  running: {
    label: "Researching",
    icon: LoaderCircle,
    glass: "text-sky-200 bg-sky-500/20",
    plain: "text-sky-700 bg-sky-100 dark:text-sky-300 dark:bg-sky-900/40",
    spin: true,
  },
  awaiting_input: {
    label: "Needs input",
    icon: Clock,
    glass: "text-amber-200 bg-amber-500/20",
    plain: "text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-900/40",
  },
  paused: {
    label: "Paused",
    icon: Clock,
    glass: "text-amber-200 bg-amber-500/20",
    plain: "text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-900/40",
  },
  completed: {
    label: "Complete",
    icon: CheckCircle2,
    glass: "text-emerald-200 bg-emerald-500/20",
    plain: "text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-900/40",
  },
  failed: {
    label: "Failed",
    icon: AlertCircle,
    glass: "text-rose-200 bg-rose-500/20",
    plain: "text-rose-700 bg-rose-100 dark:text-rose-300 dark:bg-rose-900/40",
  },
  cancelled: { label: "Cancelled", icon: XCircle, glass: "text-white/60 bg-white/10", plain: "text-muted-foreground bg-muted" },
  unknown: { label: "Unknown", icon: Clock, glass: "text-white/60 bg-white/10", plain: "text-muted-foreground bg-muted" },
};

function formatDate(value?: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: sameYear ? undefined : "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function PlatformMark({ platform, appearance }: { platform?: "polymarket" | "kalshi"; appearance: Appearance }) {
  const src = platform ? `/logos/${platform}.png` : null;
  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full",
        appearance === "glass" ? "bg-white/10" : "bg-muted"
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={platform ? getPlatformName(platform) : ""} className="size-4 rounded-sm" />
      ) : (
        <span className="size-2 rounded-full bg-current opacity-40" aria-hidden="true" />
      )}
    </span>
  );
}

export function ResearchHistoryList({
  limit,
  compact = false,
  appearance = "glass",
}: {
  limit?: number;
  compact?: boolean;
  appearance?: Appearance;
}) {
  const [tasks, setTasks] = useState<ResearchSummary[] | null>(null);
  const [error, setError] = useState<ResearchApiError | Error | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const initialized = useAuthStore((state) => state.initialized);
  const signedOut = !isSelfHostedApp && initialized && !user;
  const glass = appearance === "glass";
  const muted = glass ? "text-white/55" : "text-muted-foreground";
  const panel = glass
    ? "rounded-2xl border border-white/20 bg-black/45 text-white shadow-xl backdrop-blur-md"
    : "rounded-xl border border-border bg-muted/40 text-foreground";

  useEffect(() => {
    if (signedOut) {
      setTasks([]);
      return;
    }
    let cancelled = false;
    let timer: number | undefined;
    const load = async () => {
      try {
        const next = await fetchResearchHistory();
        if (cancelled) return;
        setTasks(next);
        setError(null);
        if (next.some((task) => task.status === "queued" || task.status === "running")) {
          timer = window.setTimeout(load, REFRESH_MS);
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error("Could not load history."));
        setTasks((current) => current ?? []);
      } finally {
        if (!cancelled) setRefreshing(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [signedOut, user?.id, refreshing]);

  if (signedOut) {
    return (
      <div className={cn(panel, "p-6 text-center")}>
        <p className={cn("text-sm", muted)}>Sign in with Valyu to see your forecasts.</p>
        <Button onClick={() => setAuthOpen(true)} className="mt-4 bg-white text-black hover:bg-white/90">
          Sign in with Valyu
        </Button>
        <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
      </div>
    );
  }

  if (tasks === null) {
    return (
      <div className="grid gap-2" aria-busy="true">
        {Array.from({ length: compact ? 3 : 5 }, (_, i) => (
          <div key={i} className={cn("animate-pulse rounded-xl", compact ? "h-12" : "h-16", glass ? "bg-white/10" : "bg-muted")} />
        ))}
      </div>
    );
  }

  const visible = limit ? tasks.slice(0, limit) : tasks;

  return (
    <div>
      {error && (
        <p className={cn("mb-3 flex items-center gap-2 text-sm", glass ? "text-rose-200" : "text-rose-600 dark:text-rose-300")}>
          <AlertCircle className="size-4" aria-hidden="true" />
          {error.message}
        </p>
      )}
      {visible.length === 0 ? (
        <div className={cn(panel, "p-6 text-center text-sm", muted)}>
          No forecasts yet. Paste a Polymarket or Kalshi URL to start one.
        </div>
      ) : (
        <ul className={cn("grid", compact ? "gap-1.5" : "gap-2")}>
          {visible.map((task) => {
            const status = STATUS[task.status] || STATUS.unknown;
            const Icon = status.icon;
            return (
              <li key={task.id}>
                <Link
                  href={`/research/${task.id}`}
                  className={cn(
                    "flex items-center gap-3 transition-colors",
                    glass
                      ? "rounded-xl border border-white/15 bg-black/45 text-white shadow-lg backdrop-blur-md hover:bg-white/10"
                      : "rounded-lg text-foreground hover:bg-accent",
                    compact ? "p-2.5" : "p-3.5"
                  )}
                >
                  <PlatformMark platform={task.market.platform} appearance={appearance} />
                  <span className="min-w-0 flex-1">
                    <span className={cn("block font-medium leading-snug", compact ? "line-clamp-1 text-sm" : "line-clamp-2 text-[15px]")}>
                      {task.title}
                    </span>
                    <span className={cn("mt-0.5 block text-xs", muted)}>
                      {formatDate(task.createdAt)}
                      {task.market.platform ? ` · ${getPlatformName(task.market.platform)}` : ""}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium",
                      glass ? status.glass : status.plain
                    )}
                  >
                    <Icon className={cn("size-3", status.spin && "animate-spin")} aria-hidden="true" />
                    {status.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      {!compact && (
        <button
          type="button"
          onClick={() => setRefreshing(true)}
          disabled={refreshing}
          className={cn("mt-4 flex items-center gap-1.5 text-xs disabled:opacity-50", muted, glass ? "hover:text-white" : "hover:text-foreground")}
        >
          <RefreshCw className={cn("size-3.5", refreshing && "animate-spin")} aria-hidden="true" />
          Refresh
        </button>
      )}
    </div>
  );
}
