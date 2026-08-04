// Demo-only dataset. Mirrors the exact response shapes of the EduAI backend
// (see apps/server/src/routes/*). Served by lib/demo/index.ts when
// NEXT_PUBLIC_DEMO_MODE=true so the frontend runs without Docker/Postgres.

export type DemoRole = "STUDENT" | "TEACHER";

export type DemoProfile = {
  id: string;
  email: string;
  name: string;
  role: DemoRole;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  xp: number;
  level: number;
  onboardingDone: boolean;
  createdAt: string;
};

export type DemoTopic = {
  id: string;
  name: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "MASTERED";
  progress: number;
  explanation: string | null;
  suggestions: { name: string; description: string; connection: string }[] | null;
  createdAt: string;
};

export type DemoSubject = {
  id: string;
  profileId: string;
  name: string;
  grade: string;
  scope: string | null;
  createdAt: string;
  topic: DemoTopic[];
};

export type AiMsg = {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  topicId: string | null;
};

export type DemoQuestion = { id: string; question: string; answer: string; points?: number };

export type DemoSubmission = {
  profileId: string;
  status: "SUBMITTED" | "GRADED";
  teacherScore: number | null;
  teacherComment: string | null;
  aiScore: number | null;
  aiFeedback: string | null;
  content: string;
  submittedAt: string;
};

export type DemoAssignment = {
  id: string;
  title: string;
  description: string | null;
  subjectId: string;
  subjectName: string;
  subjectGrade: string;
  creatorId: string;
  classId: string | null;
  createdAt: string;
  dueDate: string | null;
  questions: DemoQuestion[];
  submissions: DemoSubmission[];
};

export type DemoClass = {
  id: string;
  name: string;
  inviteCode: string;
  teacherId: string;
  teacherName: string;
  createdAt: string;
  members: string[];
  assignmentIds: string[];
};

export type DemoMessage = {
  id: string;
  senderId: string;
  content: string;
  sentAt: string;
  read: boolean;
};

export type DemoConversation = {
  id: string;
  status: "ACTIVE" | "CLOSED";
  source: "MANUAL" | "PEER_TUTORING";
  profileIds: string[];
  createdAt: string;
  updatedAt: string;
  messages: DemoMessage[];
};

export type DemoTutoring = {
  id: string;
  requesterId: string;
  tutorId: string | null;
  type: "TEACH" | "LEARN";
  topic: string;
  grade: string | null;
  status: "OPEN" | "MATCHED" | "CLOSED";
  pairedId: string | null;
  createdAt: string;
};

export const DEMO_STUDENT_ID = "s-aiden";
export const DEMO_TEACHER_ID = "t-rivera";

// ---------------------------------------------------------------- profiles

export const PROFILES: Record<string, DemoProfile> = {
  [DEMO_TEACHER_ID]: {
    id: DEMO_TEACHER_ID,
    email: "teacher@demo.com",
    name: "Ms. Rivera",
    role: "TEACHER",
    displayName: "Ms. Rivera",
    bio: "Grade 7 & 8 Mathematics and Science teacher. I love helping students connect the dots.",
    avatarUrl: null,
    xp: 220,
    level: 2,
    onboardingDone: true,
    createdAt: "2026-01-12T09:00:00.000Z",
  },
  [DEMO_STUDENT_ID]: {
    id: DEMO_STUDENT_ID,
    email: "aiden@demo.com",
    name: "Aiden",
    role: "STUDENT",
    displayName: "Aiden",
    bio: "Gr 7 student who wants to get better at Math.",
    avatarUrl: null,
    xp: 480,
    level: 3,
    onboardingDone: true,
    createdAt: "2026-01-15T09:30:00.000Z",
  },
  "s-zoe": {
    id: "s-zoe",
    email: "zoe@demo.com",
    name: "Zoe",
    role: "STUDENT",
    displayName: "Zoe",
    bio: null,
    avatarUrl: null,
    xp: 450,
    level: 3,
    onboardingDone: true,
    createdAt: "2026-01-15T10:00:00.000Z",
  },
  "s-liam": {
    id: "s-liam",
    email: "liam@demo.com",
    name: "Liam",
    role: "STUDENT",
    displayName: "Liam",
    bio: null,
    avatarUrl: null,
    xp: 300,
    level: 2,
    onboardingDone: true,
    createdAt: "2026-01-16T08:20:00.000Z",
  },
  "s-sofia": {
    id: "s-sofia",
    email: "sofia@demo.com",
    name: "Sofia",
    role: "STUDENT",
    displayName: "Sofia",
    bio: null,
    avatarUrl: null,
    xp: 520,
    level: 3,
    onboardingDone: true,
    createdAt: "2026-01-16T11:45:00.000Z",
  },
  "s-olivia": {
    id: "s-olivia",
    email: "olivia@demo.com",
    name: "Olivia",
    role: "STUDENT",
    displayName: "Olivia",
    bio: null,
    avatarUrl: null,
    xp: 120,
    level: 2,
    onboardingDone: true,
    createdAt: "2026-01-17T09:10:00.000Z",
  },
  "s-maya": {
    id: "s-maya",
    email: "maya@demo.com",
    name: "Maya",
    role: "STUDENT",
    displayName: "Maya",
    bio: null,
    avatarUrl: null,
    xp: 380,
    level: 2,
    onboardingDone: true,
    createdAt: "2026-01-18T14:00:00.000Z",
  },
  "s-noah": {
    id: "s-noah",
    email: "noah@demo.com",
    name: "Noah",
    role: "STUDENT",
    displayName: "Noah",
    bio: null,
    avatarUrl: null,
    xp: 260,
    level: 2,
    onboardingDone: true,
    createdAt: "2026-01-18T15:30:00.000Z",
  },
  "s-ethan": {
    id: "s-ethan",
    email: "ethan@demo.com",
    name: "Ethan",
    role: "STUDENT",
    displayName: "Ethan",
    bio: null,
    avatarUrl: null,
    xp: 180,
    level: 2,
    onboardingDone: true,
    createdAt: "2026-01-19T10:15:00.000Z",
  },
};

