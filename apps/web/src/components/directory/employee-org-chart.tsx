import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { fullName, initials, type Employee } from "@tadhealth/shared";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type TreeNode = {
  employee: Employee;
  reports: TreeNode[];
};

function buildTree(employees: Employee[]): TreeNode[] {
  // Map employees by id for O(1) lookup; also build a reports adjacency list.
  const byId = new Map<string, Employee>();
  for (const e of employees) byId.set(e.id, e);
  const childrenByManager = new Map<string, Employee[]>();
  for (const e of employees) {
    if (e.managerId && byId.has(e.managerId)) {
      if (!childrenByManager.has(e.managerId))
        childrenByManager.set(e.managerId, []);
      childrenByManager.get(e.managerId)!.push(e);
    }
  }

  // Sort children by title length descending (leaders bubble up by title prestige),
  // then alphabetical. Good enough heuristic — keeps "Senior" above "Associate".
  function sortReports(list: Employee[]): Employee[] {
    return [...list].sort((a, b) => {
      const ta = a.title.match(/^(Chief|VP|Vice President|Head of|Director|Senior|Lead)/) ? 0 : 1;
      const tb = b.title.match(/^(Chief|VP|Vice President|Head of|Director|Senior|Lead)/) ? 0 : 1;
      if (ta !== tb) return ta - tb;
      return fullName(a).localeCompare(fullName(b));
    });
  }

  function build(employee: Employee): TreeNode {
    const reports = sortReports(childrenByManager.get(employee.id) ?? []).map(build);
    return { employee, reports };
  }

  // Roots = employees with no manager, OR whose manager isn't in the visible set
  // (e.g. when a department is private to non-members and the manager is hidden).
  const roots = employees.filter((e) => !e.managerId || !byId.has(e.managerId));
  return sortReports(roots).map(build);
}

function totalCount(node: TreeNode): number {
  return 1 + node.reports.reduce((sum, r) => sum + totalCount(r), 0);
}

function TreeRow({
  node,
  depth,
}: {
  node: TreeNode;
  depth: number;
}) {
  const [open, setOpen] = useState(true);
  const e = node.employee;
  const reportsTotal = totalCount(node) - 1;

  return (
    <li className="relative">
      <div
        className={cn(
          "group flex items-center gap-3 rounded-xl border border-brand-100 bg-white px-3 py-2 transition-colors hover:border-highlight-300",
          depth === 0 && "bg-brand-50/40",
        )}
      >
        {node.reports.length > 0 ? (
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Collapse reports" : "Expand reports"}
            className="grid h-6 w-6 shrink-0 place-items-center rounded text-brand-500 hover:bg-brand-100"
          >
            {open ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>
        ) : (
          <span aria-hidden className="h-6 w-6 shrink-0" />
        )}

        <Avatar initials={initials(e)} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-brand-900">
            {fullName(e)}
          </p>
          <p className="truncate text-xs text-brand-500">
            {e.title}
            {e.location && (
              <span className="text-brand-400"> · {e.location}</span>
            )}
          </p>
        </div>
        {node.reports.length > 0 && (
          <Badge variant="neutral">
            {node.reports.length} direct
            {reportsTotal !== node.reports.length && (
              <span className="ml-1 opacity-60">/ {reportsTotal} total</span>
            )}
          </Badge>
        )}
      </div>

      {open && node.reports.length > 0 && (
        <ul className="ml-7 mt-2 space-y-2 border-l-2 border-brand-100 pl-4">
          {node.reports.map((child) => (
            <TreeRow key={child.employee.id} node={child} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function EmployeeOrgChart({ employees }: { employees: Employee[] }) {
  const roots = useMemo(() => buildTree(employees), [employees]);

  if (employees.length === 0) {
    return (
      <p className="text-sm text-brand-500">No teammates to display.</p>
    );
  }

  return (
    <div className="space-y-3">
      {roots.map((root) => (
        <section
          key={root.employee.id}
          className="rounded-2xl border border-brand-100 bg-white p-4 shadow-soft"
        >
          <ul className="space-y-2">
            <TreeRow node={root} depth={0} />
          </ul>
        </section>
      ))}
    </div>
  );
}