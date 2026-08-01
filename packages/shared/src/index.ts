import { z } from "zod";

export const UserRole = z.enum(["STUDENT", "TEACHER"]);
export type UserRole = z.infer<typeof UserRole>;

// ============================================
// AUTH
// ============================================

export const RegisterSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required"),
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof LoginSchema>;

// ============================================
// PROFILE
// ============================================

export const OnboardingSchema = z.object({
  displayName: z.string().min(1, "Display name is required").max(50),
  bio: z.string().max(200).optional(),
  role: UserRole,
});
export type OnboardingInput = z.infer<typeof OnboardingSchema>;

export const ProfileSchema = z.object({
  id: z.string(),
  userId: z.string(),
  displayName: z.string(),
  bio: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  xp: z.number(),
  level: z.number(),
  onboardingDone: z.boolean(),
  role: UserRole,
  createdAt: z.string(),
});
export type Profile = z.infer<typeof ProfileSchema>;

// ============================================
// SUBJECT
// ============================================

export const CreateSubjectSchema = z.object({
  name: z.string().min(1, "Subject name is required"),
  grade: z.string().min(1, "Grade is required"),
  scope: z.string().optional(),
});
export type CreateSubjectInput = z.infer<typeof CreateSubjectSchema>;

export const SubjectSchema = z.object({
  id: z.string(),
  profileId: z.string(),
  name: z.string(),
  grade: z.string(),
  scope: z.string().nullable(),
  createdAt: z.string(),
});
export type Subject = z.infer<typeof SubjectSchema>;

// ============================================
// TOPIC
// ============================================

export const TopicStatusEnum = z.enum(["NOT_STARTED", "IN_PROGRESS", "MASTERED"]);
export type TopicStatus = z.infer<typeof TopicStatusEnum>;

export const CreateTopicSchema = z.object({
  name: z.string().min(1, "Topic name is required"),
});
export type CreateTopicInput = z.infer<typeof CreateTopicSchema>;

export const UpdateTopicSchema = z.object({
  status: TopicStatusEnum.optional(),
  progress: z.number().min(0).max(100).optional(),
});
export type UpdateTopicInput = z.infer<typeof UpdateTopicSchema>;

export const TopicSchema = z.object({
  id: z.string(),
  subjectId: z.string(),
  name: z.string(),
  status: TopicStatusEnum,
  progress: z.number(),
  explanation: z.string().nullable().optional(),
  suggestions: z.array(z.object({
    name: z.string(),
    description: z.string(),
    connection: z.string(),
  })).nullable().optional(),
  createdAt: z.string(),
});
export type Topic = z.infer<typeof TopicSchema>;

// ============================================
// ASSIGNMENT
// ============================================

export const CreateAssignmentSchema = z.object({
  subjectId: z.string(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional(),
});
export type CreateAssignmentInput = z.infer<typeof CreateAssignmentSchema>;

export const QuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  answer: z.string(),
});
export type Question = z.infer<typeof QuestionSchema>;

export const SubmissionStatusEnum = z.enum(["SUBMITTED", "AI_GRADED", "TEACHER_REVIEWED"]);
export type SubmissionStatus = z.infer<typeof SubmissionStatusEnum>;

export const AssignmentSubmissionSchema = z.object({
  id: z.string(),
  assignmentId: z.string(),
  profileId: z.string(),
  content: z.string(),
  aiScore: z.number().nullable(),
  aiFeedback: z.string().nullable(),
  teacherScore: z.number().nullable(),
  teacherComment: z.string().nullable(),
  status: SubmissionStatusEnum,
  submittedAt: z.string(),
  gradedAt: z.string().nullable(),
});
export type AssignmentSubmission = z.infer<typeof AssignmentSubmissionSchema>;

export const AssignmentSchema = z.object({
  id: z.string(),
  subjectId: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  content: z.object({ questions: z.array(QuestionSchema) }),
  createdAt: z.string(),
  subject: z.object({ name: z.string(), grade: z.string() }).optional(),
  submission: AssignmentSubmissionSchema.nullable().optional(),
});
export type Assignment = z.infer<typeof AssignmentSchema>;

export const GenerateAssignmentSchema = z.object({
  subjectId: z.string(),
  topicId: z.string(),
});
export type GenerateAssignmentInput = z.infer<typeof GenerateAssignmentSchema>;

export const SubmitAssignmentAnswersSchema = z.object({
  answers: z.record(z.string(), z.string()),
});
export type SubmitAssignmentAnswersInput = z.infer<typeof SubmitAssignmentAnswersSchema>;

export const SubmitAssignmentSchema = z.object({
  content: z.string().min(1, "Submission content is required"),
});
export type SubmitAssignmentInput = z.infer<typeof SubmitAssignmentSchema>;

