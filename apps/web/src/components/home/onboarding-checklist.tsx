import { useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Check, X } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/auth/auth-context";
import { Card, CardBody } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Step = {
  id: string;
  title: string;
  description: string;
  to: string;
  autoComplete?: boolean;
};

export function OnboardingChecklist() {
  const qc = useQueryClient();
  const { me } = useAuth();

  const completed = useMemo(
    () => new Set(me?.profile.onboardingSteps ?? []),
    [me?.profile.onboardingSteps],
  );

  const employee = me?.employee ?? null;

  const steps = useMemo<Step[]>(() => {
    const profileFilled =
      !!employee?.bio && !!employee?.location && !!employee?.phone;
    const hasAvatar = !!employee?.avatarUrl;
    return [
      {
        id: "welcome",
        title: "Read the welcome update",
        description: "Get oriented with the latest from leadership.",
        to: "/company-updates",
      },
      {
        id: "profile",
        title: "Fill out your profile",
        description: "Add a bio, location, and phone so teammates can find you.",
        to: "/me",
        autoComplete: profileFilled,
      },
      {
        id: "avatar",
        title: "Add a profile photo",
        description: "Help everyone put a face to your name.",
        to: "/me",
        autoComplete: hasAvatar,
      },
      {
        id: "directory",
        title: "Meet the team",
        description: "Browse the employee directory.",
        to: "/directory",
      },
      {
        id: "events",
        title: "Check out upcoming events",
        description: "See what's on the company calendar.",
        to: "/company-updates",
      },
    ];
  }, [employee]);

  const effectiveDone = useMemo(() => {
    const done = new Set(completed);
    for (const s of steps) if (s.autoComplete) done.add(s.id);
    return done;
  }, [completed, steps]);

  const patch = useMutation({
    mutationFn: (input: {
      completedSteps?: string[];
      dismissed?: boolean;
    }) =>
      api("/api/v1/me/onboarding", {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["me"] }),
  });

  if (!me) return null;
  if (me.profile.onboardingDismissedAt) return null;

  const total = steps.length;
  const done = effectiveDone.size;
  if (done >= total) return null;

  const toggle = (id: string) => {
    const next = new Set(completed);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    patch.mutate({ completedSteps: Array.from(next) });
  };

  const dismiss = () => patch.mutate({ dismissed: true });

  return (
    <section className="mx-auto max-w-7xl px-6 py-8">
      <Card className="border-highlight-200 bg-gradient-to-br from-white to-highlight-50">
        <CardBody className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-highlight-700">
                Get started
              </p>
              <h2 className="mt-1 text-xl font-extrabold text-brand-900">
                Welcome to TadHealth 👋
              </h2>
              <p className="mt-1 text-sm text-brand-600">
                Knock out a few quick things so the portal feels like home.
              </p>
            </div>
            <button
              onClick={dismiss}
              title="Dismiss"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-brand-400 hover:bg-brand-50 hover:text-brand-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-brand-100">
              <div
                className="h-full rounded-full bg-highlight-500 transition-all"
                style={{ width: `${(done / total) * 100}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-brand-700">
              {done}/{total}
            </span>
          </div>

          <ul className="space-y-2">
            {steps.map((s) => {
              const isDone = effectiveDone.has(s.id);
              const isAuto = !!s.autoComplete;
              return (
                <li
                  key={s.id}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border border-brand-100 bg-white p-3",
                    isDone && "opacity-60",
                  )}
                >
                  <button
                    onClick={() => !isAuto && toggle(s.id)}
                    disabled={isAuto}
                    title={isAuto ? "Auto-completed" : "Mark complete"}
                    className={cn(
                      "grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition",
                      isDone
                        ? "border-highlight-500 bg-highlight-500 text-white"
                        : "border-brand-200 hover:border-highlight-400",
                      isAuto && "cursor-default",
                    )}
                  >
                    {isDone && <Check className="h-3.5 w-3.5" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-sm font-semibold text-brand-900",
                        isDone && "line-through",
                      )}
                    >
                      {s.title}
                    </p>
                    <p className="text-xs text-brand-500">{s.description}</p>
                  </div>
                  <Link
                    to={s.to}
                    className="shrink-0 rounded-lg border border-brand-200 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:border-highlight-400 hover:text-highlight-700"
                  >
                    {isDone ? "Revisit" : "Go"}
                  </Link>
                </li>
              );
            })}
          </ul>
        </CardBody>
      </Card>
    </section>
  );
}
