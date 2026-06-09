export type Role = "user" | "advisor" | "admin" | "sub_admin";
export type UserStatus =
  | "active"
  | "suspended"
  | "deactivated"
  | "pending_verification";

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  status: UserStatus;
  profilePhoto?: string;
  country?: string;
  city?: string;
  currency?: string;
  /** Legacy free-text label; still used as the sub-admin role label. */
  location?: string;
  permissions?: string[];
  isVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
}

export interface PaginationMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

export interface Wallet {
  _id: string;
  user: string;
  balance: number;
  freeCredits: number;
  earningsBalance?: number;
  pendingPayouts?: number;
  totalWithdrawn?: number;
}

export interface UserListItem extends AdminUser {
  wallet?: Wallet | null;
  activeSubscription?: {
    _id: string;
    user: string;
    plan?: string;
    planName?: string;
    status: string;
  } | null;
  sessionsCount?: number;
  payments?: number;
}

export interface UserDetailsResponse {
  user: AdminUser;
  wallet?: Wallet | null;
  sessionsCount?: number;
  totalSpent?: number;
  activeSubscription?: { plan?: { name: string } | string; planName?: string } | null;
  recentSessions?: SessionItem[];
}

export interface AdvisorPricing {
  chatPerMin?: number;
  callPerMin?: number;
  videoPerMin?: number;
}

export interface AdvisorProfile {
  _id: string;
  user: string;
  professionalTitle?: string;
  bio?: string;
  detailedDescription?: string;
  yearsOfExperience?: string | number;
  expertise?: string[];
  styles?: string[];
  languages?: string[];
  introVideoUrl?: string;
  pricing?: AdvisorPricing;
  avgRating?: number;
  ratingsCount?: number;
  tier?: "bronze" | "silver" | "gold";
  totalSessions?: number;
  earnings?: number;
  retentionRate?: number;
  refundIndex?: number;
  weeklySchedule?: Record<string, { start?: string; end?: string }>;
}

export interface AdvisorListItem {
  user: AdminUser;
  profile?: AdvisorProfile | null;
}

export interface AdvisorApplication {
  _id: string;
  user: AdminUser & { profilePhoto?: string };
  stage:
    | "application"
    | "pre_recorded_interview"
    | "live_interview"
    | "contract"
    | "decision";
  status:
    | "new"
    | "under_review"
    | "interview_pending"
    | "scheduled"
    | "awaiting_signature"
    | "awaiting_approval"
    | "approved"
    | "rejected";
  professionalTitle?: string;
  bio?: string;
  yearsOfExperience?: string;
  expertise?: string[];
  styles?: string[];
  languages?: string[];
  introVideoUrl?: string;
  pricing?: AdvisorPricing;
  preRecordedAnswers?: Array<{ question: string; answer: string }>;
  liveInterview?: {
    scheduledAt?: string;
    roomName?: string;
    notes?: string;
  };
  contract?: {
    sentAt?: string;
    signedAt?: string;
    url?: string;
    signerName?: string;
    signerIp?: string;
    signatureImageUrl?: string;
    signedPdfUrl?: string;
  };
  rejectionReason?: string;
  createdAt: string;
}

export interface SessionItem {
  _id: string;
  sessionCode?: string;
  user?: AdminUser & { profilePhoto?: string };
  advisor?: AdminUser & { profilePhoto?: string };
  type?: "chat" | "call" | "video";
  status?:
    | "pending"
    | "live"
    | "completed"
    | "cancelled"
    | "disputed"
    | "flagged";
  duration?: number;
  actualDurationSec?: number;
  startedAt?: string;
  endedAt?: string;
  chargedAmount?: number;
  refundIssued?: number;
  cancelReason?: string;
  cancelledAt?: string;
  createdAt: string;
  recordingUrl?: string;
  egressId?: string;
  livekitRoom?: string;
}

export interface Complaint {
  _id: string;
  kind: "complain" | "safety_report";
  user?: AdminUser;
  advisor?: AdminUser;
  session?: { _id: string; sessionCode?: string; type?: string; chargedAmount?: number };
  issueType: string;
  description?: string;
  documents?: string[];
  status: "pending" | "reviewing" | "complete" | "rejected";
  resolutionNote?: string;
  createdAt: string;
}