// ============================================
// AI CHAT
// ============================================

export const AiChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  timestamp: z.string().datetime(),
  topicId: z.string().optional(),
});
export type AiChatMessage = z.infer<typeof AiChatMessageSchema>;

export const SendAiMessageSchema = z.object({
  subjectId: z.string(),
  message: z.string().min(1, "Message is required"),
  topicId: z.string().optional(),
});
export type SendAiMessageInput = z.infer<typeof SendAiMessageSchema>;

// ============================================
// CLASSES
// ============================================

export const CreateClassSchema = z.object({
  name: z.string().min(1, "Class name is required"),
});
export type CreateClassInput = z.infer<typeof CreateClassSchema>;

export const JoinClassSchema = z.object({
  inviteCode: z.string().min(1, "Invite code is required"),
});
export type JoinClassInput = z.infer<typeof JoinClassSchema>;

export const ClassMemberSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  avatarUrl: z.string().nullable(),
  role: z.string(),
  joinedAt: z.string(),
});
export type ClassMember = z.infer<typeof ClassMemberSchema>;

export const ClassInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  inviteCode: z.string(),
  teacherId: z.string(),
  teacherName: z.string(),
  memberCount: z.number(),
  userRole: z.enum(["TEACHER", "MEMBER"]),
  createdAt: z.string(),
});
export type ClassInfo = z.infer<typeof ClassInfoSchema>;

// ============================================
// CHAT (student-to-student)
// ============================================

export const SendMessageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty"),
});
export type SendMessageInput = z.infer<typeof SendMessageSchema>;

// ============================================
// PEER TUTORING
// ============================================

export const TutoringTypeEnum = z.enum(["TEACH", "LEARN"]);
export type TutoringType = z.infer<typeof TutoringTypeEnum>;

export const TutoringStatusEnum = z.enum(["OPEN", "MATCHED", "CLOSED"]);
export type TutoringStatus = z.infer<typeof TutoringStatusEnum>;

export const CreateTutoringOfferSchema = z.object({
  topic: z.string().min(1, "Subject is required"),
  grade: z.string().min(1, "Grade is required"),
});
export type CreateTutoringOfferInput = z.infer<typeof CreateTutoringOfferSchema>;

export const CreateTutoringRequestSchema = z.object({
  topic: z.string().min(1, "Subject is required"),
  grade: z.string().min(1, "Grade is required"),
});
export type CreateTutoringRequestInput = z.infer<typeof CreateTutoringRequestSchema>;

export const TutoringRequestSchema = z.object({
  id: z.string(),
  requesterId: z.string(),
  tutorId: z.string().nullable(),
  type: TutoringTypeEnum,
  topic: z.string(),
  grade: z.string().nullable(),
  description: z.string().nullable(),
  status: TutoringStatusEnum,
  createdAt: z.string(),
  resolvedAt: z.string().nullable(),
  pairedId: z.string().nullable(),
  requester: z.object({ id: z.string(), displayName: z.string(), avatarUrl: z.string().nullable() }).optional(),
  tutor: z.object({ id: z.string(), displayName: z.string(), avatarUrl: z.string().nullable() }).optional(),
});
export type TutoringRequest = z.infer<typeof TutoringRequestSchema>;

// ============================================
// TEACHER ANALYTICS
// ============================================

export const ClassAnalyticsSchema = z.object({
  class: z.object({ id: z.string(), name: z.string(), inviteCode: z.string(), memberCount: z.number() }),
  assignments: z.number(),
  submissions: z.number(),
  avgAiScore: z.number().nullable(),
  avgTeacherScore: z.number().nullable(),
  atRiskCount: z.number(),
});
export type ClassAnalytics = z.infer<typeof ClassAnalyticsSchema>;

export const SubmissionReviewSchema = z.object({
  id: z.string(),
  assignmentTitle: z.string(),
  studentName: z.string(),
  content: z.string(),
  aiScore: z.number().nullable(),
  aiFeedback: z.string().nullable(),
  teacherScore: z.number().nullable(),
  teacherComment: z.string().nullable(),
  status: SubmissionStatusEnum,
  submittedAt: z.string(),
});
export type SubmissionReview = z.infer<typeof SubmissionReviewSchema>;

export const StudentSummarySchema = z.object({
  profileId: z.string(),
  displayName: z.string(),
  avatarUrl: z.string().nullable(),
  level: z.number(),
  xp: z.number(),
  subjects: z.number(),
  topicsMastered: z.number(),
  avgAssignmentScore: z.number().nullable(),
  burnoutScore: z.number().nullable(),
  atRisk: z.boolean(),
});
export type StudentSummary = z.infer<typeof StudentSummarySchema>;

