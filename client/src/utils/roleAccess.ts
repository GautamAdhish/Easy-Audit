export type UserRole = "Admin" | "Lead Auditor" | "Auditor" | "Viewer";

export type AccountAction = {
  label: string;
  path: string;
  description: string;
};

export type RoleDefinition = {
  label: string;
  access: string;
  summary: string;
  menuActions: AccountAction[];
  navPaths: string[];
};

export const ROLE_DEFINITIONS: Record<UserRole, RoleDefinition> = {
  Admin: {
    label: "Admin",
    access: "Highest Access",
    summary:
      "Can create and delete user accounts and assign roles and view other companies as well.",
    menuActions: [
      {
        label: "Manage Users",
        path: "/users",
        description: "Create, remove, and assign user roles",
      },
      {
        label: "Company Overview",
        path: "/dashboard",
        description: "Review the full portfolio across companies",
      },
      {
        label: "Reports",
        path: "/reports",
        description: "Open all report views",
      },
    ],
    navPaths: [
      "/dashboard",
      "/audit-program",
      "/audits",
      "/checklist",
      "/findings",
      "/capa",
      "/risks",
      "/evidence",
      "/assets",
      "/reports",
      "/summary",
      "/users",
      "/settings",
    ],
  },
  "Lead Auditor": {
    label: "Lead Auditor",
    access: "Lower access than Admin",
    summary:
      "Can assign roles (Auditor or Viewer) and create and assign teams.",
    menuActions: [
      {
        label: "Assign Roles",
        path: "/users",
        description: "Manage Auditor and Viewer access",
      },
      {
        label: "Teams",
        path: "/audit-program",
        description: "Create and assign teams",
      },
      {
        label: "Reports",
        path: "/reports",
        description: "Review audit reports",
      },
    ],
    navPaths: [
      "/dashboard",
      "/audit-program",
      "/audits",
      "/checklist",
      "/findings",
      "/capa",
      "/risks",
      "/evidence",
      "/assets",
      "/reports",
      "/summary",
      "/users",
    ],
  },
  Auditor: {
    label: "Auditor",
    access: "Can generate and view reports, edits and logs",
    summary: "Can only generate and view reports, edits and logs.",
    menuActions: [
      {
        label: "Reports",
        path: "/reports",
        description: "Generate and review audit reports",
      },
      {
        label: "Edit Records",
        path: "/audits",
        description: "Update audit records and findings",
      },
      {
        label: "Activity Log",
        path: "/dashboard",
        description: "Review recent changes and status updates",
      },
    ],
    navPaths: [
      "/dashboard",
      "/audit-program",
      "/audits",
      "/checklist",
      "/findings",
      "/capa",
      "/risks",
      "/evidence",
      "/assets",
      "/reports",
      "/summary",
    ],
  },
  Viewer: {
    label: "Viewer",
    access: "View only",
    summary: "Can only view reports.",
    menuActions: [
      {
        label: "View Reports",
        path: "/reports",
        description: "Open shared report views only",
      },
    ],
    navPaths: ["/dashboard", "/reports"],
  },
};

export const normalizeRole = (role?: string): UserRole => {
  if (role === "Admin") return "Admin";
  if (role === "Lead Auditor") return "Lead Auditor";
  if (role === "Auditor") return "Auditor";
  return "Viewer";
};

export const getRoleDefinition = (role?: string): RoleDefinition =>
  ROLE_DEFINITIONS[normalizeRole(role)];