export function profileById(id: string): DemoProfile | null {
  return PROFILES[id] ?? null;
}

// ----------------------------------------------------------------- subjects

const t = (
  id: string,
  name: string,
  status: DemoTopic["status"],
  progress: number,
  explanation?: string | null,
  suggestions?: DemoTopic["suggestions"]
): DemoTopic => ({
  id,
  name,
  status,
  progress,
  explanation: explanation ?? null,
  suggestions: suggestions ?? null,
  createdAt: "2026-02-01T10:00:00.000Z",
});

const SUGGEST_ALGEBRA: DemoTopic["suggestions"] = [
  { name: "Linear Equations", description: "Solve equations with a single variable like 2x + 5 = 15.", connection: "Builds directly on algebra basics." },
  { name: "Inequalities", description: "Compare expressions with <, >, and solution sets.", connection: "Uses the same balancing method as equations." },
  { name: "Word Problems", description: "Translate real-world situations into equations.", connection: "Applies algebra skills to everyday math." },
];

const SUGGEST_PERCENT: DemoTopic["suggestions"] = [
  { name: "Percent Change", description: "Calculate percentage increases and decreases.", connection: "Extends percent-of-number skills." },
  { name: "Simple Interest", description: "Work out interest earned on money over time.", connection: "Uses percent change in a financial context." },
];

