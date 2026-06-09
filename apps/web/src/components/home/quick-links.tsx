import { Link } from "react-router-dom";
import {
  Briefcase,
  Calendar,
  ClipboardList,
  HelpCircle,
  Newspaper,
  Users,
} from "lucide-react";

const LINKS = [
  { label: "Time Off", to: "/time-off", icon: Calendar },
  { label: "Internal Jobs", to: "/internal-jobs", icon: Briefcase },
  { label: "Directory", to: "/directory", icon: Users },
  { label: "Company Updates", to: "/company-updates", icon: Newspaper },
  { label: "Surveys", to: "/surveys", icon: ClipboardList },
  { label: "Help", to: "/help", icon: HelpCircle },
] as const;

export function QuickLinks() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-8">
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">
        Quick Links
      </h2>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {LINKS.map(({ label, to, icon: Icon }) => (
          <li key={to}>
            <Link
              to={to}
              className="group flex flex-col items-center gap-2.5 rounded-2xl border border-brand-100 bg-white px-4 py-5 shadow-soft transition-colors hover:border-highlight-300 hover:bg-highlight-50/40"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-highlight-100 text-highlight-700 transition-colors group-hover:bg-highlight-200">
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-center text-sm font-semibold text-brand-900">
                {label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
