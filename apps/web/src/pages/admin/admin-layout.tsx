import { NavLink, Outlet } from "react-router-dom";
import {
  Building2,
  Calendar,
  ClipboardList,
  LayoutDashboard,
  Newspaper,
  PalmtreeIcon as Palmtree,
  ShieldCheck,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { to: "/admin", label: "Overview", end: true, icon: LayoutDashboard },
  { to: "/admin/employees", label: "Employees", icon: Users },
  { to: "/admin/departments", label: "Departments", icon: Building2 },
  { to: "/admin/company-updates", label: "Updates", icon: Newspaper },
  { to: "/admin/company-events", label: "Events", icon: Calendar },
  { to: "/admin/surveys", label: "Surveys", icon: ClipboardList },
  { to: "/admin/time-off", label: "Time Off", icon: Palmtree },
];

export function AdminLayout() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <header className="mb-10 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent-400 text-brand-950 shadow-soft">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-700">
            Admin
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-brand-900">
            Portal Administration
          </h1>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside>
          <nav className="flex flex-col gap-1 rounded-2xl border border-brand-100 bg-white p-2 shadow-soft">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  cn(
                    "inline-flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-brand-900 text-white"
                      : "text-brand-700 hover:bg-brand-50",
                  )
                }
              >
                <l.icon className="h-4 w-4" />
                {l.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <section>
          <Outlet />
        </section>
      </div>
    </div>
  );
}
