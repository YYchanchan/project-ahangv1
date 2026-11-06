import type {
  Animal,
  CandleStat,
  MemorialCommentRecord,
  ProfileStats,
  PublicMemoryRecord,
  Species,
  TaskChallenge,
  User,
  UserRole,
  UserStatus,
} from "../src/types";

export type SubmissionType =
  | "recommend"
  | "observation"
  | "memory"
  | "correction"
  | "archive"
  | "task";

export type CollaborationTask = TaskChallenge;

export type SubmissionStatus =
  | "pending"
  | "approved"
  | "need_supplement"
  | "rejected";

export interface SubmissionRecord {
  id: string;
  userId: string;
  submitterName: string;
  type: SubmissionType;
  animalId?: string;
  animalName: string;
  title: string;
  details: string;
  payload: Record<string, unknown>;
  mediaUrl?: string;
  source?: string;
  copyright?: string;
  status: SubmissionStatus;
  statusLabel: string;
  adminComment: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewerName?: string;
}

export interface ReviewInput {
  status: Exclude<SubmissionStatus, "pending">;
  comment: string;
}

export interface AdminStats {
  pending: number;
  today: number;
  approvedThisMonth: number;
  animalCount: number;
}

export interface ReviewLog {
  id: string;
  operator: string;
  action: string;
  targetType: string;
  targetId: string;
  createdAt: string;
}

export interface UserUpdateInput {
  role?: UserRole;
  status?: UserStatus;
}

export interface WechatUserInput {
  openid: string;
  unionid?: string;
  nickname?: string;
  avatarUrl?: string;
}

export interface WechatProfileInput {
  nickname?: string;
  avatarUrl?: string;
}

export interface Store {
  initialize(): Promise<void>;
  close(): Promise<void>;
  getUser(id: string): Promise<User | null>;
  upsertWechatUser(input: WechatUserInput): Promise<User>;
  updateWechatProfile(userId: string, input: WechatProfileInput): Promise<User | null>;
  authenticateAdmin(username: string, password: string): Promise<User | null>;
  listAnimals(filters?: { search?: string; status?: string; userId?: string }): Promise<Animal[]>;
  getAnimal(id: string, userId?: string): Promise<Animal | null>;
  saveAnimal(animal: Animal, operatorId: string): Promise<Animal>;
  deleteAnimal(id: string, operatorId: string): Promise<boolean>;
  listSpecies(search?: string): Promise<Species[]>;
  getSpecies(id: string): Promise<Species | null>;
  saveSpecies(species: Species, operatorId: string): Promise<Species>;
  deleteSpecies(id: string, operatorId: string): Promise<boolean>;
  listMemories(animalId?: string, userId?: string): Promise<PublicMemoryRecord[]>;
  setMemoryLike(userId: string, memoryId: string, liked: boolean): Promise<{ likes: number; hasLiked: boolean }>;
  saveMemory(memory: PublicMemoryRecord, operatorId: string): Promise<PublicMemoryRecord>;
  deleteMemory(id: string, operatorId: string): Promise<boolean>;
  listMemorialComments(animalId?: string, userId?: string): Promise<MemorialCommentRecord[]>;
  createMemorialComment(user: User, animalId: string, text: string): Promise<MemorialCommentRecord>;
  setCommentFlower(userId: string, commentId: string, flowered: boolean): Promise<{ flowers: number; hasFlowered: boolean }>;
  listTasks(): Promise<CollaborationTask[]>;
  saveTask(task: CollaborationTask, operatorId: string): Promise<CollaborationTask>;
  deleteTask(id: string, operatorId: string): Promise<boolean>;
  listFavorites(userId: string): Promise<Animal[]>;
  setFavorite(userId: string, animalId: string, favorite: boolean): Promise<boolean>;
  lightCandle(userId: string, animalId: string): Promise<{ count: number; alreadyLit: boolean }>;
  listCandleStats(userId?: string): Promise<CandleStat[]>;
  setObservationLike(userId: string, animalId: string, observationId: string, liked: boolean): Promise<{ likes: number; hasLiked: boolean }>;
  getProfileStats(userId: string): Promise<ProfileStats>;
  saveMedia(userId: string, file: {
    originalName: string;
    mimeType: string;
    size: number;
    storagePath: string;
    publicUrl: string;
  }): Promise<string>;
  getMedia(id: string): Promise<{
    originalName: string;
    mimeType: string;
    size: number;
    storagePath?: string;
    publicUrl?: string;
    data?: Buffer;
  } | null>;
  createSubmission(
    user: User,
    input: {
      type: SubmissionType;
      animalId?: string;
      animalName?: string;
      title: string;
      details: string;
      payload: Record<string, unknown>;
      mediaUrl?: string;
      source?: string;
      copyright?: string;
    },
  ): Promise<SubmissionRecord>;
  listUserSubmissions(userId: string): Promise<SubmissionRecord[]>;
  listAdminSubmissions(filters?: {
    status?: SubmissionStatus;
    type?: SubmissionType;
  }): Promise<SubmissionRecord[]>;
  reviewSubmission(
    id: string,
    reviewer: User,
    input: ReviewInput,
  ): Promise<SubmissionRecord | null>;
  getAdminStats(): Promise<AdminStats>;
  listUsers(search?: string): Promise<User[]>;
  updateUser(id: string, update: UserUpdateInput, operatorId: string): Promise<User | null>;
  listReviewLogs(): Promise<ReviewLog[]>;
}

export function submissionStatusLabel(status: SubmissionStatus): string {
  const labels: Record<SubmissionStatus, string> = {
    pending: "待审核",
    approved: "已通过",
    need_supplement: "需补充",
    rejected: "已退回",
  };
  return labels[status];
}
