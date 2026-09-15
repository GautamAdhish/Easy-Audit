import React, { useEffect, useState } from "react";
import { NavLink, useMatch } from "react-router-dom";
import * as Tooltip from "@radix-ui/react-tooltip";
import { useAuth } from "../../context/AuthContext";
import { cn } from "../../utils/cn";
import { getRoleDefinition } from "../../utils/roleAccess";
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  CheckSquare,
  AlertTriangle,
  Target,
  ShieldAlert,
  FolderOpen,
  BarChart2,
  FileBarChart,
  Building2,
  Users,
  Settings,
  User,
  Image,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const COLLAPSE_STORAGE_KEY = "is_audit_sidebar_collapsed";

const navItems = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Audit Program", path: "/audit-program", icon: BookOpen },
  { label: "Audits", path: "/audits", icon: ClipboardList },
  { label: "Checklists", path: "/checklist", icon: CheckSquare },
  { label: "Findings", path: "/findings", icon: AlertTriangle },
  { label: "CAPA", path: "/capa", icon: Target },
  { label: "Risks", path: "/risks", icon: ShieldAlert },
  { label: "Documents", path: "/evidence", icon: FolderOpen },
  { label: "Assets", path: "/assets", icon: Image },
  { label: "Vendor Management", path: "/vendor-management", icon: Building2 },
  { label: "Reports", path: "/reports", icon: BarChart2 },
  { label: "Summary Report", path: "/summary", icon: FileBarChart },
  { label: "Users", path: "/users", icon: Users },
  { label: "Settings", path: "/settings", icon: Settings },
];

const NavItem: React.FC<{
  label: string;
  path: string;
  icon: React.ElementType;
  collapsed: boolean;
}> = ({ label, path, icon: Icon, collapsed }) => {
  // Resolved to a plain string rather than NavLink's function-form
  // className — Radix's asChild/Slot merges child props assuming plain
  // values, and stringifies a function prop instead of calling it.
  const isActive = Boolean(useMatch(path));

  const link = (
    <NavLink
      to={path}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2.5 text-[13px] font-medium transition-colors duration-150",
        collapsed &&
          "lg:justify-center lg:w-11 lg:h-11 lg:mx-auto lg:rounded-md lg:px-0 lg:py-0",
        isActive
          ? cn(
              "bg-white/8 text-brass-400",
              collapsed && "lg:bg-brass-500 lg:text-ink-950",
            )
          : "text-slate-400 hover:bg-white/5 hover:text-white",
      )}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span className={cn("truncate", collapsed && "lg:hidden")}>{label}</span>
    </NavLink>
  );

  return (
    <Tooltip.Root delayDuration={200}>
      <Tooltip.Trigger asChild>{link}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          side="right"
          sideOffset={12}
          className={cn(
            "hidden z-40 rounded-md bg-ink-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg",
            collapsed && "lg:block",
          )}
        >
          {label}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
};

// Desktop rail toggles between icon-only (14 sections is too many for the
// reference's horizontal pill nav, so icon+tooltip is the honest adaptation
// of a literal clone) and a labeled, full-width rail — the user's choice,
// remembered across sessions. Mobile ignores the collapsed state and always
// renders the labeled drawer, better suited to touch than hover tooltips.
// Tooltips are portalled (Radix) rather than CSS-positioned, since the
// nav's own overflow-y-auto would otherwise clip anything escaping its
// right edge.
const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_STORAGE_KEY) !== "false";
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_STORAGE_KEY, String(collapsed));
    } catch {
      // ignore — persistence is a nicety, not a requirement
    }
  }, [collapsed]);

  return (
    <Tooltip.Provider>
      <aside
        className={cn(
          "h-full w-[78vw] max-w-[17rem] bg-ink-950 rounded-lg flex flex-col shrink-0 lg:transition-[width] lg:duration-300 lg:ease-in-out",
          collapsed ? "lg:w-20" : "lg:w-64",
        )}
      >
        <div
          className={cn(
            "flex flex-col items-center text-center px-4 pt-6 pb-5 shrink-0 lg:pt-5 lg:pb-4",
            collapsed ? "lg:px-2" : "lg:px-4",
          )}
        >
          <div className="w-11 h-11 lg:w-10 lg:h-10 rounded-md bg-brass-500 flex items-center justify-center shrink-0">
            <User className="w-5 h-5 text-ink-950" />
          </div>
          <div className={cn("min-w-0 mt-2.5", collapsed && "lg:hidden")}>
            <p className="text-sm font-bold text-white leading-tight truncate tracking-tight uppercase">
              {user?.name || "IS Audit"}
            </p>
            <p className="text-[10px] text-slate-400 leading-none mt-1.5 truncate uppercase tracking-wider">
              {user?.role || "Management System"}
            </p>
          </div>
        </div>

        <nav
          className={cn(
            "flex-1 overflow-y-auto py-2 px-2.5 space-y-1 lg:space-y-1.5",
            collapsed ? "lg:px-2" : "lg:px-2.5",
          )}
        >
          {navItems
            .filter((item) => getRoleDefinition(user?.role).navPaths.includes(item.path))
            .map((item) => (
            <NavItem key={item.path} {...item} collapsed={collapsed} />
            ))}
        </nav>

        <div
          className={cn(
            "hidden lg:block shrink-0 border-t border-white/5 py-2.5",
            collapsed ? "lg:px-2" : "lg:px-2.5",
          )}
        >
          <Tooltip.Root delayDuration={200}>
            <Tooltip.Trigger asChild>
              <button
                type="button"
                onClick={() => setCollapsed((value) => !value)}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-[13px] font-medium text-slate-400 transition-colors duration-150 hover:bg-white/5 hover:text-white",
                  collapsed &&
                    "lg:justify-center lg:w-11 lg:h-11 lg:mx-auto lg:rounded-md lg:px-0 lg:py-0",
                )}
              >
                {collapsed ? (
                  <ChevronRight className="w-4 h-4 shrink-0" />
                ) : (
                  <ChevronLeft className="w-4 h-4 shrink-0" />
                )}
                <span className={cn("truncate", collapsed && "lg:hidden")}>
                  Collapse
                </span>
              </button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                side="right"
                sideOffset={12}
                className={cn(
                  "hidden z-40 rounded-md bg-ink-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg",
                  collapsed && "lg:block",
                )}
              >
                Expand sidebar
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </div>
      </aside>
    </Tooltip.Provider>
  );
};

export default Sidebar;
