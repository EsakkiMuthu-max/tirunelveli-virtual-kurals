import { NavLink, useNavigate } from "react-router-dom";
import {
  Building2, Car, Droplets, FilePlus2, LayoutDashboard, Lightbulb, ListChecks,
  LogOut, Trash2, Trees, Waves,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { endSession } from "@/lib/session";
import type { SessionUser } from "@/lib/types";
import { cn } from "@/lib/utils";

const DEPARTMENT_ICONS: Record<string, typeof Car> = {
  roads_potholes: Car,
  water_supply: Droplets,
  sewerage_drainage: Waves,
  street_lights: Lightbulb,
  solid_waste: Trash2,
  parks_public_spaces: Trees,
  encroachment_buildings: Building2,
};

export function departmentIcon(departmentId: string) {
  return DEPARTMENT_ICONS[departmentId] ?? Building2;
}

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  testId: string;
}

const CITIZEN_NAV: NavItem[] = [
  { to: "/citizen", label: "Dashboard", icon: LayoutDashboard, testId: "nav-citizen-dashboard" },
  { to: "/citizen/report", label: "Report an Issue", icon: FilePlus2, testId: "nav-report-issue" },
  { to: "/citizen/reports", label: "Report Status", icon: ListChecks, testId: "nav-my-reports" },
];

const OFFICER_NAV: NavItem[] = [
  { to: "/officer", label: "Department Queue", icon: LayoutDashboard, testId: "nav-officer-dashboard" },
];

interface AppShellProps {
  user: SessionUser;
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export default function AppShell({ user, title, subtitle, actions, children }: AppShellProps) {
  const navigate = useNavigate();
  const items = user.role === "officer" ? OFFICER_NAV : CITIZEN_NAV;
  const DeptIcon = user.department_id ? departmentIcon(user.department_id) : LayoutDashboard;

  const signOut = async () => {
    await endSession();
    toast.success("Signed out of Tirunelveli Virtual Kural.");
    navigate("/login", { replace: true });
  };

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="civic-shell">
      <header className="civic-brandbar">
        <div className="civic-brand">
          <img src="/favicon.svg" alt="" className="civic-emblem" />
          <div>
            <p className="civic-brand-name">Tirunelveli Virtual Kural</p>
            <p className="civic-brand-caption">திருநெல்வேலி மெய்நிகர் குறள்</p>
          </div>
        </div>
        <div className="civic-account">
          <span className="civic-avatar"><DeptIcon className="size-5" aria-hidden /></span>
          <div className="min-w-0">
            <p className="truncate font-semibold" data-testid="sidebar-user-name">{user.display_name}</p>
            <p className="civic-brand-caption">{user.role === "officer" ? "Department Officer" : "Citizen"}</p>
          </div>
        </div>
      </header>
      <div className="civic-body">
        <aside className="civic-sidebar" data-testid="app-sidebar">
          <span className="civic-role" data-testid="sidebar-role-badge">
            {user.role === "officer" ? "Department Officer" : "Citizen"}
          </span>
          <nav className="civic-nav" aria-label="Main navigation">
            {items.map((item) => (
              <NavLink key={item.to} to={item.to}
                end={item.to === "/citizen" || item.to === "/officer"}
                data-testid={item.testId}
                className={({ isActive }) => cn("civic-nav-link", isActive && "is-active")}>
                <item.icon className="size-4 shrink-0" aria-hidden />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
          <div className="civic-sidebar-bottom">
            <p className="civic-city-name">Tirunelveli</p>
            <p className="civic-brand-caption">Our City. Our Responsibility.</p>
            <p className="civic-login-id" data-testid="sidebar-login-id">{user.login_id}</p>
            <Button onClick={signOut} data-testid="sign-out-button" className="civic-signout">
              <LogOut className="size-4" aria-hidden />Sign out
            </Button>
          </div>
        </aside>
        <div className="civic-content">
          <nav className="civic-mobile-nav" data-testid="mobile-nav" aria-label="Mobile navigation">
            {items.map((item) => (
              <NavLink key={item.to} to={item.to}
                end={item.to === "/citizen" || item.to === "/officer"}
                data-testid={`${item.testId}-mobile`}
                className={({ isActive }) => cn("civic-mobile-link", isActive && "is-active")}>
                <item.icon className="size-4 shrink-0" aria-hidden />{item.label}
              </NavLink>
            ))}
            <Button onClick={signOut} data-testid="sign-out-button-mobile" className="civic-signout" size="sm">
              <LogOut className="size-4" aria-hidden />Sign out
            </Button>
          </nav>
          <main className="civic-main">
            <div className="civic-page-heading">
              <div className="min-w-0">
                <h1 data-testid="page-title">{title}</h1>
                <p>{subtitle}</p>
              </div>
              <div className="civic-page-actions">
                {actions}
                <span className="civic-date" data-testid="today-label">{today}</span>
              </div>
            </div>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