const SUBJECTS: DemoSubject[] = [
  {
    id: "subj-t-math",
    profileId: DEMO_TEACHER_ID,
    name: "Mathematics",
    grade: "Grade 7",
    scope: "Algebra · Percentages",
    createdAt: "2026-02-02T09:00:00.000Z",
    topic: [
      t("topic-t-algebra", "Algebra Basics", "MASTERED", 100, "Algebra is the language of patterns. Variables stand in for unknown numbers, and expressions like 2x + 3 combine a coefficient, a variable, and a constant."),
      t("topic-t-percent", "Percentages", "MASTERED", 100, "A percentage is a fraction out of 100. To find 15% of a number, multiply the number by 0.15."),
      t("topic-t-geo", "Geometry Basics", "IN_PROGRESS", 55),
    ],
  },
  {
    id: "subj-t-sci",
    profileId: DEMO_TEACHER_ID,
    name: "Science",
    grade: "Grade 8",
    scope: "Biology · Physics",
    createdAt: "2026-02-02T09:30:00.000Z",
    topic: [
      t("topic-t-photo", "Photosynthesis", "MASTERED", 100, "Photosynthesis is how plants convert light energy, water and carbon dioxide into glucose and oxygen: 6CO2 + 6H2O + light → C6H12O6 + 6O2."),
      t("topic-t-newton", "Newton's Laws", "IN_PROGRESS", 70),
      t("topic-t-eco", "Ecosystems", "NOT_STARTED", 0),
    ],
  },
  {
    id: "subj-aiden-math",
    profileId: DEMO_STUDENT_ID,
    name: "Mathematics",
    grade: "Grade 7",
    scope: "Algebra · Percentages",
    createdAt: "2026-02-03T10:00:00.000Z",
    topic: [
      t("topic-aiden-algebra", "Algebra Basics", "MASTERED", 100, "Algebra uses variables to stand for unknown values. To solve x + 7 = 12, subtract 7 from both sides to get x = 5. Whatever you do to one side, do to the other.", SUGGEST_ALGEBRA),
      t("topic-aiden-percent", "Percentages", "IN_PROGRESS", 60, null, SUGGEST_PERCENT),
      t("topic-aiden-geo", "Geometry Basics", "NOT_STARTED", 0),
    ],
  },
  {
    id: "subj-aiden-sci",
    profileId: DEMO_STUDENT_ID,
    name: "Science",
    grade: "Grade 7",
    scope: "Biology",
    createdAt: "2026-02-03T10:30:00.000Z",
    topic: [
      t("topic-aiden-cells", "Cells & Tissues", "IN_PROGRESS", 40),
      t("topic-aiden-forces", "Forces & Motion", "NOT_STARTED", 0),
    ],
  },
  // Other students (used for classes, leaderboard, teacher drill-downs).
  {
    id: "subj-zoe-math",
    profileId: "s-zoe",
    name: "Mathematics",
    grade: "Grade 7",
    scope: null,
    createdAt: "2026-02-05T09:00:00.000Z",
    topic: [
      t("topic-zoe-algebra", "Algebra Basics", "MASTERED", 100),
      t("topic-zoe-percent", "Percentages", "IN_PROGRESS", 80),
      t("topic-zoe-geo", "Geometry Basics", "IN_PROGRESS", 30),
    ],
  },
  {
    id: "subj-liam-math",
    profileId: "s-liam",
    name: "Mathematics",
    grade: "Grade 7",
    scope: null,
    createdAt: "2026-02-06T09:00:00.000Z",
    topic: [
      t("topic-liam-algebra", "Algebra Basics", "MASTERED", 100),
      t("topic-liam-percent", "Percentages", "IN_PROGRESS", 45),
    ],
  },
  {
    id: "subj-sofia-math",
    profileId: "s-sofia",
    name: "Mathematics",
    grade: "Grade 7",
    scope: null,
    createdAt: "2026-02-06T10:00:00.000Z",
    topic: [
      t("topic-sofia-algebra", "Algebra Basics", "MASTERED", 100),
      t("topic-sofia-percent", "Percentages", "MASTERED", 100),
      t("topic-sofia-geo", "Geometry Basics", "IN_PROGRESS", 60),
    ],
  },
  {
    id: "subj-olivia-sci",
    profileId: "s-olivia",
    name: "Science",
    grade: "Grade 7",
    scope: null,
    createdAt: "2026-02-07T09:00:00.000Z",
    topic: [
      t("topic-olivia-cells", "Cells & Tissues", "IN_PROGRESS", 25),
    ],
  },
  {
    id: "subj-maya-sci",
    profileId: "s-maya",
    name: "Science",
    grade: "Grade 8",
    scope: null,
    createdAt: "2026-02-07T10:00:00.000Z",
    topic: [
      t("topic-maya-photo", "Photosynthesis", "MASTERED", 100),
      t("topic-maya-newton", "Newton's Laws", "IN_PROGRESS", 65),
    ],
  },
  {
    id: "subj-noah-sci",
    profileId: "s-noah",
    name: "Science",
    grade: "Grade 8",
    scope: null,
    createdAt: "2026-02-08T09:00:00.000Z",
    topic: [
      t("topic-noah-photo", "Photosynthesis", "IN_PROGRESS", 70),
      t("topic-noah-newton", "Newton's Laws", "NOT_STARTED", 0),
    ],
  },
  {
    id: "subj-ethan-sci",
    profileId: "s-ethan",
    name: "Science",
    grade: "Grade 8",
    scope: null,
    createdAt: "2026-02-08T10:00:00.000Z",
    topic: [
      t("topic-ethan-photo", "Photosynthesis", "IN_PROGRESS", 30),
    ],
  },
];

export const subjectsByProfile = (profileId: string): DemoSubject[] =>
  SUBJECTS.filter((s) => s.profileId === profileId);

export const subjectById = (id: string): DemoSubject | null => SUBJECTS.find((s) => s.id === id) ?? null;

// ---------------------------------------------------------------- AI history

export const AI_HISTORY: Record<string, AiMsg[]> = {
  "subj-aiden-math": [
    {
      role: "user",
      content: "Can you walk me through solving x + 7 = 12?",
      timestamp: "2026-07-20T10:05:00.000Z",
      topicId: "topic-aiden-algebra",
    },
    {
      role: "assistant",
      content:
        "Sure! The goal is to get x by itself. x + 7 = 12 → subtract 7 from both sides → x + 7 - 7 = 12 - 7 → x = 5. Check: 5 + 7 = 12. ✔",
      timestamp: "2026-07-20T10:05:08.000Z",
      topicId: "topic-aiden-algebra",
    },
    {
      role: "user",
      content: "How do I find 25% of 80?",
      timestamp: "2026-07-22T14:10:00.000Z",
      topicId: "topic-aiden-percent",
    },
    {
      role: "assistant",
      content:
        "Percent means out of 100. Convert 25% to a decimal (0.25) and multiply: 0.25 × 80 = 20. So 25% of 80 is 20.",
      timestamp: "2026-07-22T14:10:12.000Z",
      topicId: "topic-aiden-percent",
    },
    {
      role: "user",
      content: "What is a discount of 15% on a 60 AED shirt?",
      timestamp: "2026-07-24T16:45:00.000Z",
      topicId: "topic-aiden-percent",
    },
    {
      role: "assistant",
      content:
        "Find 15% of 60: 0.15 × 60 = 9 AED off. Final price = 60 - 9 = 51 AED. You can also think of it as paying 85% of the price: 0.85 × 60 = 51.",
      timestamp: "2026-07-24T16:45:15.000Z",
      topicId: "topic-aiden-percent",
    },
  ],
  "subj-aiden-sci": [
    {
      role: "user",
      content: "What's the difference between a plant cell and an animal cell?",
      timestamp: "2026-07-25T11:20:00.000Z",
      topicId: "topic-aiden-cells",
    },
    {
      role: "assistant",
      content:
        "Plant cells have a rigid cell wall, chloroplasts (for photosynthesis) and usually a large central vacuole. Animal cells have neither a cell wall nor chloroplasts, and their vacuoles are smaller.",
      timestamp: "2026-07-25T11:20:10.000Z",
      topicId: "topic-aiden-cells",
    },
  ],
  "subj-t-math": [
    {
      role: "user",
      content: "Help me plan a lesson on solving linear equations for Grade 7.",
      timestamp: "2026-07-18T09:00:00.000Z",
      topicId: "topic-t-algebra",
    },
    {
      role: "assistant",
      content:
        "Great topic! Suggested structure: (1) warm-up with balance puzzles, (2) introduce inverse operations with one-step equations, (3) guided practice on two-step equations, (4) a partner activity, (5) an exit ticket with 3 questions. Flag common error: subtracting terms from the wrong side.",
      timestamp: "2026-07-18T09:00:25.000Z",
      topicId: "topic-t-algebra",
    },
  ],
};

