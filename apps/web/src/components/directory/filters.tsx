import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  q: string;
  onQueryChange: (v: string) => void;
  department: string;
  onDepartmentChange: (v: string) => void;
  departments: string[];
};

export function DirectoryFilters({
  q,
  onQueryChange,
  department,
  onDepartmentChange,
  departments,
}: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-400" />
        <input
          value={q}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search by name, email, title, or department…"
          className="h-12 w-full rounded-2xl border border-brand-100 bg-white pl-11 pr-4 text-sm text-brand-900 placeholder:text-brand-400 shadow-soft transition-colors focus:border-highlight-400 focus:outline-none focus:ring-2 focus:ring-highlight-200"
        />
      </div>

      <div className="-mx-1 flex flex-wrap gap-2 px-1">
        <button
          onClick={() => onDepartmentChange("")}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
            department === ""
              ? "bg-brand-900 text-white"
              : "bg-white text-brand-600 ring-1 ring-inset ring-brand-100 hover:bg-brand-50",
          )}
        >
          All Departments
        </button>
        {departments.map((d) => (
          <button
            key={d}
            onClick={() => onDepartmentChange(d)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              department === d
                ? "bg-brand-900 text-white"
                : "bg-white text-brand-600 ring-1 ring-inset ring-brand-100 hover:bg-brand-50",
            )}
          >
            {d}
          </button>
        ))}
      </div>
    </div>
  );
}