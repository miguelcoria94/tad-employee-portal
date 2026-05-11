import { Mail, Phone } from "lucide-react";
import { initials, fullName, type Employee } from "@tadhealth/shared";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export function EmployeeCard({ employee }: { employee: Employee }) {
  return (
    <article className="group relative flex flex-col gap-4 rounded-2xl border border-brand-100 bg-white p-5 shadow-soft transition-colors hover:border-highlight-300">
      <div className="flex items-start gap-4">
        <Avatar initials={initials(employee)} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-brand-900">
            {fullName(employee)}
          </p>
          <p className="mt-0.5 line-clamp-2 text-sm text-brand-600">
            {employee.title}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Badge variant="highlight">{employee.department}</Badge>
        {employee.subDepartment && (
          <Badge variant="neutral">{employee.subDepartment}</Badge>
        )}
      </div>

      <div className="mt-auto flex flex-col gap-1.5 border-t border-brand-100 pt-3 text-sm text-brand-600">
        <a
          href={`mailto:${employee.email}`}
          className="inline-flex items-center gap-2 truncate font-medium text-brand-700 hover:text-brand-900"
        >
          <Mail className="h-4 w-4 shrink-0 text-brand-400" />
          <span className="truncate">{employee.email}</span>
        </a>
        {employee.phone && (
          <span className="inline-flex items-center gap-2 text-brand-500">
            <Phone className="h-4 w-4 shrink-0 text-brand-400" />
            {employee.phone}
          </span>
        )}
      </div>
    </article>
  );
}