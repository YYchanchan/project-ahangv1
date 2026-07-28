import { UserRole } from "../types";

export function canSubmit(role: UserRole): boolean {
  return role === "contributor" || role === "reviewer" || role === "admin";
}

export function canViewReviewerWorkspace(role: UserRole): boolean {
  return role === "reviewer" || role === "admin";
}

export function canReview(role: UserRole): boolean {
  return role === "reviewer" || role === "admin";
}

export function canViewAdminPanel(role: UserRole): boolean {
  return role === "admin";
}

export function canManageUsers(role: UserRole): boolean {
  return role === "admin";
}

export function canEditOfficialAnimal(role: UserRole): boolean {
  return role === "admin";
}

export function canDeleteOfficialAnimal(role: UserRole): boolean {
  return role === "admin";
}

export type PermissionKey =
  | "submit"
  | "viewReviewerWorkspace"
  | "review"
  | "viewAdminPanel"
  | "manageUsers"
  | "editOfficialAnimal"
  | "deleteOfficialAnimal";

export function hasPermission(role: UserRole, permission: PermissionKey): boolean {
  switch (permission) {
    case "submit":
      return canSubmit(role);
    case "viewReviewerWorkspace":
      return canViewReviewerWorkspace(role);
    case "review":
      return canReview(role);
    case "viewAdminPanel":
      return canViewAdminPanel(role);
    case "manageUsers":
      return canManageUsers(role);
    case "editOfficialAnimal":
      return canEditOfficialAnimal(role);
    case "deleteOfficialAnimal":
      return canDeleteOfficialAnimal(role);
    default:
      return false;
  }
}