export const aiHistoryForSubject = (subjectId: string): AiMsg[] => AI_HISTORY[subjectId] ?? [];

// --------------------------------------------------------------- assignments

const A = (): string => '{"q1":"3x = 15, so x = 5","q2":"5x + 2 = 17 → 5x = 15 → x = 3","q3":"2(x + 4) = 20 → x + 4 = 10 → x = 6","q4":"y = 3x + 2; when x = 4, y = 14","q5":"x - 9 = 4 → x = 13"}';

const P = (): string => '{"q1":"10% of 50 = 5","q2":"25% of 80 = 20","q3":"15% discount on 60 AED = 9 AED off → 51 AED","q4":"120 increased by 20% = 144","q5":"18 out of 30 = 60%"}';

const PH = (): string => '{"q1":"Plants produce oxygen","q2":"Glucose and oxygen","q3":"Chlorophyll captures light","q4":"Water + carbon dioxide are the inputs","q5":"Respiration uses glucose and oxygen"}';

const FM = (): string => '{"q1":"A push or a pull","q2":"Force = mass × acceleration","q3":"Friction slows the box down","q4":"Equal and opposite reaction forces","q5":"Newton\'s first law: constant velocity without net force"}';

const ASSIGNMENTS: DemoAssignment[] = [
  // Demo student's own AI-generated assignments
  {
    id: "a-algebra-practice",
    title: "Algebra Basics - Practice Questions",
    description: "AI-generated questions based on Algebra Basics",
    subjectId: "subj-aiden-math",
    subjectName: "Mathematics",
    subjectGrade: "Grade 7",
    creatorId: DEMO_STUDENT_ID,
    classId: null,
    createdAt: "2026-07-20T10:10:00.000Z",
    dueDate: null,
    questions: [
      { id: "q1", question: "Solve for x: 3x = 15", answer: "x = 5" },
      { id: "q2", question: "Solve for x: 5x + 2 = 17", answer: "x = 3" },
      { id: "q3", question: "Expand and solve: 2(x + 4) = 20", answer: "x = 6" },
      { id: "q4", question: "If y = 3x + 2, what is y when x = 4?", answer: "y = 14" },
      { id: "q5", question: "Solve: x - 9 = 4", answer: "x = 13" },
    ],
    submissions: [
      {
        profileId: DEMO_STUDENT_ID,
        status: "GRADED",
        teacherScore: 88,
        teacherComment: "Great work on the two-step equations!",
        aiScore: 90,
        aiFeedback: "Strong understanding of inverse operations. Keep practicing distribution.",
        content: A(),
        submittedAt: "2026-07-21T09:30:00.000Z",
      },
    ],
  },
  {
    id: "a-percent-practice",
    title: "Percentages - Practice Questions",
    description: "AI-generated questions based on Percentages",
    subjectId: "subj-aiden-math",
    subjectName: "Mathematics",
    subjectGrade: "Grade 7",
    creatorId: DEMO_STUDENT_ID,
    classId: null,
    createdAt: "2026-07-24T16:50:00.000Z",
    dueDate: null,
    questions: [
      { id: "q1", question: "What is 10% of 50?", answer: "5" },
      { id: "q2", question: "What is 25% of 80?", answer: "20" },
      { id: "q3", question: "A 60 AED shirt is 15% off. What is the sale price?", answer: "51 AED" },
      { id: "q4", question: "Increase 120 by 20%. What is the result?", answer: "144" },
      { id: "q5", question: "18 out of 30 is what percentage?", answer: "60%" },
    ],
    submissions: [],
  },
  // Teacher class assignments
  {
    id: "ca1-algebra-warmup",
    title: "Algebra Basics - Unit Warm-Up",
    description: "Review of the key skills from the Algebra unit.",
    subjectId: "subj-t-math",
    subjectName: "Mathematics",
    subjectGrade: "Grade 7",
    creatorId: DEMO_TEACHER_ID,
    classId: "c-math7a",
    createdAt: "2026-07-15T09:00:00.000Z",
    dueDate: "2026-08-15T23:59:00.000Z",
    questions: [
      { id: "q1", question: "Solve for x: 3x = 15", answer: "x = 5", points: 20 },
      { id: "q2", question: "Solve for x: 5x + 2 = 17", answer: "x = 3", points: 20 },
      { id: "q3", question: "Expand and solve: 2(x + 4) = 20", answer: "x = 6", points: 20 },
      { id: "q4", question: "If y = 3x + 2, what is y when x = 4?", answer: "y = 14", points: 20 },
      { id: "q5", question: "Solve: x - 9 = 4", answer: "x = 13", points: 20 },
    ],
    submissions: [
      {
        profileId: DEMO_STUDENT_ID,
        status: "GRADED",
        teacherScore: 85,
        teacherComment: "Solid. Watch the order of operations in Q3.",
        aiScore: 88,
        aiFeedback: "Good grasp of one-step and two-step equations.",
        content: A(),
        submittedAt: "2026-07-16T09:15:00.000Z",
      },
      {
        profileId: "s-sofia",
        status: "GRADED",
        teacherScore: 92,
        teacherComment: "Excellent work!",
        aiScore: 95,
        aiFeedback: "Outstanding; all answers correct with clear working.",
        content: A(),
        submittedAt: "2026-07-16T10:00:00.000Z",
      },
      {
        profileId: "s-zoe",
        status: "SUBMITTED",
        teacherScore: null,
        teacherComment: null,
        aiScore: 76,
        aiFeedback: "Mostly correct; review distribution on Q3.",
        content: '{"q1":"x = 5","q2":"x = 3","q3":"x = 12","q4":"y = 14","q5":"x = 13"}',
        submittedAt: "2026-07-17T14:20:00.000Z",
      },
    ],
  },
  {
    id: "ca2-percent-practice",
    title: "Percentages Practice",
    description: "Percentages of a number, discounts and percentage change.",
    subjectId: "subj-t-math",
    subjectName: "Mathematics",
    subjectGrade: "Grade 7",
    creatorId: DEMO_TEACHER_ID,
    classId: "c-math7a",
    createdAt: "2026-07-22T09:00:00.000Z",
    dueDate: "2026-08-20T23:59:00.000Z",
    questions: [
      { id: "q1", question: "What is 10% of 50?", answer: "5", points: 20 },
      { id: "q2", question: "What is 25% of 80?", answer: "20", points: 20 },
      { id: "q3", question: "A 60 AED shirt is 15% off. What is the sale price?", answer: "51 AED", points: 20 },
      { id: "q4", question: "Increase 120 by 20%. What is the result?", answer: "144", points: 20 },
      { id: "q5", question: "18 out of 30 is what percentage?", answer: "60%", points: 20 },
    ],
    submissions: [
      {
        profileId: "s-zoe",
        status: "GRADED",
        teacherScore: 78,
        teacherComment: "Good; recheck Q4.",
        aiScore: 82,
        aiFeedback: "Strong on discounts; percentage change needs a little review.",
        content: P(),
        submittedAt: "2026-07-23T09:40:00.000Z",
      },
      {
        profileId: DEMO_STUDENT_ID,
        status: "SUBMITTED",
        teacherScore: null,
        teacherComment: null,
        aiScore: 84,
        aiFeedback: "Good work. Make sure to show your working.",
        content: P(),
        submittedAt: "2026-07-25T17:05:00.000Z",
      },
      {
        profileId: "s-liam",
        status: "SUBMITTED",
        teacherScore: null,
        teacherComment: null,
        aiScore: 60,
        aiFeedback: "Review converting percentages to decimals.",
        content: '{"q1":"5","q2":"16","q3":"51 AED","q4":"144","q5":"60%"}',
        submittedAt: "2026-07-26T08:30:00.000Z",
      },
    ],
  },
  {
    id: "ca3-photo-review",
    title: "Photosynthesis - Review Questions",
    description: "Key concepts from the Photosynthesis unit.",
    subjectId: "subj-t-sci",
    subjectName: "Science",
    subjectGrade: "Grade 8",
    creatorId: DEMO_TEACHER_ID,
    classId: "c-sci8b",
    createdAt: "2026-07-18T09:00:00.000Z",
    dueDate: "2026-08-12T23:59:00.000Z",
    questions: [
      { id: "q1", question: "What gas do plants release during photosynthesis?", answer: "Oxygen", points: 20 },
      { id: "q2", question: "What are the products of photosynthesis?", answer: "Glucose and oxygen", points: 20 },
      { id: "q3", question: "Which organelle captures light energy?", answer: "Chloroplast", points: 20 },
      { id: "q4", question: "What are the two raw materials plants take in?", answer: "Water and carbon dioxide", points: 20 },
      { id: "q5", question: "Which process releases the energy stored in glucose?", answer: "Cellular respiration", points: 20 },
    ],
    submissions: [
      {
        profileId: "s-maya",
        status: "SUBMITTED",
        teacherScore: null,
        teacherComment: null,
        aiScore: 90,
        aiFeedback: "Excellent, thorough answers.",
        content: PH(),
        submittedAt: "2026-07-19T11:00:00.000Z",
      },
      {
        profileId: "s-noah",
        status: "SUBMITTED",
        teacherScore: null,
        teacherComment: null,
        aiScore: 55,
        aiFeedback: "Review the equation of photosynthesis and respiration.",
        content: '{"q1":"oxygen","q2":"glucose","q3":"cell","q4":"sunlight and soil","q5":"breathing"}',
        submittedAt: "2026-07-20T13:10:00.000Z",
      },
      {
        profileId: "s-ethan",
        status: "SUBMITTED",
        teacherScore: null,
        teacherComment: null,
        aiScore: 62,
        aiFeedback: "Good start; review the inputs to photosynthesis.",
        content: '{"q1":"oxygen","q2":"glucose and oxygen","q3":"chloroplast","q4":"water and light","q5":"respiration"}',
        submittedAt: "2026-07-21T09:50:00.000Z",
      },
    ],
  },
  {
    id: "ca4-forces-quiz",
    title: "Forces & Motion Quiz",
    description: "Newton's laws and basic forces.",
    subjectId: "subj-t-sci",
    subjectName: "Science",
    subjectGrade: "Grade 8",
    creatorId: DEMO_TEACHER_ID,
    classId: "c-sci8b",
    createdAt: "2026-07-25T09:00:00.000Z",
    dueDate: "2026-08-25T23:59:00.000Z",
    questions: [
      { id: "q1", question: "What is a force?", answer: "A push or a pull", points: 20 },
      { id: "q2", question: "State Newton's second law.", answer: "F = m × a (force equals mass times acceleration)", points: 20 },
      { id: "q3", question: "What force opposes motion between two surfaces?", answer: "Friction", points: 20 },
      { id: "q4", question: "For every action there is an equal and opposite...", answer: "Reaction", points: 20 },
      { id: "q5", question: "What does Newton's first law say about an object with no net force?", answer: "It stays at rest or moves at constant velocity", points: 20 },
    ],
    submissions: [
      {
        profileId: "s-noah",
        status: "SUBMITTED",
        teacherScore: null,
        teacherComment: null,
        aiScore: 48,
        aiFeedback: "Review Newton's laws — try the Khan Academy videos.",
        content: '{"q1":"a push or a pull","q2":"force equals mass","q3":"friction","q4":"reaction","q5":"nothing happens"}',
        submittedAt: "2026-07-26T15:20:00.000Z",
      },
      {
        profileId: "s-ethan",
        status: "GRADED",
        teacherScore: 68,
        teacherComment: "Good understanding of forces; keep practicing the laws.",
        aiScore: 70,
        aiFeedback: "Solid answers; restate the laws fully next time.",
        content: FM(),
        submittedAt: "2026-07-27T10:15:00.000Z",
      },
    ],
  },
];