export type DisputeStatus =
  | "open"
  | "investigating"
  | "resolved"
  | "rejected"
  | "cancelled";

export type DisputeResolution =
  | "full_refund"
  | "partial_refund"
  | "free_reschedule"
  | "assign_another_advisor"
  | "no_action";

export interface Dispute {
  _id: string;
  user?: AdminUser;
  advisor?: AdminUser;
  session?: { _id: string; sessionCode?: string; type?: string; chargedAmount?: number };
  disputeType: string;
  details?: string;
  expectedResolution: DisputeResolution;
  documents?: string[];
  status: DisputeStatus;
  refundAmount?: number;
  resolutionApplied?: DisputeResolution;
  resolutionNote?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface Transaction {
  _id: string;
  type: string;
  status: string;
  user?: AdminUser;
  advisor?: AdminUser;
  amount: number;
  description?: string;
  withdrawalStatus?: "requested" | "paid" | "rejected";
  createdAt: string;
}

export interface CountryPrice {
  country: string;       // ISO-3166 alpha-2
  currency?: string;     // optional; defaults to the country's currency
  pricePerMonth: number; // price in local currency units
}

export interface Plan {
  _id: string;
  name: string;
  description?: string;
  audienceLimit?: string;
  pricePerMonth: number; // base USD price
  countryPrices?: CountryPrice[];
  benefits: string[];
  isActive: boolean;
  sortOrder?: number;
}

export interface Currency {
  _id: string;
  country: string;       // ISO-3166 alpha-2
  countryName: string;
  currency: string;      // ISO-4217
  symbol: string;
  usdRate: number;       // units of `currency` per 1 USD
  roundTo: number;
  zeroDecimal?: boolean;
  isBase?: boolean;
  isActive: boolean;
  sortOrder?: number;
}

export interface Blog {
  _id: string;
  title: string;
  type?: string;
  content?: string;
  authorName?: string;
  authorTitle?: string;
  profilePicture?: string;
  thumbnail?: string;
  isPublished?: boolean;
  publishedAt?: string;
  createdAt: string;
  readMinutes?: number;
}

export interface Faq {
  _id: string;
  question: string;
  answer: string;
  isActive: boolean;
  sortOrder?: number;
}

export interface CmsPage {
  _id?: string;
  slug: string;
  title: string;
  content: string;
}

export interface ShowcaseReview {
  _id: string;
  rating: number;
  comment?: string;
  showcaseName?: string;
  showcaseLocation?: string;
  showcasePhoto?: string;
  isAdminShowcase: boolean;
  isFeaturedTestimonial?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface UserReview {
  _id: string;
  rating: number;
  comment?: string;
  sessionType?: string;
  createdAt: string;
  user?: { _id?: string; name?: string; profilePhoto?: string; email?: string };
  advisor?: { _id?: string; name?: string; profilePhoto?: string };
}

export interface Notification {
  _id: string;
  type: string;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
  read: boolean;
  readAt?: string;
  createdAt: string;
}

export interface ChatItem {
  _id: string;
  kind: "session" | "admin";
  participants: AdminUser[];
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCounts?: Record<string, number>;
}

export interface ChatMessage {
  _id: string;
  chat: string;
  sender: AdminUser | string;
  text?: string;
  attachments?: string[];
  readBy?: string[];
  createdAt: string;
}

export interface DashboardOverview {
  totals: {
    users: number;
    advisors: number;
    subscriptions: number;
    sessions: number;
    revenue: number;
  };
  usersByDay: Array<{ _id: number; count: number }>;
  advisorsByCategory: Array<{ _id: string | null; count: number }>;
  revenueByMonth: Array<{ _id: { y: number; m: number }; total: number }>;
  popularCategories: Array<{ _id: string | null; count: number }>;
  recentTransactions: Transaction[];
}

export interface FinanceOverview {
  monthlyRevenue: number;
  pendingPayouts: number;
  pendingPayoutsCount: number;
  platformCommission: number;
}

export interface Commissions {
  bronze: number;
  silver: number;
  gold: number;
}

export interface SubscriptionStats {
  totalUsers: number;
  totalRevenue: number;
  planDistribution: Array<{ _id: string; count: number }>;
  revenueByMonth: Array<{ _id: { y: number; m: number }; total: number }>;
}
