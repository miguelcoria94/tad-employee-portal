import { NavLink, useNavigate } from "react-router-dom";
import { LogOut, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Avatar } from "@/components/ui/avatar";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { GlobalSearch } from "@/components/shell/global-search";
import { useAuth } from "@/auth/auth-context";
import { cn } from "@/lib/utils";

const links = [
  { to: "/", label: "Home", end: true },
  { to: "/departments", label: "Departments" },
  { to: "/directory", label: "Directory" },
  { to: "/surveys", label: "Surveys" },
  { to: "/time-off", label: "Time Off" },
  { to: "/help", label: "Help" },
];

export function Topbar() {
  const { me, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const initials =
    me?.employee
      ? `${me.employee.firstName.charAt(0)}${(me.employee.lastName ?? "").charAt(0) || ""}`
      : "U";

  return (
    <header className="sticky top-0 z-30 border-b border-brand-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-6">
        <NavLink to="/" className="shrink-0">
          <Logo tagline={false} />
        </NavLink>

        <nav className="hidden min-w-0 items-center gap-0.5 lg:flex">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                cn(
                  "whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-brand-50 text-brand-900"
                    : "text-brand-600 hover:bg-brand-50 hover:text-brand-900",
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                cn(
                  "ml-1 inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent-100 text-accent-800"
                    : "text-accent-700 hover:bg-accent-50",
                )
              }
            >
              <ShieldCheck className="h-4 w-4" />
              Admin
            </NavLink>
          )}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <div className="hidden xl:flex xl:w-56">
            <GlobalSearch />
          </div>
          <NotificationBell />
          <NavLink
            to="/me"
            className="flex items-center gap-2.5 rounded-lg p-1 transition-colors hover:bg-brand-50"
            title="Your profile"
          >
            <div className="hidden text-right 2xl:block">
              <p className="whitespace-nowrap text-xs text-brand-500">
                {me?.employee?.title ?? "Welcome"}
              </p>
              <p className="whitespace-nowrap text-sm font-semibold text-brand-900">
                {me?.employee?.firstName ?? "Hello"}
              </p>
            </div>
            <Avatar
              initials={initials.toUpperCase()}
              src={me?.employee?.avatarUrl}
            />
          </NavLink>
          <button
            onClick={async () => {
              await signOut();
              navigate("/login", { replace: true });
            }}
            title="Sign out"
            className="grid h-9 w-9 place-items-center rounded-lg text-brand-600 transition-colors hover:bg-brand-50 hover:text-brand-900"
          >
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Sign out</span>
          </button>
        </div>
      </div>
    </header>
  );
}