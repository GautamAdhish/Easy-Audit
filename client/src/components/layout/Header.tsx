import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  Bell,
  Search,
  User,
  CheckCheck,
  AlertTriangle,
  FileText,
  ShieldAlert,
  ChevronDown,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { api } from "../../lib/api";
import { getRoleDefinition } from "../../utils/roleAccess";
import DropdownMenu, { DropdownMenuItem } from "../common/DropdownMenu";
import Input from "../common/Input";

interface HeaderProps {
  onMenuToggle: () => void;
}

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  tone: "warning" | "info" | "success";
  path: string;
};

type NotificationSettings = {
  auditOverdueAlerts?: boolean;
  newFindingAssigned?: boolean;
  capaDueDateReminders?: boolean;
  weeklyComplianceDigest?: boolean;
  documentUploads?: boolean;
  newUserRegistrations?: boolean;
};

const msPerDay = 1000 * 60 * 60 * 24;

const formatRelativeTime = (date: string | Date) => {
  const target = new Date(date);
  const diffMs = target.getTime() - Date.now();
  const diffDays = Math.round(diffMs / msPerDay);

  if (diffDays === 0) return "due today";
  if (diffDays === 1) return "due tomorrow";
  if (diffDays > 1) return `due in ${diffDays} days`;
  if (diffDays === -1) return "1 day overdue";
  return `${Math.abs(diffDays)} days overdue`;
};

const buildNotifications = (
  audits: any[],
  findings: any[],
  capas: any[],
  settings: NotificationSettings = {},
) => {
  const items: NotificationItem[] = [];
  const now = new Date();

  if (settings.auditOverdueAlerts !== false) {
    audits.forEach((audit) => {
      const endDate = audit?.endDate ? new Date(audit.endDate) : null;
      if (!endDate || audit.status === "Completed") return;

      const overdueDays = Math.max(
        0,
        Math.ceil((now.getTime() - endDate.getTime()) / msPerDay),
      );
      if (endDate < now || audit.status === "Overdue") {
        items.push({
          id: `audit-${audit._id || audit.code}`,
          title: "Audit overdue",
          message: `${audit.title || "Audit"} is ${overdueDays || 1} day${overdueDays === 1 ? "" : "s"} overdue.`,
          time: formatRelativeTime(endDate),
          read: false,
          tone: "warning",
          path: "/audits",
        });
      }
    });
  }

  if (settings.newFindingAssigned !== false) {
    findings.forEach((finding) => {
      if (!finding?.dueDate || finding.status === "Closed") return;

      const dueDate = new Date(finding.dueDate);
      const diffDays = Math.ceil(
        (dueDate.getTime() - now.getTime()) / msPerDay,
      );
      if (diffDays <= 7 || dueDate < now) {
        items.push({
          id: `finding-${finding._id || finding.code}`,
          title: "Finding due soon",
          message: `${finding.title || "Finding"} • ${formatRelativeTime(dueDate)}.`,
          time: formatRelativeTime(dueDate),
          read: false,
          tone: diffDays < 0 ? "warning" : "info",
          path: "/findings",
        });
      }
    });
  }

  if (settings.capaDueDateReminders !== false) {
    capas.forEach((capa) => {
      if (!capa?.dueDate || capa.status === "Closed") return;

      const dueDate = new Date(capa.dueDate);
      const diffDays = Math.ceil(
        (dueDate.getTime() - now.getTime()) / msPerDay,
      );
      if (diffDays <= 7 || dueDate < now) {
        items.push({
          id: `capa-${capa._id || capa.code}`,
          title: "CAPA due",
          message: `${capa.title || "CAPA"} • ${formatRelativeTime(dueDate)}.`,
          time: formatRelativeTime(dueDate),
          read: false,
          tone: diffDays < 0 ? "warning" : "success",
          path: "/capa",
        });
      }
    });
  }

  return items;
};

