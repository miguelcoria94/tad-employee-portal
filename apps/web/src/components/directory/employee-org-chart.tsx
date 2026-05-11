import { fullName, initials, type Employee } from "@tadhealth/shared";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export function EmployeeOrgChart({ employees }: { employees: Employee[] }) {
  const grouped = new Map<string, Employee[]>();
  for (const e of employees) {
    const key = e.department;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(e);
  }

  const sortedDepts = [...grouped.keys()].sort();

  return (
    <div className="flex flex-col gap-6">
      {sortedDepts.map((dept) => {
        const list = grouped.get(dept)!;
        return (
          <section
            key={dept}
            className="rounded-2xl border border-brand-100 bg-white p-6 shadow-soft"
          >
            <header className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold tracking-tight text-brand-900">
                  {dept}
                </h3>
                <Badge variant="highlight">{list.length}</Badge>
              </div>
            </header>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center gap-3 rounded-xl border border-brand-50 bg-brand-50/40 px-3 py-2"
                >
                  <Avatar initials={initials(e)} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-brand-900">
                      {fullName(e)}
                    </p>
                    <p className="truncate text-xs text-brand-500">
                      {e.title}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}