export const allAssignments = (): DemoAssignment[] => ASSIGNMENTS;

export const assignmentById = (id: string): DemoAssignment | null => ASSIGNMENTS.find((a) => a.id === id) ?? null;

export const assignmentsForProfile = (profileId: string): DemoAssignment[] => {
  const classes = classesForProfile(profileId).map((c) => c.id);
  return ASSIGNMENTS.filter(
    (a) => a.creatorId === profileId || (a.classId != null && classes.includes(a.classId))
  );
};

// ------------------------------------------------------------------ classes

export const CLASSES: DemoClass[] = [
  {
    id: "c-math7a",
    name: "Grade 7 Mathematics",
    inviteCode: "MATH7A",
    teacherId: DEMO_TEACHER_ID,
    teacherName: "Ms. Rivera",
    createdAt: "2026-06-01T09:00:00.000Z",
    members: [DEMO_STUDENT_ID, "s-zoe", "s-liam", "s-sofia", "s-olivia"],
    assignmentIds: ["ca1-algebra-warmup", "ca2-percent-practice"],
  },
  {
    id: "c-sci8b",
    name: "Grade 8 Science",
    inviteCode: "SCI8B",
    teacherId: DEMO_TEACHER_ID,
    teacherName: "Ms. Rivera",
    createdAt: "2026-06-01T10:00:00.000Z",
    members: ["s-maya", "s-noah", "s-ethan"],
    assignmentIds: ["ca3-photo-review", "ca4-forces-quiz"],
  },
  {
    id: "c-home7c",
    name: "Grade 7 Homeroom",
    inviteCode: "HOME7C",
    teacherId: DEMO_TEACHER_ID,
    teacherName: "Ms. Rivera",
    createdAt: "2026-06-02T09:00:00.000Z",
    members: [DEMO_STUDENT_ID, "s-zoe", "s-sofia", "s-maya", "s-noah"],
    assignmentIds: [],
  },
];