const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({});
  const [searchQuery, setSearchQuery] = useState("");

  const unreadCount = notifications.filter((item) => !item.read).length;
  const roleDefinition = getRoleDefinition(user?.role);

  useEffect(() => {
    const nextQuery = new URLSearchParams(location.search).get("q") || "";
    setSearchQuery(nextQuery);
  }, [location.search]);

  useEffect(() => {
    const savedState = JSON.parse(
      localStorage.getItem("is_audit_notifications") || "{}",
    );
    const normalizeSaved = (items: NotificationItem[]) =>
      items
        .filter((item) => item && item.id)
        .map((item) => ({ ...item, read: Boolean(savedState[item.id]) }));

    const load = async () => {
      try {
        const [settingsRes, auditsRes, findingsRes, capasRes] =
          await Promise.all([
            api.get("/settings"),
            api.get("/audits?limit=100&sort=-createdAt"),
            api.get("/findings?limit=100&sort=-createdAt"),
            api.get("/capas?limit=100&sort=-createdAt"),
          ]);

        const nextSettings = settingsRes?.data?.notifications || {};
        const liveNotifications = buildNotifications(
          auditsRes?.data || [],
          findingsRes?.data || [],
          capasRes?.data || [],
          nextSettings,
        );

        const hydrated = normalizeSaved(liveNotifications);
        setSettings(nextSettings);
        setNotifications(hydrated);
      } catch {
        setNotifications([]);
      }
    };

    load();
  }, []);

  useEffect(() => {
    if (!notifications.length) {
      localStorage.setItem("is_audit_notifications", JSON.stringify({}));
      return;
    }

    const state = Object.fromEntries(
      notifications.map((item) => [item.id, item.read]),
    );
    localStorage.setItem("is_audit_notifications", JSON.stringify(state));
  }, [notifications]);

  const markAsRead = (id: string) => {
    setNotifications((items) =>
      items.map((item) => (item.id === id ? { ...item, read: true } : item)),
    );
  };

  const markAllAsRead = () => {
    setNotifications((items) => items.map((item) => ({ ...item, read: true })));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const handleNotificationClick = (item: NotificationItem) => {
    markAsRead(item.id);
    navigate(item.path);
  };

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedQuery = searchQuery.trim();
    const searchableRoutes = [
      "/audits",
      "/findings",
      "/checklist",
      "/capa",
      "/risks",
      "/assets",
      "/users",
      "/vendor-management",
    ];
    const targetRoute = searchableRoutes.includes(location.pathname)
      ? location.pathname
      : "/audits";

    navigate({
      pathname: targetRoute,
      search: trimmedQuery ? `?q=${encodeURIComponent(trimmedQuery)}` : "",
    });
  };

  const handleAccountAction = (path: string) => {
    navigate(path);
  };

  const handleSignOut = () => {
    logout();
    navigate("/login");
  };

  const toneStyles = {
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };

  const toneIcons = {
    warning: AlertTriangle,
    info: FileText,
    success: CheckCheck,
  };

  return (
    <header className="h-16 bg-white rounded-full shadow-[0_1px_3px_rgba(16,26,46,0.06),0_1px_2px_rgba(16,26,46,0.04)] flex items-center px-3 gap-3 shrink-0">
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2 rounded-full text-slate-500 hover:bg-slate-100 transition-colors"
        aria-label="Toggle menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      <form
        onSubmit={handleSearchSubmit}
        className="flex-1 max-w-sm hidden sm:block"
      >
        <Input
          icon={<Search className="w-4 h-4" />}
          type="text"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search audits, findings…"
          className="rounded-full bg-slate-50 border-transparent py-2 focus:bg-white"
        />
      </form>

      <div className="flex-1" />

      <DropdownMenu
        contentClassName="w-[22rem]"
        trigger={
          <button
            type="button"
            className="relative p-2.5 rounded-full text-slate-500 hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brass-500"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-[9px] text-white grid place-items-center font-medium">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        }
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <div>
            <p className="text-sm font-semibold text-slate-800">
              Notifications
            </p>
            <p className="text-[11px] text-slate-500">{unreadCount} unread</p>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-[11px] font-medium text-ink-700 hover:text-ink-900"
              >
                Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={clearAllNotifications}
                className="text-[11px] font-medium text-red-600 hover:text-red-700"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="px-4 py-5 text-sm text-slate-500">
              No active alerts
            </div>
          ) : (
            notifications.map((item) => {
              const Icon = toneIcons[item.tone];

              return (
                <DropdownMenuItem
                  key={item.id}
                  onSelect={() => handleNotificationClick(item)}
                  className={`w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors ${
                    item.read ? "bg-white" : "bg-slate-50"
                  }`}
                >
                  <div className="flex gap-3">
                    <div
                      className={`mt-0.5 rounded-lg border p-1.5 ${toneStyles[item.tone]}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {item.title}
                        </p>
                        {!item.read && (
                          <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-600 leading-5">
                        {item.message}
                      </p>
                      <p className="mt-1 text-[10px] text-slate-400">
                        {item.time}
                      </p>
                    </div>
                  </div>
                </DropdownMenuItem>
              );
            })
          )}
        </div>
      </DropdownMenu>

      <DropdownMenu
        contentClassName="w-72"
        trigger={
          <button
            type="button"
            className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 hover:bg-slate-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brass-500"
            aria-label="Account menu"
          >
            <div className="w-8 h-8 rounded-full bg-brass-500 flex items-center justify-center text-white">
              <User className="w-4 h-4" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-slate-800 leading-none">
                {user?.name || "User"}
              </p>
              <p className="text-[10px] text-slate-400 leading-none mt-0.5">
                {user?.role || "Viewer"}
              </p>
            </div>
            <ChevronDown className="hidden sm:block w-4 h-4 text-slate-400" />
          </button>
        }
      >
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-800">
                {user?.name || "User"}
              </p>
              <p className="text-[11px] text-slate-500">
                {user?.email || "No email provided"}
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-brass-100 px-2 py-1 text-[10px] font-medium text-brass-700">
              <ShieldCheck className="w-3 h-3" />
              {user?.role || "Viewer"}
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-600">
            {roleDefinition.access}
          </p>
        </div>

        <div className="p-2">
          <div className="mb-2 px-2 py-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Quick actions
            </p>
          </div>

          {roleDefinition.menuActions.map((action) => (
            <DropdownMenuItem
              key={action.label}
              onSelect={() => handleAccountAction(action.path)}
              className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
            >
              <p className="text-sm font-medium text-slate-700">
                {action.label}
              </p>
              <p className="text-[11px] text-slate-500">{action.description}</p>
            </DropdownMenuItem>
          ))}

          <div className="mt-2 border-t border-slate-200 pt-2">
            <DropdownMenuItem
              onSelect={handleSignOut}
              className="flex items-center justify-between px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
            >
              <span className="text-sm font-medium">Sign out</span>
              <LogOut className="w-4 h-4" />
            </DropdownMenuItem>
          </div>
        </div>
      </DropdownMenu>
    </header>
  );
};

export default Header;
