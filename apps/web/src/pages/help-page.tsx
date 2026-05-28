import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  BookOpen,
  Building2,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Eye,
  EyeOff,
  FileText,
  FolderOpen,
  Image as ImageIcon,
  LayoutDashboard,
  Lock,
  Mail,
  Megaphone,
  Newspaper,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  Users,
  Wrench,
} from "lucide-react";
import { useAuth } from "@/auth/auth-context";
import { cn } from "@/lib/utils";

// ── Help section wrapper ───────────────────────────────────────────────────

function HelpRow({
  eyebrow,
  title,
  children,
  demo,
  reverse = false,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
  demo: ReactNode;
  reverse?: boolean;
}) {
  return (
    <section className="grid gap-8 md:grid-cols-[1fr_1.1fr] md:items-center">
      <div className={reverse ? "md:order-2" : ""}>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-highlight-600">
          {eyebrow}
        </p>
        <h2 className="mt-2 text-xl font-bold tracking-tight text-brand-900 md:text-2xl">
          {title}
        </h2>
        <div className="mt-3 space-y-2 text-sm leading-relaxed text-brand-600">
          {children}
        </div>
      </div>
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border border-brand-100 bg-white p-6 shadow-soft",
          reverse && "md:order-1",
        )}
      >
        <span className="absolute right-4 top-3 text-[10px] font-bold uppercase tracking-widest text-brand-300">
          Preview
        </span>
        {demo}
      </div>
    </section>
  );
}

// ── Demo components ────────────────────────────────────────────────────────

function DemoSignIn() {
  return (
    <div className="overflow-hidden rounded-xl border border-brand-100">
      <div className="grid grid-cols-[1fr_1.2fr]">
        <div className="bg-brand-900 p-4 text-white">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-highlight-200">
            TadHealth
          </p>
          <p className="mt-3 text-xs font-bold leading-tight">
            Empowering those who care.
          </p>
        </div>
        <div className="space-y-2 bg-white p-3">
          <p className="text-[10px] font-semibold text-brand-900">Sign in</p>
          <div className="flex items-center gap-2 rounded-md border border-brand-100 px-2 py-1.5 text-[10px]">
            <span className="text-base">G</span>
            <span className="font-semibold text-brand-700">
              Continue with Google
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[9px] text-brand-400">
            <span className="h-px flex-1 bg-brand-100" />
            or with email
            <span className="h-px flex-1 bg-brand-100" />
          </div>
          <div className="space-y-1.5">
            <div className="rounded-md border border-brand-100 px-2 py-1 text-[10px] text-brand-500">
              you@tadhealth.com
            </div>
            <div className="rounded-md border border-brand-100 px-2 py-1 text-[10px] text-brand-500">
              ••••••••
            </div>
            <div className="rounded-md bg-brand-900 px-2 py-1 text-center text-[10px] font-semibold text-white">
              Sign in
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DemoTopbar() {
  const tabs = ["Home", "Departments", "Team Directory", "Surveys", "Help"];
  return (
    <div className="overflow-hidden rounded-xl border border-brand-100">
      <div className="flex items-center gap-3 border-b border-brand-100 bg-white px-4 py-3">
        <span className="h-6 w-20 rounded bg-brand-900/90" />
        <nav className="ml-2 flex flex-1 items-center gap-1 overflow-hidden">
          {tabs.map((t, i) => (
            <span
              key={t}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium",
                i === 0 ? "bg-brand-50 text-brand-900" : "text-brand-500",
              )}
            >
              {t}
            </span>
          ))}
        </nav>
        <span className="relative grid h-7 w-7 place-items-center rounded-lg text-brand-500">
          <Bell className="h-3.5 w-3.5" />
          <span className="absolute -right-1 -top-1 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-accent-500 px-1 text-[9px] font-bold text-white ring-2 ring-white animate-pulse">
            2
          </span>
        </span>
        <span className="grid h-7 w-7 place-items-center rounded-full bg-highlight-200 text-[11px] font-bold text-brand-900">
          MC
        </span>
      </div>
      <div className="h-12 bg-brand-mesh" />
    </div>
  );
}

