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

export const SubmitAssignmentSchema = z.object({
  content: z.string().min(1, "Submission content is required"),
});
export type SubmitAssignmentInput = z.infer<typeof SubmitAssignmentSchema>;

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

// ============================================
// AI CHAT
// ============================================

export const AiChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  timestamp: z.string().datetime(),
});
export type AiChatMessage = z.infer<typeof AiChatMessageSchema>;

export const SendAiMessageSchema = z.object({
  subjectId: z.string(),
  message: z.string().min(1, "Message is required"),
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

// ============================================
// CHAT (student-to-student)
// ============================================

export const SendMessageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty"),
});
export type SendMessageInput = z.infer<typeof SendMessageSchema>;

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
