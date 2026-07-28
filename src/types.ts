export type UserRole = "guest" | "contributor" | "reviewer" | "admin";

export type UserStatus = "active" | "pending" | "suspended";

export interface User {
  id: string;
  nickname: string;
  avatarUrl: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  lastLoginAt?: string;
  agreementAcceptedAt?: string;
}

export interface AnimalTimelineEvent {
  year: string;
  title: string;
  description: string;
}

export interface ObservationRecord {
  id: string;
  username: string;
  avatar: string;
  date: string;
  location: string;
  text: string;
  image?: string;
  likes: number;
  commentsCount: number;
  hasLiked?: boolean;
  category: "resting" | "feeding" | "playing" | "moving" | "all";
}

export interface BiologicalProfile {
  chineseName: string;
  englishName: string;
  latinName: string;
  kingdom: string; // 界 e.g. Animalia（动物界）
  phylum: string;  // 门 e.g. Chordata（脊索动物门）
  className: string; // 纲 e.g. Mammalia（哺乳纲）
  order: string;     // 目 e.g. Carnivora（食肉目）
  family: string;    // 科 e.g. Felidae（猫科）
  genus: string;     // 属 e.g. Panthera（豹属）
  species: string;   // 种 e.g. Panthera leo
}

export interface BasicInfo {
  wildLifespan?: string;
  captiveLifespan: string;
  weight: string;
  sizeHeight: string; // e.g. 肩高/体长
  diet: string;
  socialStructure: string;
  activityTime: string;
  reproduction: string;
  distribution: string;
  habitat: string;
  iucnStatus: string;
  citesStatus: string;
}

export interface SpeciesCharacteristic {
  title: string;
  description: string;
}

export interface SpeciesFAQ {
  q: string;
  a: string;
}

export interface ExtendedReading {
  congeneric: string[];
  confamilial: string[];
  articles: string[];
  courses: string[];
  videos: string[];
  creativeProducts: string[];
}

export interface WildVsZooItem {
  title: string;
  wild: string;
  zoo: string;
}

export interface Species {
  id: string; // e.g. "african-lion"
  biologicalProfile: BiologicalProfile;
  basicInfo: BasicInfo;
  characteristics: SpeciesCharacteristic[];
  faqs: SpeciesFAQ[];
  extendedReading: ExtendedReading;
  wildVsZoo?: WildVsZooItem[];
}

export interface AnimalRelationship {
  partnerId: string;
  relationType: string;
  description: string;
}

export interface AnimalRelationshipItem {
  type: string;
  animalId: string;
  label: string;
  description: string;
}

export interface Animal {
  id: string;
  name: string;
  nickname: string;
  species: string; // e.g. "African Lion", "Asian Elephant", etc.
  scientificName: string;
  speciesCode: string;
  image: string;
  imageType: "official_photo" | "species_photo" | "illustration" | "placeholder" | "real";
  status: "in_zoo" | "retired" | "transferred" | "deceased" | "on_trip" | "need_info";
  institution: string;
  city: string;

  // Additional fields for preserving app compatibility without rewriting the entire app
  gender: "雄性" | "雌性" | "未知";
  birthYear?: string;
  birthDate?: string;
  birthPlace?: string;
  rescueYear?: string;
  origin?: string;
  arrivalYear?: number | string;
  father?: string;
  mother?: string;
  sibling?: string;
  aliases?: string[];
  deathMonth?: string;
  deathReason?: string;
  deathDate?: string;
  lifeSpan: string;
  statusLabel: string;
  tags: string[];
  description: string;
  timeline: AnimalTimelineEvent[];
  observations: ObservationRecord[];
  verified: boolean;
  verifiedCount: number;
  memorialEnabled?: boolean;
  summary?: string;
  infoStatus?: string;
  recordCount?: number;
  gallery?: string[];
  isTestData?: boolean;
  relationship?: AnimalRelationship;
  relationships?: AnimalRelationshipItem[];

  // Backward compatibility aliases if any component accesses these old fields
  zoo?: string;
  coverUrl?: string;
  speciesId?: string;
  commonName?: string;
  englishName?: string;
}

export interface Contribution {
  id: string;
  type: "recommend" | "observation" | "supplement";
  title: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
  statusLabel: string;
  details: string;
}

export interface TaskChallenge {
  id: string;
  title: string;
  rewardLabel: string;
  progressText: string;
  actionText: string;
}
