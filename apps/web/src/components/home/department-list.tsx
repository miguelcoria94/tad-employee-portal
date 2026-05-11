import { Link } from "react-router-dom";
import { type DepartmentRow, slugifyDepartment } from "@tadhealth/shared";
import { departmentIcon, departmentIconStyle } from "@/lib/department-icons";

export function DepartmentList({ departments }: { departments: DepartmentRow[] }) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="mb-10 flex items-end justify-between gap-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-highlight-600">
            Departments
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-brand-900 md:text-4xl">
            Every team at TadHealth
          </h2>
        </div>
        <Link
          to="/directory"
          className="hidden items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-900 sm:inline-flex"
        >
          Browse team directory
          <i className="fa-light fa-arrow-right" aria-hidden="true" />
        </Link>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {departments.map((d) => (
          <li
            key={d.id}
            className="group relative rounded-2xl border border-brand-100 bg-white p-6 shadow-soft transition-colors hover:border-highlight-300"
          >
            <Link
              to={`/departments/${slugifyDepartment(d.name)}`}
              className="absolute inset-0 rounded-2xl"
              aria-label={`Open ${d.name} department`}
            />
            <div className="flex items-start justify-between gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-highlight-100 text-highlight-700">
                <i
                  className={`${departmentIcon(d.name)} text-[20px] leading-none`}
                  style={departmentIconStyle}
                  aria-hidden="true"
                />
              </span>
              <i
                className="fa-light fa-arrow-up-right text-brand-300 transition-colors group-hover:text-brand-900"
                aria-hidden="true"
              />
            </div>
            <h3 className="mt-5 text-lg font-bold tracking-tight text-brand-900">
              {d.name}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-brand-600">
              {d.description}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
