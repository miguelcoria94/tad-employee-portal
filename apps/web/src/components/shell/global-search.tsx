import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  ClipboardList,
  Megaphone,
  Search,
  Users,
} from "lucide-react";
import type {
  CompanyUpdate,
  DepartmentResourceRow,
  DepartmentRow,
  Employee,
  SurveyRow,
} from "@tadhealth/shared";
import { fullName, initials, slugifyDepartment } from "@tadhealth/shared";
import { api } from "@/lib/api";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type Hit =
  | { kind: "person"; employee: Employee; to: string; score: number }
  | { kind: "department"; dept: DepartmentRow; to: string; score: number }
  | { kind: "update"; update: CompanyUpdate; to: string; score: number }
  | { kind: "survey"; survey: SurveyRow; to: string; score: number }
  | {
      kind: "resource";
      resource: DepartmentResourceRow;
      to: string;
      score: number;
    };

function score(text: string, q: string): number {
  if (!q) return 0;
  const lower = text.toLowerCase();
  const term = q.toLowerCase();
  if (lower === term) return 100;
  if (lower.startsWith(term)) return 90;
  if (lower.includes(` ${term}`)) return 80;
  if (lower.includes(term)) return 60;
  return 0;
}

export function GlobalSearch() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const employees = useQuery<{ employees: Employee[] }>({
    queryKey: ["employees"],
    queryFn: () => api("/api/v1/employees"),
    enabled: open,
    staleTime: 60_000,
  });
  const departments = useQuery<{ departments: DepartmentRow[] }>({
    queryKey: ["departments"],
    queryFn: () => api("/api/v1/departments"),
    enabled: open,
    staleTime: 60_000,
  });
  const updates = useQuery<{ updates: CompanyUpdate[] }>({
    queryKey: ["company-updates"],
    queryFn: () => api("/api/v1/company-updates"),
    enabled: open,
    staleTime: 60_000,
  });
  const surveys = useQuery<{ surveys: SurveyRow[] }>({
    queryKey: ["surveys"],
    queryFn: () => api("/api/v1/surveys"),
    enabled: open,
    staleTime: 60_000,
  });

  // Fetch resources per known department. Skipped if departments isn't loaded.
  const resourceQueries = useQuery<{
    items: { department: string; rows: DepartmentResourceRow[] }[];
  }>({
    queryKey: ["all-department-resources", departments.data?.departments.length],
    enabled: open && !!departments.data?.departments.length,
    queryFn: async () => {
      const all = await Promise.all(
        (departments.data?.departments ?? []).map(async (d) => {
          const res = await api<{ resources: DepartmentResourceRow[] }>(
            `/api/v1/department-resources?department=${encodeURIComponent(d.name)}`,
          );
          return { department: d.name, rows: res.resources };
        }),
      );
      return { items: all };
    },
    staleTime: 60_000,
  });

  const hits = useMemo<Hit[]>(() => {
    if (!q || q.length < 2) return [];
    const list: Hit[] = [];

    for (const e of employees.data?.employees ?? []) {
      const s = Math.max(
        score(fullName(e), q),
        score(e.email, q) * 0.9,
        score(e.title, q) * 0.7,
        score(e.department, q) * 0.5,
      );
      if (s > 0) list.push({ kind: "person", employee: e, to: "/directory", score: s });
    }

    for (const d of departments.data?.departments ?? []) {
      const s = Math.max(score(d.name, q), score(d.description, q) * 0.5);
      if (s > 0) {
        list.push({
          kind: "department",
          dept: d,
          to: `/departments/${slugifyDepartment(d.name)}`,
          score: s,
        });
      }
    }

    for (const u of updates.data?.updates ?? []) {
      const s = Math.max(score(u.title, q), score(u.body ?? "", q) * 0.4);
      if (s > 0) {
        list.push({
          kind: "update",
          update: u,
          to: `/company-updates/${u.id}`,
          score: s,
        });
      }
    }

    for (const s of surveys.data?.surveys ?? []) {
      const sc = Math.max(score(s.title, q), score(s.description ?? "", q) * 0.5);
      if (sc > 0) {
        list.push({
          kind: "survey",
          survey: s,
          to: `/surveys/${s.id}`,
          score: sc,
        });
      }
    }

    for (const group of resourceQueries.data?.items ?? []) {
      for (const r of group.rows) {
        const s = score(r.title, q);
        if (s > 0) {
          list.push({
            kind: "resource",
            resource: r,
            to: `/departments/${slugifyDepartment(group.department)}`,
            score: s,
          });
        }
      }
    }

    list.sort((a, b) => b.score - a.score);
    return list.slice(0, 30);
  }, [
    q,
    employees.data,
    departments.data,
    updates.data,
    surveys.data,
    resourceQueries.data,
  ]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  // Cmd/Ctrl+K to focus.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function openHit(h: Hit) {
    setOpen(false);
    setQ("");
    navigate(h.to);
  }

  return (
    <div className="relative max-w-md flex-1" ref={containerRef}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-brand-400" />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search people, departments, updates…"
          className="h-9 w-full rounded-lg border border-brand-100 bg-white pl-8 pr-12 text-sm text-brand-900 placeholder:text-brand-400 focus:border-highlight-400 focus:outline-none focus:ring-2 focus:ring-highlight-200"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-brand-100 bg-brand-50 px-1.5 py-0.5 text-[10px] font-semibold text-brand-500"
        >
          ⌘K
        </span>
      </div>

      {open && q.length >= 2 && (
        <div className="absolute left-0 right-0 top-11 z-40 overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-soft">
          {hits.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-brand-500">
              Nothing matches “{q}”.
            </p>
          ) : (
            <ul className="max-h-[28rem] divide-y divide-brand-50 overflow-y-auto">
              {hits.map((h, i) => (
                <li key={`${h.kind}-${i}`}>
                  <button
                    onClick={() => openHit(h)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-brand-50/60"
                  >
                    <HitIcon hit={h} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-brand-900">
                        {hitTitle(h)}
                      </span>
                      <span className="block truncate text-xs text-brand-500">
                        {hitSubtitle(h)}
                      </span>
                    </span>
                    <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-600">
                      {h.kind}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function HitIcon({ hit }: { hit: Hit }) {
  if (hit.kind === "person") {
    return (
      <Avatar
        initials={initials(hit.employee).toUpperCase()}
        src={hit.employee.avatarUrl}
        alt={fullName(hit.employee)}
        size="sm"
      />
    );
  }
  const Icon =
    hit.kind === "department"
      ? Building2
      : hit.kind === "update"
        ? Megaphone
        : hit.kind === "survey"
          ? ClipboardList
          : Users;
  return (
    <span
      className={cn(
        "grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-highlight-100 text-highlight-700",
      )}
    >
      <Icon className="h-4 w-4" />
    </span>
  );
}

function hitTitle(h: Hit): string {
  switch (h.kind) {
    case "person":
      return fullName(h.employee);
    case "department":
      return h.dept.name;
    case "update":
      return h.update.title;
    case "survey":
      return h.survey.title;
    case "resource":
      return h.resource.title;
  }
}

function hitSubtitle(h: Hit): string {
  switch (h.kind) {
    case "person":
      return `${h.employee.title} · ${h.employee.department}`;
    case "department":
      return h.dept.description || "—";
    case "update":
      return new Date(h.update.publishedAt).toLocaleDateString();
    case "survey":
      return h.survey.isAnonymous ? "Anonymous survey" : "Survey";
    case "resource":
      return `${h.resource.departmentName} · ${h.resource.linkLabel}`;
  }
}
