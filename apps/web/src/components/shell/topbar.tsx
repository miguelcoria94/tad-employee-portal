import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, LogOut, ShieldCheck, Sparkles } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Avatar } from "@/components/ui/avatar";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { GlobalSearch } from "@/components/shell/global-search";
import { useAssistant } from "@/components/assistant/assistant-context";
import { useAuth } from "@/auth/auth-context";
import { cn } from "@/lib/utils";

// Primary links stay visible; everything else collapses into a grouped menu so
// the bar doesn't get crowded.
const primaryLinks = [
  { to: "/", label: "Home", end: true },
  { to: "/directory", label: "Directory" },
  { to: "/departments", label: "Departments" },
  { to: "/dms", label: "Messages" },
];

const moreLinks = [
  { to: "/time-off", label: "Time Off" },
  { to: "/feedback", label: "Feedback" },
  { to: "/surveys", label: "Surveys" },
  { to: "/internal-jobs", label: "Jobs" },
  { to: "/training", label: "Training" },
  { to: "/resources", label: "Resources" },
  { to: "/help", label: "Help" },
];

function MoreMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const location = useLocation();

  // Highlight "More" when the active route is one of its children.
  const childActive = moreLinks.some((l) =>
    location.pathname.startsWith(l.to),
  );

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  // Close on navigation.
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center gap-1 whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
          childActive
            ? "bg-brand-50 text-brand-900"
            : "text-brand-600 hover:bg-brand-50 hover:text-brand-900",
        )}
      >
        More
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div className="absolute left-0 top-11 z-40 w-44 overflow-hidden rounded-xl border border-brand-100 bg-white py-1 shadow-soft">
          {moreLinks.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                cn(
                  "block px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-brand-50 text-brand-900"
                    : "text-brand-600 hover:bg-brand-50 hover:text-brand-900",
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

export function Topbar() {
  const { me, isAdmin, signOut } = useAuth();
  const assistant = useAssistant();
  const navigate = useNavigate();

  const initials = me?.employee
    ? `${me.employee.firstName.charAt(0)}${(me.employee.lastName ?? "").charAt(0) || ""}`
    : "U";

  return (
    <header className="sticky top-0 z-30 border-b border-brand-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-6">
        <NavLink to="/" className="shrink-0">
          <Logo tagline={false} />
        </NavLink>

        <nav className="hidden min-w-0 items-center gap-0.5 lg:flex">
          {primaryLinks.map((l) => (
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
          <MoreMenu />
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
          <button
            onClick={assistant.open}
            title="Ask Tad"
            className="inline-flex items-center gap-1.5 rounded-lg bg-highlight-100 px-2.5 py-2 text-sm font-semibold text-highlight-700 transition-colors hover:bg-highlight-200"
          >
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Ask Tad</span>
          </button>
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