export const classesForProfile = (profileId: string): DemoClass[] => {
  const p = PROFILES[profileId];
  if (!p) return [];
  if (p.role === "TEACHER") return CLASSES.filter((c) => c.teacherId === profileId);
  return CLASSES.filter((c) => c.members.includes(profileId));
};

export const classById = (id: string): DemoClass | null => CLASSES.find((c) => c.id === id) ?? null;

// ------------------------------------------------------------- conversations

const msg = (id: string, senderId: string, content: string, sentAt: string, read = true): DemoMessage => ({
  id,
  senderId,
  content,
  sentAt,
  read,
});

const CONVERSATIONS: DemoConversation[] = [
  {
    id: "conv-aiden-zoe",
    status: "ACTIVE",
    source: "PEER_TUTORING",
    profileIds: [DEMO_STUDENT_ID, "s-zoe"],
    createdAt: "2026-07-20T12:00:00.000Z",
    updatedAt: "2026-07-28T18:30:00.000Z",
    messages: [
      msg("m1", "s-zoe", "Hey Aiden! I matched with you to help with Percentages. Ready to start?", "2026-07-20T12:05:00.000Z", true),
      msg("m2", DEMO_STUDENT_ID, "Yes please! I'm stuck on discounts.", "2026-07-20T12:08:00.000Z", true),
      msg("m3", "s-zoe", "No problem. Convert 25% to a fraction and then multiply — try 25% of 80.", "2026-07-20T12:10:00.000Z", true),
      msg("m4", DEMO_STUDENT_ID, "Oh! 0.25 × 80 = 20. Got it!", "2026-07-20T12:12:00.000Z", true),
      msg("m5", "s-zoe", "Nice! Want to try a discount problem next session?", "2026-07-28T18:30:00.000Z", false),
    ],
  },
  {
    id: "conv-aiden-teacher",
    status: "ACTIVE",
    source: "MANUAL",
    profileIds: [DEMO_STUDENT_ID, DEMO_TEACHER_ID],
    createdAt: "2026-07-16T09:20:00.000Z",
    updatedAt: "2026-07-28T15:00:00.000Z",
    messages: [
      msg("m6", DEMO_TEACHER_ID, "Great job on the Algebra unit warm-up, Aiden!", "2026-07-16T09:20:00.000Z", true),
      msg("m7", DEMO_STUDENT_ID, "Thanks Ms. Rivera! I practiced the two-step ones a lot.", "2026-07-16T09:25:00.000Z", true),
      msg("m8", DEMO_TEACHER_ID, "It shows. Let me know if you'd like extra practice problems.", "2026-07-28T15:00:00.000Z", false),
    ],
  },
];

