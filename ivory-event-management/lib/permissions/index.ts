// Mirrors docs/ROLE_PERMISSION_MATRIX.md. The database rules are the real enforcement;
// this file only helps the screens decide what to show.
export type OrgRole = "owner" | "admin" | "project_manager" | "team_member";
export const isAdmin = (r: OrgRole) => r === "owner" || r === "admin";
export const canManageEvents = (r: OrgRole) => r !== "team_member";
export const canInvite = isAdmin;