function DemoDirectory() {
  const people = [
    { i: "BG", n: "Ben", r: "CEO & Founder", c: "bg-highlight-300" },
    { i: "CF", n: "Claire", r: "EA & Operations", c: "bg-accent-300" },
    { i: "ZK", n: "Zoltan", r: "CTO", c: "bg-brand-200" },
  ];
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-xl border border-brand-100 bg-brand-50/40 px-3 py-2">
        <Search className="h-3.5 w-3.5 text-brand-400" />
        <span className="text-xs text-brand-700">Search by name, title…</span>
      </div>
      <div className="flex gap-1.5">
        {["All", "Engineering", "CX", "Sales"].map((t, i) => (
          <span
            key={t}
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-semibold",
              i === 0
                ? "bg-brand-900 text-white"
                : "bg-white text-brand-600 ring-1 ring-inset ring-brand-100",
            )}
          >
            {t}
          </span>
        ))}
      </div>
      <ul className="space-y-2">
        {people.map((p) => (
          <li
            key={p.n}
            className="flex items-center gap-3 rounded-xl border border-brand-100 bg-white p-2.5"
          >
            <span
              className={cn(
                "grid h-7 w-7 place-items-center rounded-full text-[10px] font-bold text-brand-900",
                p.c,
              )}
            >
              {p.i}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-brand-900">{p.n}</p>
              <p className="text-[10px] text-brand-500">{p.r}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DemoOrgChart() {
  return (
    <div className="rounded-xl border border-brand-100 bg-white p-3">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-brand-500">
        Engineering & IT
      </p>
      <div className="grid grid-cols-3 gap-2">
        {["DB", "JF", "SI", "MS", "NL", "JS"].map((i, idx) => (
          <div
            key={i + idx}
            className="rounded-md border border-brand-100 bg-brand-50/40 px-1.5 py-1 text-center"
          >
            <span className="block text-[10px] font-bold text-brand-900">{i}</span>
            <span className="block text-[8px] text-brand-500">Engineer</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DemoDepartments() {
  const cards = [
    { name: "Engineering & IT", c: "bg-brand-100 text-brand-700" },
    { name: "Customer Experience", c: "bg-highlight-100 text-highlight-700" },
    { name: "Marketing", c: "bg-accent-100 text-accent-700" },
    { name: "Sales", c: "bg-brand-50 text-brand-700" },
  ];
  return (
    <div className="grid grid-cols-2 gap-2">
      {cards.map((c) => (
        <div key={c.name} className="rounded-xl border border-brand-100 bg-white p-3">
          <span
            className={cn(
              "grid h-7 w-7 place-items-center rounded-lg text-[12px]",
              c.c,
            )}
          >
            <Users className="h-3.5 w-3.5" />
          </span>
          <p className="mt-2 text-xs font-semibold text-brand-900">{c.name}</p>
          <p className="mt-0.5 text-[10px] text-brand-500">12 teammates</p>
        </div>
      ))}
    </div>
  );
}

function DemoDepartmentDetail() {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-500">
          Department Tools
        </p>
        <ul className="mt-1.5 overflow-hidden rounded-xl border border-brand-100 bg-white">
          {[
            { name: "Marketing Request Form", label: "Form" },
            { name: "Brand Assets", label: "Drive" },
          ].map((t) => (
            <li
              key={t.name}
              className="flex items-center gap-2 border-b border-brand-50 px-3 py-2 last:border-b-0"
            >
              <Wrench className="h-3 w-3 text-brand-400" />
              <span className="flex-1 truncate text-[11px] text-brand-900">
                {t.name}
              </span>
              <span className="rounded-md border border-brand-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-brand-700">
                {t.label}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-500">
          Key Documents
        </p>
        <ul className="mt-1.5 overflow-hidden rounded-xl border border-brand-100 bg-white">
          {[
            { n: "Employee Handbook", d: "—", l: "Doc" },
            { n: "Weekly Email — 5/14", d: "5/14/2026", l: "Link" },
          ].map((d) => (
            <li
              key={d.n}
              className="flex items-center gap-2 border-b border-brand-50 px-3 py-2 last:border-b-0"
            >
              <FileText className="h-3 w-3 text-brand-400" />
              <span className="flex-1 truncate text-[11px] text-brand-900">{d.n}</span>
              <span className="text-[9px] text-brand-500">{d.d}</span>
              <span className="rounded-md border border-brand-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-brand-700">
                {d.l}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function DemoUpdateTimeline() {
  return (
    <ol className="space-y-3 border-l-2 border-brand-100 pl-4">
      {[
        { date: "May 16, 2026", title: "Spring all-hands recap" },
        { date: "May 11, 2026", title: "Welcome to the Employee Portal 👋" },
      ].map((u, i) => (
        <li key={u.date} className="relative">
          <span
            aria-hidden
            className="absolute -left-[21px] top-1.5 grid h-3 w-3 place-items-center rounded-full bg-highlight-400 ring-2 ring-white"
          />
          <article className="rounded-xl border border-brand-100 bg-white p-3">
            <time className="text-[10px] font-semibold uppercase tracking-wider text-brand-500">
              {u.date}
            </time>
            <p className="mt-1 text-xs font-bold text-brand-900">{u.title}</p>
            {i === 0 && (
              <p className="mt-1 line-clamp-2 text-[11px] text-brand-600">
                Big quarter — here's what we shipped, what we're learning, and where we go next.
              </p>
            )}
            {i === 0 && (
              <p className="mt-2 text-[10px] font-semibold text-brand-900">
                Read more →
              </p>
            )}
          </article>
        </li>
      ))}
    </ol>
  );
}

function DemoUpdateDetail() {
  return (
    <div className="rounded-xl border border-brand-100 bg-white p-4">
      <p className="text-[9px] font-semibold uppercase tracking-widest text-highlight-600">
        Company Update
      </p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-brand-500">
        Saturday, May 16, 2026
      </p>
      <h3 className="mt-2 text-base font-extrabold tracking-tight text-brand-900">
        Spring all-hands recap
      </h3>
      <div className="mt-3 space-y-1.5 text-[11px] leading-relaxed text-brand-700">
        <p>Hey team — quick recap from yesterday's all-hands.</p>
        <p className="font-semibold text-brand-900">Wins this quarter</p>
        <ul className="list-disc space-y-0.5 pl-4">
          <li>New employee portal shipped</li>
          <li>+12 partner districts</li>
        </ul>
      </div>
    </div>
  );
}

function DemoEvent() {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-500">
        Upcoming Events
      </p>
      <div className="rounded-xl border border-brand-100 bg-white p-3">
        <p className="text-xs font-bold text-brand-900">May All-Company Town Hall</p>
        <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-highlight-700">
          <Calendar className="h-3 w-3" />
          Thu May 14, 1:00 PM
        </p>
        <p className="mt-0.5 text-[10px] text-brand-600">HQ Auditorium + Zoom</p>
        <p className="mt-2 text-[10px] text-brand-700">
          Strategy update, financial snapshot, departmental highlights, and an open Q&A.
        </p>
      </div>
    </div>
  );
}

function DemoSurvey() {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-brand-100 bg-white p-3">
        <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700">
          <EyeOff className="h-3 w-3" /> Anonymous
        </span>
        <p className="mt-2 text-xs font-semibold text-brand-900">
          How are you feeling this week?
        </p>
        <div className="mt-2 flex gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <span
              key={n}
              className={cn(
                "grid h-7 w-7 place-items-center rounded-md border text-[11px]",
                n <= 4
                  ? "border-accent-400 bg-accent-100 text-accent-700"
                  : "border-brand-100 text-brand-300",
              )}
              style={{
                animation: `pulseFade 2.4s ${n * 0.18}s ease-in-out infinite`,
              }}
            >
              <Star
                className={cn(
                  "h-3.5 w-3.5",
                  n <= 4 && "fill-current",
                )}
              />
            </span>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between rounded-xl border border-brand-100 bg-brand-50/40 p-3">
        <span className="text-[11px] text-brand-600">
          3 of 5 questions answered
        </span>
        <span className="rounded-md bg-brand-900 px-3 py-1 text-[10px] font-semibold text-white">
          Submit
        </span>
      </div>
    </div>
  );
}

function DemoQuestionTypes() {
  return (
    <div className="space-y-2">
      {[
        { label: "Short text", body: <span className="text-[10px] text-brand-400">Single line input</span> },
        {
          label: "Long text",
          body: (
            <div className="h-6 rounded border border-brand-100 bg-brand-50/40" />
          ),
        },
        {
          label: "Single choice",
          body: (
            <div className="flex gap-1">
              {["Yes", "Mostly", "Not yet"].map((o, i) => (
                <span
                  key={o}
                  className={cn(
                    "rounded-md border px-1.5 py-0.5 text-[9px]",
                    i === 1
                      ? "border-highlight-400 bg-highlight-50 text-highlight-700"
                      : "border-brand-100 text-brand-500",
                  )}
                >
                  {o}
                </span>
              ))}
            </div>
          ),
        },
        {
          label: "Multi-choice",
          body: (
            <div className="flex flex-wrap gap-1">
              {["Tools", "Time", "Mentoring"].map((o, i) => (
                <span
                  key={o}
                  className={cn(
                    "rounded-md border px-1.5 py-0.5 text-[9px]",
                    i < 2
                      ? "border-highlight-400 bg-highlight-50 text-highlight-700"
                      : "border-brand-100 text-brand-500",
                  )}
                >
                  ☑ {o}
                </span>
              ))}
            </div>
          ),
        },
        {
          label: "Rating",
          body: (
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  className={cn(
                    "h-3 w-3",
                    n <= 4
                      ? "fill-accent-400 text-accent-400"
                      : "text-brand-200",
                  )}
                />
              ))}
            </div>
          ),
        },
      ].map((q) => (
        <div
          key={q.label}
          className="flex items-center gap-3 rounded-xl border border-brand-100 bg-white px-3 py-2"
        >
          <span className="w-20 text-[10px] font-semibold text-brand-700">
            {q.label}
          </span>
          <span className="flex-1">{q.body}</span>
        </div>
      ))}
    </div>
  );
}

function DemoSurveyResults() {
  const bars = [
    { o: "Workload", c: 6, p: 50 },
    { o: "Process", c: 4, p: 33 },
    { o: "Communication", c: 2, p: 17 },
  ];
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-brand-100 bg-white p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-500">
          Single choice
        </p>
        <p className="text-xs font-semibold text-brand-900">
          Which area needs attention?
        </p>
        <div className="mt-2 space-y-1">
          {bars.map((b) => (
            <div key={b.o}>
              <div className="flex items-baseline justify-between text-[10px]">
                <span className="text-brand-800">{b.o}</span>
                <span className="text-brand-600">
                  {b.c} · {b.p}%
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-brand-50">
                <div
                  className="h-full bg-highlight-400"
                  style={{ width: `${b.p}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-brand-100 bg-white p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-500">
          Rating
        </p>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-brand-900">3.9</span>
          <span className="text-[10px] text-brand-500">avg of 12</span>
        </div>
      </div>
    </div>
  );
}

function DemoNotifications() {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between rounded-t-xl border border-brand-100 bg-white px-3 py-2">
        <p className="text-xs font-semibold text-brand-900">Notifications</p>
        <span className="text-[10px] font-semibold text-brand-700">
          Mark all read
        </span>
      </div>
      {[
        {
          title: "New company update",
          body: "Spring all-hands recap",
          unread: true,
          Icon: Megaphone,
          tone: "bg-highlight-400 text-brand-950",
        },
        {
          title: "New survey",
          body: "Spring Pulse Check",
          unread: true,
          Icon: ClipboardList,
          tone: "bg-highlight-400 text-brand-950",
        },
        {
          title: "New event scheduled",
          body: "Engineering Demo Day",
          unread: false,
          Icon: Sparkles,
          tone: "bg-brand-50 text-brand-600",
        },
      ].map((n) => (
        <div
          key={n.title}
          className={cn(
            "flex items-start gap-2 rounded-xl border border-brand-100 px-3 py-2",
            n.unread ? "bg-highlight-50/60" : "bg-white",
          )}
        >
          <span
            className={cn(
              "mt-0.5 grid h-7 w-7 place-items-center rounded-lg",
              n.tone,
            )}
          >
            <n.Icon className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-semibold text-brand-900">
              {n.title}
            </p>
            <p className="truncate text-[10px] text-brand-600">{n.body}</p>
          </div>
          {n.unread && (
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-500" />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Admin demos ────────────────────────────────────────────────────────────

function DemoAdminOverview() {
  const stats = [
    { label: "Active employees", value: 46 },
    { label: "Departments", value: 9 },
    { label: "Open surveys", value: 5 },
  ];
  return (
    <div className="grid grid-cols-3 gap-2">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-xl border border-brand-100 bg-white p-3"
        >
          <p className="text-[9px] font-semibold uppercase tracking-wider text-brand-500">
            {s.label}
          </p>
          <p className="mt-1 text-xl font-bold text-brand-900">{s.value}</p>
        </div>
      ))}
    </div>
  );
}

function DemoAdminEmployees() {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-brand-600">46 employees</span>
        <span className="inline-flex items-center gap-1 rounded-lg bg-brand-900 px-2.5 py-1 text-[10px] font-semibold text-white">
          <Plus className="h-3 w-3" /> New employee
        </span>
      </div>
      {[
        { i: "MC", n: "Miguel Coria", t: "Software Engineer", d: "Engineering" },
        { i: "BG", n: "Ben", t: "CEO & Founder", d: "Executive" },
      ].map((e) => (
        <div
          key={e.n}
          className="flex items-center gap-3 rounded-xl border border-brand-100 bg-white px-3 py-2"
        >
          <span className="grid h-7 w-7 place-items-center rounded-full bg-highlight-200 text-[10px] font-bold text-brand-900">
            {e.i}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-brand-900">{e.n}</p>
            <p className="text-[10px] text-brand-500">{e.t}</p>
          </div>
          <span className="rounded-full bg-highlight-100 px-2 py-0.5 text-[9px] font-semibold text-highlight-700">
            {e.d}
          </span>
          <Pencil className="h-3 w-3 text-brand-400" />
          <Trash2 className="h-3 w-3 text-red-400" />
        </div>
      ))}
    </div>
  );
}

function DemoAdminPrivateDept() {
  return (
    <div className="rounded-xl border border-brand-100 bg-white p-3">
      <div className="flex items-center gap-2">
        <p className="text-xs font-semibold text-brand-900">Policy & TA</p>
        <span className="inline-flex items-center gap-1 rounded-full bg-accent-100 px-1.5 py-0.5 text-[9px] font-semibold text-accent-700">
          <Lock className="h-2.5 w-2.5" /> Private
        </span>
      </div>
      <p className="mt-1 text-[10px] text-brand-500">
        Only members + admins see this department.
      </p>
      <div className="mt-2 flex items-center gap-2">
        <input
          type="checkbox"
          checked
          readOnly
          className="h-3 w-3 accent-highlight-500"
        />
        <span className="text-[10px] font-semibold text-brand-700">
          Private — members only
        </span>
      </div>
    </div>
  );
}

function DemoAdminResources() {
  return (
    <div className="space-y-3">
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-500">
            Tools
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-brand-900 px-1.5 py-0.5 text-[9px] font-semibold text-white">
            <Plus className="h-2.5 w-2.5" /> Add
          </span>
        </div>
        <div className="space-y-1">
          {[
            { n: "Marketing Request Form", l: "Form" },
            { n: "Brand Assets", l: "Drive" },
          ].map((r) => (
            <div
              key={r.n}
              className="flex items-center gap-2 rounded-xl border border-brand-100 bg-white px-3 py-1.5"
            >
              <Wrench className="h-3 w-3 text-brand-400" />
              <span className="flex-1 truncate text-[11px] text-brand-900">
                {r.n}
              </span>
              <span className="rounded-md border border-brand-100 px-1.5 py-0.5 text-[9px] font-semibold text-brand-700">
                {r.l}
              </span>
              <Pencil className="h-3 w-3 text-brand-400" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DemoAdminEditor() {
  return (
    <div className="rounded-xl border border-brand-100 bg-white">
      <div className="flex items-center gap-1 border-b border-brand-100 bg-brand-50/40 px-2 py-1.5">
        {["B", "I", "H", "•", "1.", "🔗"].map((b, i) => (
          <span
            key={i}
            className="grid h-6 w-6 place-items-center rounded text-[10px] font-bold text-brand-600"
          >
            {b}
          </span>
        ))}
        <ImageIcon className="h-3 w-3 text-brand-600" />
        <div className="ml-auto inline-flex rounded-md border border-brand-100 bg-white p-0.5 text-[10px] font-semibold">
          <span className="rounded bg-white px-2 py-0.5 text-brand-900 shadow-sm">
            Edit
          </span>
          <span className="px-2 py-0.5 text-brand-400">Preview</span>
        </div>
      </div>
      <div className="space-y-1.5 p-3">
        <p className="text-xs font-bold text-brand-900">
          Welcome to the portal 👋
        </p>
        <p className="text-[11px] text-brand-700">
          Thrilled to flip the switch on something we've been quietly building…
        </p>
        <span className="inline-flex items-center gap-1 rounded-md border border-brand-100 px-2 py-0.5 text-[9px] font-semibold text-brand-600">
          <ImageIcon className="h-2.5 w-2.5" /> banner.png
        </span>
      </div>
    </div>
  );
}

function DemoAdminEvent() {
  return (
    <div className="space-y-2 rounded-xl border border-brand-100 bg-white p-3">
      <p className="text-xs font-semibold text-brand-900">New event</p>
      <input
        readOnly
        value="Engineering Demo Day"
        className="w-full rounded-md border border-brand-100 bg-brand-50/40 px-2 py-1 text-[11px] text-brand-900"
      />
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-md border border-brand-100 bg-brand-50/40 px-2 py-1 text-[10px]">
          <span className="block text-[8px] font-semibold uppercase tracking-wider text-brand-500">
            Starts
          </span>
          <span className="text-brand-900">May 12, 1:00 PM</span>
        </div>
        <div className="rounded-md border border-brand-100 bg-brand-50/40 px-2 py-1 text-[10px]">
          <span className="block text-[8px] font-semibold uppercase tracking-wider text-brand-500">
            Ends
          </span>
          <span className="text-brand-900">2:30 PM</span>
        </div>
      </div>
      <div className="rounded-md border border-brand-100 bg-brand-50/40 px-2 py-1 text-[10px]">
        <span className="block text-[8px] font-semibold uppercase tracking-wider text-brand-500">
          Location
        </span>
        <span className="text-brand-900">HQ Conference Room A + Zoom</span>
      </div>
    </div>
  );
}

function DemoAdminSurveyBuilder() {
  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-brand-100 bg-white p-3">
        <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[9px] font-semibold text-brand-700">
          Q1 · Single choice
        </span>
        <p className="mt-1.5 text-[11px] font-semibold text-brand-900">
          Are you on track for your Q2 OKRs?
        </p>
        <div className="mt-1.5 space-y-1">
          {["Ahead", "On track", "Slightly behind", "Significantly behind"].map(
            (o) => (
              <div
                key={o}
                className="flex items-center gap-1.5 rounded-md border border-brand-100 px-2 py-0.5"
              >
                <span className="h-2 w-2 rounded-full border border-brand-200" />
                <span className="text-[10px] text-brand-700">{o}</span>
              </div>
            ),
          )}
        </div>
      </div>
      <span className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-1 text-[10px] font-semibold text-brand-700">
        <Plus className="h-3 w-3" /> Add question
      </span>
    </div>
  );
}

function DemoAdminAudience() {
  const depts = [
    "Engineering",
    "Customer Experience",
    "Sales",
    "Marketing",
    "Operations",
  ];
  return (
    <div className="rounded-xl border border-brand-100 bg-white p-3">
      <div className="flex items-baseline justify-between">
        <span className="text-[10px] font-semibold text-brand-700">Audience</span>
        <span className="text-[9px] text-brand-500">2 departments</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {depts.map((d, i) => (
          <span
            key={d}
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset",
              i < 2
                ? "bg-brand-900 text-white ring-brand-900"
                : "bg-white text-brand-600 ring-brand-100",
            )}
          >
            {d}
          </span>
        ))}
      </div>
      <p className="mt-2 text-[10px] text-brand-500">
        Empty = everyone. Otherwise, only matching teams see the survey.
      </p>
    </div>
  );
}

function DemoAdminSurveyToggles() {
  return (
    <div className="space-y-2">
      {[
        { label: "Published", hint: "Visible to employees", on: true },
        { label: "Anonymous", hint: "Strip responder identity", on: true },
        { label: "Show results to all", hint: "Otherwise admin-only", on: false },
      ].map((t) => (
        <div
          key={t.label}
          className="flex items-center justify-between rounded-xl border border-brand-100 bg-white px-3 py-2"
        >
          <div>
            <p className="text-[11px] font-semibold text-brand-900">{t.label}</p>
            <p className="text-[10px] text-brand-500">{t.hint}</p>
          </div>
          <span
            className={cn(
              "grid h-4 w-7 items-center rounded-full px-0.5",
              t.on
                ? "justify-end bg-highlight-400"
                : "justify-start bg-brand-100",
            )}
          >
            <span className="h-3 w-3 rounded-full bg-white" />
          </span>
        </div>
      ))}
    </div>
  );
}

function DemoNotifyMatrix() {
  return (
    <ul className="space-y-2 text-[11px]">
      {[
        { e: "New update published", a: "Everyone (excluding author)" },
        { e: "New event scheduled", a: "Everyone" },
        { e: "Resource added", a: "Department members" },
        { e: "Survey published", a: "Target departments or everyone" },
        { e: "Survey response submitted", a: "Admins only" },
      ].map((r) => (
        <li
          key={r.e}
          className="flex items-center justify-between gap-3 rounded-xl border border-brand-100 bg-white px-3 py-2"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3 w-3 text-highlight-500" />
            <span className="text-brand-900">{r.e}</span>
          </div>
          <span className="text-brand-500">{r.a}</span>
        </li>
      ))}
    </ul>
  );
}

// ── Section content ────────────────────────────────────────────────────────

function StartContent() {
  return (
    <div className="space-y-12">
      <HelpRow
        eyebrow="Sign in"
        title="Get into the portal"
        demo={<DemoSignIn />}
      >
        <p>
          You can sign in with <strong>email + password</strong> or <strong>Continue with Google</strong> using your TadHealth account. Use the email Claire onboarded you with.
        </p>
        <p>
          First time signing up, you'll get a confirmation email. Click the link and you're in.
        </p>
      </HelpRow>

      <HelpRow
        eyebrow="Navigating"
        title="Find your way around"
        demo={<DemoTopbar />}
        reverse
      >
        <p>
          The top nav is always one click from anything important — <strong>Home</strong>, <strong>Departments</strong>, <strong>Team Directory</strong>, <strong>Surveys</strong>, and this <strong>Help</strong> page.
        </p>
        <p>
          Your avatar lives on the right. The <strong>bell</strong> next to it pulses with an unread count whenever something new lands.
        </p>
      </HelpRow>
    </div>
  );
}

function PeopleContent() {
  return (
    <div className="space-y-12">
      <HelpRow
        eyebrow="Directory"
        title="Look up a teammate"
        demo={<DemoDirectory />}
      >
        <p>
          Open <strong>Team Directory</strong> and start typing — search by name, email, title, or department.
        </p>
        <p>
          Use the chips below the search bar to filter by department.
        </p>
      </HelpRow>

      <HelpRow
        eyebrow="Org view"
        title="See teams at a glance"
        demo={<DemoOrgChart />}
        reverse
      >
        <p>
          Toggle <strong>Org Chart</strong> in the top-right of the directory to group everyone by department. Faster than scanning a list when you're trying to understand who does what.
        </p>
      </HelpRow>

      <HelpRow
        eyebrow="Departments"
        title="Browse teams"
        demo={<DemoDepartments />}
      >
        <p>
          The <strong>Departments</strong> tab shows every team you have access to.
        </p>
        <p>
          Private departments are hidden unless you're on them or an admin.
        </p>
      </HelpRow>

      <HelpRow
        eyebrow="Department detail"
        title="Tools + Key Documents"
        demo={<DemoDepartmentDetail />}
        reverse
      >
        <p>
          Click any department to see its roster, <strong>Tools</strong> (quick links the team uses every day), and <strong>Key Documents</strong> (handbooks, weekly emails, policies).
        </p>
        <p>
          Each row has a small chip showing whether it's a <strong>Link</strong>, <strong>PDF</strong>, <strong>Doc</strong>, or <strong>Drive</strong> folder.
        </p>
      </HelpRow>
    </div>
  );
}

function UpdatesContent() {
  return (
    <div className="space-y-12">
      <HelpRow
        eyebrow="Timeline"
        title="What's happening"
        demo={<DemoUpdateTimeline />}
      >
        <p>
          The <strong>Updates & Events</strong> page has a timeline of recent company updates. Each card shows a short excerpt — click <strong>Read more</strong> for the full post.
        </p>
        <p>
          You'll get a real-time notification the moment a new update is published.
        </p>
      </HelpRow>

      <HelpRow
        eyebrow="Update detail"
        title="Long-form posts"
        demo={<DemoUpdateDetail />}
        reverse
      >
        <p>
          Each update has its own page with rich formatting — headings, bullet lists, links, embedded images. Shareable URL too.
        </p>
      </HelpRow>

      <HelpRow
        eyebrow="Events"
        title="Town halls, demos, gatherings"
        demo={<DemoEvent />}
      >
        <p>
          Upcoming events live at the top of the same page. Each shows start + end time, location, and a Zoom link if it's virtual.
        </p>
      </HelpRow>
    </div>
  );
}

function SurveysContent() {
  return (
    <div className="space-y-12">
      <HelpRow
        eyebrow="Taking a survey"
        title="Share your voice"
        demo={<DemoSurvey />}
      >
        <p>
          The <strong>Surveys</strong> tab lists everything open to you. Some are quick pulse checks, some are deeper.
        </p>
        <p>
          When a survey is marked <strong>Anonymous</strong>, your identity is stripped server-side — even backend logs can't tie a response back to you.
        </p>
        <p>
          Some surveys are department-specific — you'll only see the ones meant for your team.
        </p>
      </HelpRow>

      <HelpRow
        eyebrow="Question types"
        title="Five ways to answer"
        demo={<DemoQuestionTypes />}
        reverse
      >
        <p>
          Surveys can mix five question types: <strong>short text</strong>, <strong>long text</strong>, <strong>single choice</strong>, <strong>multi-choice</strong>, and <strong>1–5 star rating</strong>.
        </p>
      </HelpRow>

      <HelpRow
        eyebrow="Results"
        title="See the room"
        demo={<DemoSurveyResults />}
      >
        <p>
          When a survey has <strong>Show results to all</strong> turned on, anyone in the audience can view aggregated answers — bar charts for choices, average + distribution for ratings, listed text for open-ended questions.
        </p>
      </HelpRow>
    </div>
  );
}

function NotificationsContent() {
  return (
    <div className="space-y-12">
      <HelpRow
        eyebrow="The bell"
        title="Stay in the loop"
        demo={<DemoNotifications />}
      >
        <p>
          Click the bell in the top-right to see what's new — updates, events, new department resources, and surveys.
        </p>
        <p>
          Unread ones have a dot. Click any notification to jump straight to it; it'll mark as read automatically.
        </p>
        <p>
          Notifications stream in real time — no refresh needed.
        </p>
      </HelpRow>
    </div>
  );
}

// ── Admin sub-sections ─────────────────────────────────────────────────────

function AdminOverviewContent() {
  return (
    <HelpRow
      eyebrow="Dashboard"
      title="At-a-glance counts"
      demo={<DemoAdminOverview />}
    >
      <p>
        The <strong>Overview</strong> tab in the admin sidebar gives quick counts of active employees, total directory entries, and departments. Useful when you just want to confirm something's seeded right.
      </p>
    </HelpRow>
  );
}

function AdminEmployeesContent() {
  return (
    <HelpRow
      eyebrow="Employees"
      title="Add, edit, deactivate"
      demo={<DemoAdminEmployees />}
    >
      <p>
        Full CRUD over the directory. Add someone when they join, edit when titles change, deactivate when they leave.
      </p>
      <p>
        If the new employee's email matches an existing auth user, their portal profile <strong>auto-links</strong> on next sign-in.
      </p>
    </HelpRow>
  );
}

function AdminDepartmentsContent() {
  return (
    <div className="space-y-12">
      <HelpRow
        eyebrow="Privacy"
        title="Hide a team from the company"
        demo={<DemoAdminPrivateDept />}
      >
        <p>
          Flip <strong>Private — members only</strong> in the edit modal to make a department invisible to non-members.
        </p>
        <p>
          Surveys and resources scoped to that department follow the same rule.
        </p>
      </HelpRow>

      <HelpRow
        eyebrow="Resources"
        title="Tools + Documents per team"
        demo={<DemoAdminResources />}
        reverse
      >
        <p>
          Click the <strong>folder icon</strong> next to any department in the admin list to manage its <strong>Tools</strong> (quick links) and <strong>Documents</strong> (PDFs, Google Docs, weekly emails).
        </p>
        <p>
          Each entry takes a title, URL, label (Link / PDF / Drive / Form), and an optional category or date. Adding one auto-notifies the team.
        </p>
      </HelpRow>
    </div>
  );
}

function AdminUpdatesContent() {
  return (
    <HelpRow
      eyebrow="Updates"
      title="Write a company post"
      demo={<DemoAdminEditor />}
    >
      <p>
        Open <strong>Updates → New update</strong>. The editor supports bold, headings, bullet/numbered lists, links, blockquotes, and <strong>inline image upload</strong> straight to storage.
      </p>
      <p>
        Toggle the <strong>Preview</strong> tab to see exactly how it'll render before publishing. You can also schedule a future publish date.
      </p>
    </HelpRow>
  );
}

function AdminEventsContent() {
  return (
    <HelpRow
      eyebrow="Events"
      title="Town halls, demo days, AMAs"
      demo={<DemoAdminEvent />}
    >
      <p>
        Events take a title, rich description, <strong>start + end</strong> time, a location, and an optional URL (Zoom link, RSVP form, etc.).
      </p>
      <p>
        They show up in the "Upcoming Events" section on the Updates & Events page, sorted by start time, and disappear from there once the start has passed.
      </p>
    </HelpRow>
  );
}

function AdminSurveysContent() {
  return (
    <div className="space-y-12">
      <HelpRow
        eyebrow="Building"
        title="Compose questions"
        demo={<DemoAdminSurveyBuilder />}
      >
        <p>
          Add as many questions as you need. Each one can be any of the five types — short text, long text, single choice, multi-choice, rating.
        </p>
        <p>
          Mark questions as <strong>required</strong> to block submission without an answer.
        </p>
        <p className="text-brand-500">
          Note: once any response is collected, questions <em>lock</em> to protect data integrity. Plan ahead.
        </p>
      </HelpRow>

      <HelpRow
        eyebrow="Audience"
        title="Pick who sees it"
        demo={<DemoAdminAudience />}
        reverse
      >
        <p>
          Leave audience empty for everyone, or pick one or more departments to target — only employees on those teams will see the survey.
        </p>
        <p>
          Admins always see everything (so you can preview as Ben/Claire).
        </p>
      </HelpRow>

      <HelpRow
        eyebrow="Toggles"
        title="Three knobs that shape every survey"
        demo={<DemoAdminSurveyToggles />}
      >
        <p>
          <strong>Published</strong> — visible to employees at all.
        </p>
        <p>
          <strong>Anonymous</strong> — strips the responder identity at the server. We don't store who answered.
        </p>
        <p>
          <strong>Show results to all</strong> — exposes the aggregated results page to respondents. Off means only admins can see results.
        </p>
      </HelpRow>
    </div>
  );
}

function AdminNotificationsContent() {
  return (
    <HelpRow
      eyebrow="Reference"
      title="Who gets pinged when"
      demo={<DemoNotifyMatrix />}
    >
      <p>
        Notifications fan out automatically when you create things — no separate "send" step.
      </p>
      <p>
        Anonymous survey responses still notify admins but with no name attached.
      </p>
    </HelpRow>
  );
}

// ── Page shell ─────────────────────────────────────────────────────────────

type SectionKey =
  | "start"
  | "people"
  | "updates"
  | "surveys"
  | "notifications"
  | "admin";

type AdminSubKey =
  | "overview"
  | "employees"
  | "departments"
  | "updates"
  | "events"
  | "surveys"
  | "notifications";

const sectionMeta: Record<
  SectionKey,
  { label: string; icon: typeof BookOpen }
> = {
  start: { label: "Getting Started", icon: Sparkles },
  people: { label: "People & Teams", icon: Users },
  updates: { label: "Updates & Events", icon: Newspaper },
  surveys: { label: "Surveys", icon: ClipboardList },
  notifications: { label: "Notifications", icon: Bell },
  admin: { label: "Admin", icon: ShieldCheck },
};

const adminSubMeta: Record<AdminSubKey, { label: string; icon: typeof BookOpen }> = {
  overview: { label: "Overview", icon: LayoutDashboard },
  employees: { label: "Employees", icon: Users },
  departments: { label: "Departments & Resources", icon: Building2 },
  updates: { label: "Publishing Updates", icon: Megaphone },
  events: { label: "Events", icon: Calendar },
  surveys: { label: "Surveys & Builder", icon: ClipboardList },
  notifications: { label: "Notifications fan-out", icon: Bell },
};

export function HelpPage() {
  const { isAdmin } = useAuth();
  const [section, setSection] = useState<SectionKey>("start");
  const [adminSub, setAdminSub] = useState<AdminSubKey>("overview");

  const visibleSections: SectionKey[] = isAdmin
    ? ["start", "people", "updates", "surveys", "notifications", "admin"]
    : ["start", "people", "updates", "surveys", "notifications"];

  function renderBody() {
    switch (section) {
      case "start":
        return <StartContent />;
      case "people":
        return <PeopleContent />;
      case "updates":
        return <UpdatesContent />;
      case "surveys":
        return <SurveysContent />;
      case "notifications":
        return <NotificationsContent />;
      case "admin":
        return renderAdmin();
    }
  }

  function renderAdmin() {
    switch (adminSub) {
      case "overview":
        return <AdminOverviewContent />;
      case "employees":
        return <AdminEmployeesContent />;
      case "departments":
        return <AdminDepartmentsContent />;
      case "updates":
        return <AdminUpdatesContent />;
      case "events":
        return <AdminEventsContent />;
      case "surveys":
        return <AdminSurveysContent />;
      case "notifications":
        return <AdminNotificationsContent />;
    }
  }

  return (
    <div className="bg-brand-mesh">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Portal
        </Link>

        <header className="mt-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-highlight-600">
            TadHealth
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-brand-900 md:text-4xl">
            Help & Walkthrough
          </h1>
          <p className="mt-3 max-w-2xl text-base text-brand-600">
            A quick tour of the portal — pick a section on the left.
          </p>
        </header>

        <div className="mt-10 grid gap-8 lg:grid-cols-[240px_1fr]">
          {/* Sidebar */}
          <aside>
            <nav className="sticky top-24 flex flex-col gap-1 rounded-2xl border border-brand-100 bg-white p-2 shadow-soft">
              {visibleSections.map((k) => {
                const m = sectionMeta[k];
                const active = section === k;
                return (
                  <button
                    key={k}
                    onClick={() => setSection(k)}
                    className={cn(
                      "inline-flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
                      active
                        ? k === "admin"
                          ? "bg-accent-400 text-brand-950"
                          : "bg-brand-900 text-white"
                        : "text-brand-700 hover:bg-brand-50",
                    )}
                  >
                    <m.icon className="h-4 w-4" />
                    {m.label}
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Content pane */}
          <section className="space-y-8">
            {section === "admin" && (
              <div className="flex flex-wrap gap-1 rounded-2xl border border-accent-200 bg-accent-50/60 p-2">
                {(Object.keys(adminSubMeta) as AdminSubKey[]).map((k) => {
                  const m = adminSubMeta[k];
                  const active = adminSub === k;
                  return (
                    <button
                      key={k}
                      onClick={() => setAdminSub(k)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                        active
                          ? "bg-accent-400 text-brand-950"
                          : "text-accent-800 hover:bg-accent-100",
                      )}
                    >
                      <m.icon className="h-3.5 w-3.5" />
                      {m.label}
                    </button>
                  );
                })}
              </div>
            )}

            {renderBody()}

            <footer className="mt-12 rounded-2xl border border-brand-100 bg-white p-6 shadow-soft">
              <p className="text-sm text-brand-700">
                Stuck or want a new feature? Ping <strong>Miguel</strong>.
              </p>
              <Link
                to="/"
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-900 hover:text-highlight-700"
              >
                Back to the portal
                <ArrowRight className="h-4 w-4" />
              </Link>
            </footer>
          </section>
        </div>
      </div>
    </div>
  );
}

// Suppress unused-import warning for icons used only in lookup maps above.
void FolderOpen;
void Mail;
void Eye;