export const StudentDetailSchema = z.object({
  profile: z.object({ id: z.string(), displayName: z.string(), avatarUrl: z.string().nullable(), level: z.number(), xp: z.number(), bio: z.string().nullable() }),
  subjects: z.array(z.object({
    id: z.string(),
    name: z.string(),
    grade: z.string(),
    topicsTotal: z.number(),
    topicsMastered: z.number(),
    averageProgress: z.number(),
  })),
  assignments: z.array(z.object({
    id: z.string(),
    title: z.string(),
    subjectName: z.string(),
    aiScore: z.number().nullable(),
    teacherScore: z.number().nullable(),
    status: SubmissionStatusEnum,
    submittedAt: z.string(),
  })),
  burnoutAlerts: z.array(z.object({ id: z.string(), score: z.number(), message: z.string(), resolved: z.boolean(), createdAt: z.string() })),
});
export type StudentDetail = z.infer<typeof StudentDetailSchema>;

// ============================================
// BURNOUT
// ============================================

export const BurnoutAlertSchema = z.object({
  id: z.string(),
  profileId: z.string(),
  alertType: z.string(),
  message: z.string(),
  score: z.number(),
  resolved: z.boolean(),
  createdAt: z.string(),
});
export type BurnoutAlert = z.infer<typeof BurnoutAlertSchema>;

export const BurnoutScanResultSchema = z.object({
  scanned: z.number(),
  alertsCreated: z.number(),
});
export type BurnoutScanResult = z.infer<typeof BurnoutScanResultSchema>;

export const ResolveBurnoutSchema = z.object({
  resolved: z.boolean().optional(),
});
export type ResolveBurnoutInput = z.infer<typeof ResolveBurnoutSchema>;

// ============================================
// GAMIFICATION
// ============================================

export const StudySessionHeartbeatSchema = z.object({
  topicId: z.string().min(1, "Topic is required"),
});
export type StudySessionHeartbeatInput = z.infer<typeof StudySessionHeartbeatSchema>;

export const StudySessionSchema = z.object({
  id: z.string(),
  profileId: z.string(),
  topicId: z.string(),
  topicName: z.string(),
  subjectName: z.string(),
  durationMinutes: z.number(),
  xpEarned: z.number(),
  startedAt: z.string(),
  endedAt: z.string().nullable(),
  active: z.boolean(),
});
export type StudySession = z.infer<typeof StudySessionSchema>;

export const XpResultSchema = z.object({
  xpAwarded: z.number(),
  totalXp: z.number(),
  level: z.number(),
  leveledUp: z.boolean(),
  sessionId: z.string().optional(),
  durationMinutes: z.number().optional(),
});
export type XpResult = z.infer<typeof XpResultSchema>;

export const XpTransactionSchema = z.object({
  id: z.string(),
  amount: z.number(),
  reason: z.string(),
  refId: z.string().nullable(),
  createdAt: z.string(),
});
export type XpTransaction = z.infer<typeof XpTransactionSchema>;

export const LeaderboardEntrySchema = z.object({
  profileId: z.string(),
  displayName: z.string(),
  avatarUrl: z.string().nullable(),
  level: z.number(),
  xp: z.number(),
  topicsMastered: z.number(),
  rank: z.number(),
  isYou: z.boolean(),
});
export type LeaderboardEntry = z.infer<typeof LeaderboardEntrySchema>;

export const LeaderboardResponseSchema = z.object({
  entries: z.array(LeaderboardEntrySchema),
  yourRank: z.number().nullable(),
});
export type LeaderboardResponse = z.infer<typeof LeaderboardResponseSchema>;

// ============================================
// API RESPONSES
// ============================================

export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
  });

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

// ============================================
// XP / LEVEL HELPERS
// ============================================

export type LevelProgress = {
  level: number;
  xpIntoLevel: number;
  xpForCurrentLevel: number;
  nextLevelAt: number;
  progress: number; // 0-100
};

export function levelFromXp(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

export function xpThreshold(level: number): number {
  return 100 * level * level;
}

export function levelProgress(xp: number): LevelProgress {
  const level = levelFromXp(xp);
  const currentLevelAt = xpThreshold(level - 1);
  const nextLevelAt = xpThreshold(level);
  const xpIntoLevel = xp - currentLevelAt;
  const span = nextLevelAt - currentLevelAt;
  return {
    level,
    xpIntoLevel,
    xpForCurrentLevel: currentLevelAt,
    nextLevelAt,
    progress: span > 0 ? Math.round((xpIntoLevel / span) * 100) : 100,
  };
}
