import { Mail, MapPin, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { initials, fullName, type Employee } from "@tadhealth/shared";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export function EmployeeCard({ employee }: { employee: Employee }) {
  return (
    <article className="group relative flex flex-col gap-4 rounded-2xl border border-brand-100 bg-white p-5 shadow-soft transition-colors hover:border-highlight-300">
      <Link
        to={`/directory/${employee.id}`}
        className="absolute inset-0 rounded-2xl"
        aria-label={`View ${fullName(employee)}'s profile`}
      />
      <div className="flex items-start gap-4">
        <Avatar
          initials={initials(employee)}
          src={employee.avatarUrl}
          alt={fullName(employee)}
          size="lg"
        />
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

      <div className="relative mt-auto flex flex-col gap-1.5 border-t border-brand-100 pt-3 text-sm text-brand-600">
        <a
          href={`mailto:${employee.email}`}
          className="relative inline-flex items-center gap-2 truncate font-medium text-brand-700 hover:text-brand-900"
          onClick={(e) => e.stopPropagation()}
        >
          <Mail className="h-4 w-4 shrink-0 text-brand-400" />
          <span className="truncate">{employee.email}</span>
        </a>
        {employee.location && (
          <span className="inline-flex items-center gap-2 text-brand-500">
            <MapPin className="h-4 w-4 shrink-0 text-brand-400" />
            {employee.location}
          </span>
        )}
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