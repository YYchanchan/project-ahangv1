import { User } from "../types";

export const mockGuestUser: User = {
  id: "user-guest-001",
  nickname: "游客",
  avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150",
  role: "guest",
  status: "active",
  createdAt: "2026-01-01T00:00:00Z",
};

export const mockContributorUser: User = {
  id: "user-contributor-001",
  nickname: "Yy Chan",
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150",
  role: "contributor",
  status: "active",
  createdAt: "2025-06-15T10:30:00Z",
  lastLoginAt: "2026-07-22T08:00:00Z",
  agreementAcceptedAt: "2025-06-15T10:35:00Z",
};

export const mockReviewerUser: User = {
  id: "user-reviewer-001",
  nickname: "审核员01",
  avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150",
  role: "reviewer",
  status: "active",
  createdAt: "2025-01-10T09:00:00Z",
  lastLoginAt: "2026-07-22T08:15:00Z",
  agreementAcceptedAt: "2025-01-10T09:05:00Z",
};

export const mockAdminUser: User = {
  id: "user-admin-001",
  nickname: "管理员01",
  avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150",
  role: "admin",
  status: "active",
  createdAt: "2024-12-01T08:00:00Z",
  lastLoginAt: "2026-07-22T08:30:00Z",
  agreementAcceptedAt: "2024-12-01T08:05:00Z",
};

export const mockUsers: User[] = [
  mockGuestUser,
  mockContributorUser,
  mockReviewerUser,
  mockAdminUser,
];