export const conversationsForProfile = (profileId: string): DemoConversation[] =>
  CONVERSATIONS.filter((c) => c.profileIds.includes(profileId));

export const conversationById = (id: string): DemoConversation | null =>
  CONVERSATIONS.find((c) => c.id === id) ?? null;

// ------------------------------------------------------------------ tutoring

const TUTORING: DemoTutoring[] = [
  {
    id: "tr-aiden-learn",
    requesterId: DEMO_STUDENT_ID,
    tutorId: "s-zoe",
    type: "LEARN",
    topic: "Percentages",
    grade: "Grade 7",
    status: "MATCHED",
    pairedId: "tr-zoe-teach",
    createdAt: "2026-07-20T12:00:00.000Z",
  },
  {
    id: "tr-zoe-teach",
    requesterId: "s-zoe",
    tutorId: "s-zoe",
    type: "TEACH",
    topic: "Percentages",
    grade: "Grade 7",
    status: "MATCHED",
    pairedId: "tr-aiden-learn",
    createdAt: "2026-07-20T12:00:00.000Z",
  },
  {
    id: "tr-olivia-learn",
    requesterId: "s-olivia",
    tutorId: null,
    type: "LEARN",
    topic: "Geometry Basics",
    grade: "Grade 7",
    status: "OPEN",
    pairedId: null,
    createdAt: "2026-07-27T14:00:00.000Z",
  },
];

export const tutoringForProfile = (profileId: string): DemoTutoring[] =>
  TUTORING.filter((t) => t.requesterId === profileId);

export const tutoringById = (id: string): DemoTutoring | null => TUTORING.find((t) => t.id === id) ?? null;

// ------------------------------------------------- gamification / activity

export const TRANSACTIONS: Record<string, { id: string; amount: number; reason: string; refId: string | null; createdAt: string }[]> = {
  [DEMO_STUDENT_ID]: [
    { id: "tx-a1", amount: 20, reason: "ASSIGNMENT_SUBMITTED", refId: "ca2-percent-practice", createdAt: "2026-07-25T17:05:00.000Z" },
    { id: "tx-a2", amount: 6, reason: "STUDY_SESSION", refId: "ss-a-percent", createdAt: "2026-07-24T16:55:00.000Z" },
    { id: "tx-a3", amount: 20, reason: "ASSIGNMENT_SUBMITTED", refId: "a-algebra-practice", createdAt: "2026-07-21T09:30:00.000Z" },
    { id: "tx-a4", amount: 50, reason: "TOPIC_MASTERED", refId: "topic-aiden-algebra", createdAt: "2026-07-20T10:20:00.000Z" },
    { id: "tx-a5", amount: 12, reason: "STUDY_SESSION", refId: "ss-a-algebra", createdAt: "2026-07-20T10:15:00.000Z" },
  ],
  [DEMO_TEACHER_ID]: [
    { id: "tx-t1", amount: 12, reason: "STUDY_SESSION", refId: "ss-t-plan", createdAt: "2026-07-18T09:10:00.000Z" },
    { id: "tx-t2", amount: 50, reason: "TOPIC_MASTERED", refId: "topic-t-percent", createdAt: "2026-07-10T11:00:00.000Z" },
  ],
};

export const SESSIONS: Record<string, { id: string; topicId: string; topicName: string; subjectName: string; durationMinutes: number; xpEarned: number; startedAt: string; endedAt: string | null; active: boolean }[]> = {
  [DEMO_STUDENT_ID]: [
    { id: "ss-a-percent", topicId: "topic-aiden-percent", topicName: "Percentages", subjectName: "Mathematics", durationMinutes: 18, xpEarned: 6, startedAt: "2026-07-24T16:40:00.000Z", endedAt: "2026-07-24T16:58:00.000Z", active: false },
    { id: "ss-a-algebra", topicId: "topic-aiden-algebra", topicName: "Algebra Basics", subjectName: "Mathematics", durationMinutes: 40, xpEarned: 12, startedAt: "2026-07-20T10:05:00.000Z", endedAt: "2026-07-20T10:45:00.000Z", active: false },
    { id: "ss-a-cells", topicId: "topic-aiden-cells", topicName: "Cells & Tissues", subjectName: "Science", durationMinutes: 30, xpEarned: 10, startedAt: "2026-07-25T11:20:00.000Z", endedAt: "2026-07-25T11:50:00.000Z", active: false },
  ],
  [DEMO_TEACHER_ID]: [
    { id: "ss-t-plan", topicId: "topic-t-algebra", topicName: "Algebra Basics", subjectName: "Mathematics", durationMinutes: 35, xpEarned: 12, startedAt: "2026-07-18T09:00:00.000Z", endedAt: "2026-07-18T09:35:00.000Z", active: false },
  ],
};

export const ALERTS: Record<string, { id: string; alertType: string; message: string; score: number; resolved: boolean; createdAt: string }[]> = {
  [DEMO_STUDENT_ID]: [
    { id: "al-aiden-1", alertType: "MILD", message: "Study pace is steady — keep it up.", score: 35, resolved: true, createdAt: "2026-07-10T08:00:00.000Z" },
  ],
  "s-noah": [
    { id: "al-noah-1", alertType: "HIGH", message: "High study load and multiple overdue assignments detected.", score: 76, resolved: false, createdAt: "2026-07-28T06:00:00.000Z" },
  ],
  "s-ethan": [
    { id: "al-ethan-1", alertType: "HIGH", message: "Submissions dropped while tutoring load increased.", score: 61, resolved: false, createdAt: "2026-07-27T06:00:00.000Z" },
  ],
  "s-liam": [
    { id: "al-liam-1", alertType: "MEDIUM", message: "Slightly elevated load; consider a lighter week.", score: 42, resolved: true, createdAt: "2026-07-20T06:00:00.000Z" },
  ],
};

// ------------------------------------------------------------ leaderboard

export function leaderboardFor(profileId: string): { entries: any[]; yourRank: number | null } {
  const students = Object.values(PROFILES).filter((p) => p.role === "STUDENT");
  const topicsMastered = (id: string): number =>
    subjectsByProfile(id).flatMap((s) => s.topic).filter((t) => t.status === "MASTERED").length;

  const ranked = students
    .map((s) => ({
      profileId: s.id,
      displayName: s.displayName,
      avatarUrl: s.avatarUrl,
      level: s.level,
      xp: s.xp,
      topicsMastered: topicsMastered(s.id),
    }))
    .sort(
      (a, b) => b.xp - a.xp || b.topicsMastered - a.topicsMastered || a.displayName.localeCompare(b.displayName)
    );

  const yourIndex = ranked.findIndex((e) => e.profileId === profileId);
  const entries = ranked.slice(0, 10).map((e, i) => ({ ...e, rank: i + 1, isYou: e.profileId === profileId }));
  return { entries, yourRank: yourIndex >= 0 ? yourIndex + 1 : null };
}
