/**
 * Demo seed for EduAI.
 *
 * Creates a teacher, classes, students, subjects/topics, AI conversations,
 * peer chats, tutoring requests, assignments + submissions, study sessions
 * and XP history so every screen of the app has realistic demo data.
 *
 * All demo accounts use the password:  demo12345
 *
 * Run with:  npx prisma db seed  (from apps/server)
 * NOTE: This wipes all existing data before seeding.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient, Prisma } from "@prisma/client";
import { levelFromXp } from "@repo/shared";
import { auth } from "../src/lib/auth.ts";

const __dir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dir, "..", "..");
try {
  process.loadEnvFile(path.join(repoRoot, ".env"));
} catch {}

const prisma = new PrismaClient();

const DEMO_PASSWORD = "demo12345";
const XP_STUDY_MINUTE = 2;
const XP_TOPIC_MASTERED = 50;
const XP_ASSIGNMENT_SUBMITTED = 20;

const now = Date.now();
const daysAgo = (d: number, h = 0) => new Date(now - d * 86400000 - h * 3600000);

// ---------------------------------------------------------------------------
// Demo data
// ---------------------------------------------------------------------------

const TEACHER = {
  email: "teacher@demo.com",
  name: "Ms. Rivera",
  displayName: "Ms. Rivera",
  bio: "Middle school math & science teacher with 10 years of experience. Excited to try AI-assisted learning this term!",
};

const TEACHER_SUBJECTS: SubjectSeed[] = [
  {
    name: "Mathematics",
    grade: "Grade 7",
    scope: "Algebra, ratios and geometry",
    topics: [
      {
        name: "Algebra Basics",
        status: "MASTERED",
        progress: 100,
        explanation: "Algebra uses letters to stand for unknown numbers. A two-step equation like 2x + 3 = 11 is solved by undoing the addition first (subtract 3), then undoing the multiplication (divide by 2) to isolate x.",
        suggestions: [
          { name: "Two-step equations warm-up", description: "Start each class with one equation to solve and check by substitution.", connection: "Algebra Basics" },
          { name: "Common mistakes board", description: "Track common mistakes like forgetting inverse operations or signs when moving terms.", connection: "Algebra Basics" },
        ],
      },
      {
        name: "Percentages",
        status: "MASTERED",
        progress: 100,
        explanation: "A percentage is a fraction out of 100. To find a percent of a number, convert it to a decimal and multiply, e.g., 20% of 50 = 0.20 × 50 = 10.",
      },
      {
        name: "Geometry Basics",
        status: "IN_PROGRESS",
        progress: 40,
        explanation: "Geometry studies shapes, angles, and space. The area of a rectangle is base × height, and angles in a triangle always add up to 180 degrees.",
      },
    ],
  },
  {
    name: "Science",
    grade: "Grade 8",
    scope: "Life science and physics",
    topics: [
      {
        name: "Photosynthesis",
        status: "MASTERED",
        progress: 100,
        explanation: "Photosynthesis is how plants turn light, water, and carbon dioxide into glucose and oxygen inside their chloroplasts. It happens in daylight and powers almost all food chains.",
        suggestions: [
          { name: "Diagram labeling activity", description: "Have students label the inputs and outputs of photosynthesis on a leaf diagram.", connection: "Photosynthesis" },
        ],
      },
      {
        name: "Newton's Laws",
        status: "IN_PROGRESS",
        progress: 55,
        explanation: "Newton's laws of motion describe how forces affect movement. F = ma links force, mass, and acceleration, and every action has an equal and opposite reaction.",
      },
      {
        name: "Ecosystems",
        status: "NOT_STARTED",
        progress: 0,
        explanation: "An ecosystem is all the living and non-living things interacting in an area. Food chains start with producers and decomposers recycle nutrients back into the soil.",
      },
    ],
  },
];

const TEACHER_ASSIGNMENTS: AssignmentSeed[] = [
  {
    subject: "Algebra Basics",
    title: "Algebra Basics - Unit Warm-Up",
    class: "MATH7A",
    questions: [
      { question: "Solve 2x + 3 = 11.", answer: "x = 4" },
      { question: "What is a variable?", answer: "A symbol that stands for an unknown number" },
      { question: "Simplify 3x + 2x.", answer: "5x" },
      { question: "Solve x - 7 = 2.", answer: "x = 9" },
      { question: "If y = 3, what is 4y + 1?", answer: "13" },
    ],
    submissions: [
      {
        student: "aiden@demo.com",
        status: "SUBMITTED",
        aiScore: 88,
        aiFeedback:
          "Solid work. You solved all equations correctly and explained the variable clearly. Double-check your sign when isolating terms.",
        submittedDaysAgo: 1,
      },
      {
        student: "zoe@demo.com",
        status: "SUBMITTED",
        aiScore: 74,
        aiFeedback:
          "Good attempt. Review inverse operations - remember to divide both sides by the coefficient after subtracting.",
        submittedDaysAgo: 1,
      },
      {
        student: "liam@demo.com",
        status: "GRADED",
        aiScore: 92,
        aiFeedback: "Excellent. All answers correct with clear steps.",
        teacherScore: 95,
        teacherComment: "Great job, Liam - show your steps like this every time!",
        submittedDaysAgo: 4,
      },
      {
        student: "sofia@demo.com",
        status: "GRADED",
        aiScore: 80,
        aiFeedback: "Mostly correct. Watch the constant term when applying inverse operations.",
        teacherScore: 82,
        teacherComment: "Solid. Let's review two-step equations together this week.",
        submittedDaysAgo: 5,
      },
    ],
  },
  {
    subject: "Percentages",
    title: "Percentages Practice",
    class: "MATH7A",
    questions: [
      { question: "What is 25% of 80?", answer: "20" },
      { question: "Write 0.35 as a percentage.", answer: "35%" },
      { question: "A shirt costs $40 and is 20% off. What is the sale price?", answer: "$32" },
      { question: "What is 50% of 50?", answer: "25" },
      { question: "Express 3/4 as a percentage.", answer: "75%" },
    ],
    submissions: [
      {
        student: "aiden@demo.com",
        status: "SUBMITTED",
        aiScore: 90,
        aiFeedback: "Very strong. Percentage conversions are all correct.",
        submittedDaysAgo: 2,
      },
      {
        student: "olivia@demo.com",
        status: "SUBMITTED",
        aiScore: 66,
        aiFeedback:
          "Review converting fractions to percentages - multiply by 100 and divide by the denominator.",
        submittedDaysAgo: 2,
      },
    ],
  },
  {
    subject: "Photosynthesis",
    title: "Photosynthesis - Review Questions",
    class: "SCI8B",
    questions: [
      { question: "What gas do plants absorb for photosynthesis?", answer: "Carbon dioxide" },
      { question: "Where does photosynthesis take place?", answer: "In the chloroplasts" },
      { question: "What are the two main products of photosynthesis?", answer: "Glucose and oxygen" },
      { question: "What pigment gives leaves their green color?", answer: "Chlorophyll" },
      { question: "When does photosynthesis happen?", answer: "During daylight, when sunlight is present" },
    ],
    submissions: [
      {
        student: "maya@demo.com",
        status: "SUBMITTED",
        aiScore: 71,
        aiFeedback: "Good basics. The pigment question is chlorophyll - the green pigment found in chloroplasts.",
        submittedDaysAgo: 1,
      },
      {
        student: "noah@demo.com",
        status: "GRADED",
        aiScore: 85,
        aiFeedback: "Strong understanding of the photosynthesis equation.",
        teacherScore: 88,
        teacherComment: "Nice work, Noah!",
        submittedDaysAgo: 6,
      },
    ],
  },
  {
    subject: "Newton's Laws",
    title: "Forces & Motion Quiz",
    class: "SCI8B",
    questions: [
      { question: "State Newton's First Law.", answer: "An object at rest stays at rest, and a moving object stays moving unless acted on by an unbalanced force" },
      { question: "Force equals what?", answer: "Mass times acceleration (F = ma)" },
      { question: "Which law explains why a seatbelt stops you in a crash?", answer: "Newton's First Law (inertia)" },
      { question: "What unit is force measured in?", answer: "Newtons" },
      { question: "If mass doubles and force stays the same, what happens to acceleration?", answer: "Acceleration is halved" },
    ],
    submissions: [
      {
        student: "ethan@demo.com",
        status: "SUBMITTED",
        aiScore: 69,
        aiFeedback: "Review the relationship in F = ma - acceleration is inversely proportional to mass.",
        submittedDaysAgo: 3,
      },
      {
        student: "noah@demo.com",
        status: "GRADED",
        aiScore: 94,
        aiFeedback: "Excellent. All laws stated precisely with correct units.",
        teacherScore: 97,
        teacherComment: "Excellent precision!",
        submittedDaysAgo: 5,
      },
    ],
  },
];

const TEACHER_SESSIONS: SessionSeed[] = [
  { subject: "Mathematics", topic: "Algebra Basics", minutes: 20, daysAgo: 6 },
  { subject: "Science", topic: "Newton's Laws", minutes: 15, daysAgo: 2 },
];

const TEACHER_AI_CONVERSATION: AIConversationSeed = {
  profile: "teacher",
  subject: "Mathematics",
  topic: "Algebra Basics",
  daysAgo: 1,
  exchanges: [
    { from: "student", text: "Can you draft a warm-up question for solving two-step equations?" },
    { from: "tutor", text: "Sure! Try: Solve 2x + 3 = 11 and explain each step. It checks both inverse operations and keeping the equation balanced." },
    { from: "student", text: "What are the most common mistakes students make here?" },
    { from: "tutor", text: "Usually forgetting to apply the inverse to both sides, dropping the sign when moving terms, or stopping at 2x = 8 instead of dividing. Ask them to verify by substitution." },
    { from: "student", text: "Great, I'll use that for Monday's warm-up." },
    { from: "tutor", text: "Awesome! Pair it with one percent-of-a-number question to spiral-review past topics." },
  ],
};

type TopicSeed = {
  name: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "MASTERED";
  progress: number;
  explanation?: string;
  suggestions?: { name: string; description: string; connection: string }[];
};

type SubjectSeed = {
  name: string;
  grade: string;
  scope?: string;
  topics: TopicSeed[];
};

type QuestionSeed = { question: string; answer: string; points?: number };

type TeacherSubmissionSeed = {
  student: string;
  status: "SUBMITTED" | "GRADED";
  aiScore?: number;
  aiFeedback?: string;
  teacherScore?: number;
  teacherComment?: string;
  submittedDaysAgo?: number;
};

type AssignmentSeed = {
  subject: string;
  title: string;
  class?: string;
  questions: QuestionSeed[];
  submitted?: boolean;
  aiScore?: number;
  aiFeedback?: string;
  teacherScore?: number;
  teacherComment?: string;
  gradedDaysAgo?: number;
  submissions?: TeacherSubmissionSeed[];
};

type SessionSeed = { subject: string; topic: string; minutes: number; daysAgo: number };

type StudentSeed = {
  email: string;
  displayName: string;
  bio: string;
  subjects: SubjectSeed[];
  assignments: AssignmentSeed[];
  sessions: SessionSeed[];
};

const STUDENTS: StudentSeed[] = [
  {
    email: "aiden@demo.com",
    displayName: "Aiden Patel",
    bio: "Loves math puzzles and coding.",
    subjects: [
      {
        name: "Mathematics",
        grade: "Grade 7",
        scope: "Standard 7th grade curriculum",
        topics: [
          {
            name: "Algebra Basics",
            status: "MASTERED",
            progress: 100,
            explanation:
              "Algebra uses letters (variables) to represent unknown numbers. An expression like 2x + 3 combines a variable with constants. Solving an equation means isolating the variable using inverse operations. For example, in 2x + 3 = 11, subtract 3 from both sides to get 2x = 8, then divide by 2 to find x = 4.",
            suggestions: [
              { name: "Linear Equations", description: "Solve equations with variables on both sides.", connection: "Builds on isolating variables from Algebra Basics." },
              { name: "Graphing Lines", description: "Plot linear equations on a coordinate plane.", connection: "Visualizes the relationships introduced in Algebra Basics." },
              { name: "Word Problems", description: "Translate real-world situations into equations.", connection: "Applies algebraic solving to practical scenarios." },
            ],
          },
          { name: "Fractions & Decimals", status: "MASTERED", progress: 100, explanation: "A fraction represents a part of a whole, like 3/4. To convert a fraction to a decimal, divide numerator by denominator (3 ÷ 4 = 0.75). To add fractions, first find a common denominator." },
          { name: "Percentages", status: "IN_PROGRESS", progress: 60, explanation: "A percentage means 'out of 100'. To find 25% of 80, multiply 80 × 0.25 = 20. To convert a fraction to a percent, divide then multiply by 100.", suggestions: [
              { name: "Percent Change", description: "Calculate how much a value increases or decreases.", connection: "Extends basic percentage calculations to real-world changes." },
              { name: "Simple Interest", description: "Apply percents to money and savings.", connection: "Uses percent-of-a-number skills from Percentages." },
            ] },
          { name: "Geometry Basics", status: "IN_PROGRESS", progress: 40, explanation: "Geometry is the study of shapes and space. Perimeter measures the distance around a shape, area measures the space inside it, and angles describe turns. A triangle's angles always add up to 180 degrees, and a rectangle's area is length times width." }
        ],
      },
      {
        name: "English",
        grade: "Grade 7",
        scope: "Literature & composition",
        topics: [
          { name: "Literary Devices", status: "MASTERED", progress: 100, explanation: "Literary devices like simile, metaphor, and personification make writing vivid. A simile compares using 'like' or 'as'; a metaphor states one thing is another; personification gives human traits to non-human things." },
          { name: "Essay Writing", status: "IN_PROGRESS", progress: 55, explanation: "A good essay has a clear structure: an introduction with a thesis, body paragraphs that each support one main idea, and a conclusion that ties it together. Start with an outline, use transitions between paragraphs, and always end with a strong conclusion." },
          { name: "Reading Comprehension", status: "NOT_STARTED", progress: 0, explanation: "Reading comprehension means understanding what you read. Try summarizing each paragraph in your own words, underlining key details, and asking questions like 'who, what, where, when, why'. Main idea, supporting details, and making inferences are the core skills." },
        ],
      },
    ],
    assignments: [
      {
        subject: "Algebra Basics",
        title: "Algebra Basics - Practice Questions",
        questions: [
          { question: "Solve for x: 2x + 3 = 11", answer: "x = 4" },
          { question: "Solve for x: x - 5 = 12", answer: "x = 17" },
          { question: "What is the value of 3x when x = 7?", answer: "21" },
          { question: "Simplify: 4x + 2x - 3", answer: "6x - 3" },
          { question: "If y = 2x + 1, what is y when x = 5?", answer: "11" },
        ],
        submitted: true,
        aiScore: 92,
        aiFeedback: "Strong understanding of inverse operations. Keep practicing two-step equations.",
        teacherScore: 90,
        teacherComment: "Excellent work, Aiden! Show your steps on the word problem next time.",
        gradedDaysAgo: 6,
      },
      {
        subject: "Fractions & Decimals",
        title: "Fractions & Decimals - Practice Questions",
        questions: [
          { question: "Convert 3/4 to a decimal.", answer: "0.75" },
          { question: "Add 1/4 + 2/4.", answer: "3/4" },
          { question: "Simplify 8/12.", answer: "2/3" },
          { question: "Which is larger: 1/3 or 0.4?", answer: "0.4" },
          { question: "Multiply 2/3 × 3/4.", answer: "1/2" },
        ],
        submitted: true,
        aiScore: 85,
        aiFeedback: "Great job on conversions. Review multiplying fractions.",
        gradedDaysAgo: 3,
      },
      {
        subject: "Percentages",
        title: "Percentages - Practice Questions",
        questions: [
          { question: "What is 25% of 80?", answer: "20" },
          { question: "Convert 0.6 to a percent.", answer: "60%" },
          { question: "A shirt costs $40 and is 20% off. What is the discount?", answer: "$8" },
          { question: "What percent of 50 is 10?", answer: "20%" },
          { question: "Convert 45% to a decimal.", answer: "0.45" },
        ],
      },
    ],
    sessions: [
      { subject: "Algebra Basics", topic: "Algebra Basics", minutes: 25, daysAgo: 9 },
      { subject: "Algebra Basics", topic: "Algebra Basics", minutes: 30, daysAgo: 8 },
      { subject: "Mathematics", topic: "Fractions & Decimals", minutes: 20, daysAgo: 5 },
      { subject: "English", topic: "Literary Devices", minutes: 15, daysAgo: 4 },
      { subject: "Mathematics", topic: "Percentages", minutes: 25, daysAgo: 2 },
      { subject: "Mathematics", topic: "Percentages", minutes: 20, daysAgo: 1 },
    ],
  },
  {
    email: "zoe@demo.com",
    displayName: "Zoe Chen",
    bio: "Aiming for the top of the leaderboard!",
    subjects: [
      {
        name: "Mathematics",
        grade: "Grade 7",
        scope: "Standard 7th grade curriculum",
        topics: [
          { name: "Fractions & Decimals", status: "MASTERED", progress: 100, explanation: "A fraction represents a part of a whole. Convert to decimals by dividing the numerator by the denominator." },
          { name: "Percentages", status: "IN_PROGRESS", progress: 70, explanation: "A percentage means 'out of 100'. To find 20% of 150, multiply 150 × 0.20 = 30. Converting between fractions, decimals, and percents is easy once you remember: percent means divide by 100.", suggestions: [
              { name: "Percent Change", description: "Learn how to calculate increases and decreases as percents.", connection: "Builds on finding a percent of a number from Percentages." },
              { name: "Discounts & Sales Tax", description: "Apply percents to real-world shopping problems.", connection: "Uses percent calculations in practical contexts." },
            ] },
          { name: "Algebra Basics", status: "IN_PROGRESS", progress: 45, explanation: "Algebra uses letters called variables to represent unknown numbers. To solve 2x + 3 = 11, subtract 3 from both sides, then divide by 2 to get x = 4. The goal is always to isolate the variable." },
        ],
      },
    ],
    assignments: [
      {
        subject: "Fractions & Decimals",
        title: "Fractions & Decimals - Practice Questions",
        questions: [
          { question: "Convert 1/2 to a decimal.", answer: "0.5" },
          { question: "Add 1/3 + 1/3.", answer: "2/3" },
          { question: "Simplify 10/15.", answer: "2/3" },
          { question: "Convert 0.25 to a fraction.", answer: "1/4" },
          { question: "Subtract 3/4 - 1/4.", answer: "1/2" },
        ],
        submitted: true,
        aiScore: 88,
        aiFeedback: "Solid. Work on simplifying fractions to lowest terms consistently.",
        gradedDaysAgo: 4,
      },
      {
        subject: "Percentages",
        title: "Percentages - Practice Questions",
        questions: [
          { question: "What is 50% of 60?", answer: "30" },
          { question: "Convert 0.3 to a percent.", answer: "30%" },
          { question: "What percent of 80 is 20?", answer: "25%" },
          { question: "A jacket costs $50 with 10% tax. What is the tax?", answer: "$5" },
          { question: "Convert 5% to a decimal.", answer: "0.05" },
        ],
      },
    ],
    sessions: [
      { subject: "Mathematics", topic: "Fractions & Decimals", minutes: 30, daysAgo: 7 },
      { subject: "Mathematics", topic: "Percentages", minutes: 20, daysAgo: 3 },
      { subject: "Mathematics", topic: "Algebra Basics", minutes: 15, daysAgo: 1 },
    ],
  },
  {
    email: "liam@demo.com",
    displayName: "Liam Nguyen",
    bio: "New this term - figuring out a study routine.",
    subjects: [
      {
        name: "Mathematics",
        grade: "Grade 7",
        topics: [
          { name: "Percentages", status: "IN_PROGRESS", progress: 35, explanation: "A percentage is a fraction out of 100. '25%' means 25 out of every 100. To find 25% of 80, multiply 80 × 0.25 = 20. Convert a decimal to a percent by multiplying by 100." },
          { name: "Fractions & Decimals", status: "NOT_STARTED", progress: 0, explanation: "Fractions and decimals are two ways to show parts of a whole. To convert a fraction to a decimal, divide the top by the bottom: 3 ÷ 4 = 0.75. To add fractions, find a common denominator first." },
        ],
      },
    ],
    assignments: [
      {
        subject: "Percentages",
        title: "Percentages - Practice Questions",
        questions: [
          { question: "What is 10% of 90?", answer: "9" },
          { question: "Convert 0.5 to a percent.", answer: "50%" },
          { question: "Convert 1/4 to a percent.", answer: "25%" },
          { question: "What is 5% of 200?", answer: "10" },
          { question: "Convert 70% to a decimal.", answer: "0.7" },
        ],
      },
    ],
    sessions: [
      { subject: "Mathematics", topic: "Percentages", minutes: 15, daysAgo: 6 },
      { subject: "Mathematics", topic: "Percentages", minutes: 10, daysAgo: 4 },
    ],
  },
  {
    email: "sofia@demo.com",
    displayName: "Sofia Ramirez",
    bio: "Geometry enthusiast. Loves visual learning.",
    subjects: [
      {
        name: "Mathematics",
        grade: "Grade 7",
        topics: [
          { name: "Geometry Basics", status: "IN_PROGRESS", progress: 65, explanation: "Geometry studies shapes and space. Key ideas include angles (acute, obtuse, right), perimeter (sum of sides), and area (length × width for rectangles).", suggestions: [
              { name: "Area of Triangles", description: "Learn that a triangle's area is half the base times height.", connection: "Builds on the area ideas from Geometry Basics." },
              { name: "Volume of Solids", description: "Measure space inside 3D shapes like boxes and cubes.", connection: "Extends area concepts into three dimensions." },
            ] },
          { name: "Ratios & Proportions", status: "IN_PROGRESS", progress: 30, explanation: "A ratio compares two quantities, like 4:8, which simplifies to 1:2. A proportion says two ratios are equal, e.g., 3 apples cost $6, so 6 apples cost $12. Cross-multiply to solve proportion problems." },
        ],
      },
      {
        name: "English",
        grade: "Grade 7",
        topics: [
          { name: "Reading Comprehension", status: "IN_PROGRESS", progress: 40, explanation: "Reading comprehension is about understanding what a text means, not just reading the words. Identify the main idea, find supporting details, and make inferences based on clues in the text to fully grasp what you read." },
        ],
      },
    ],
    assignments: [
      {
        subject: "Geometry Basics",
        title: "Geometry Basics - Practice Questions",
        questions: [
          { question: "How many sides does a hexagon have?", answer: "6" },
          { question: "What is the area of a 4cm × 5cm rectangle?", answer: "20 cm²" },
          { question: "What is the perimeter of a square with side 6?", answer: "24" },
          { question: "How many degrees are in a right angle?", answer: "90" },
          { question: "What is the sum of angles in a triangle?", answer: "180 degrees" },
        ],
        submitted: true,
        aiScore: 90,
        aiFeedback: "Great spatial reasoning! Try applying area formulas to irregular shapes.",
        gradedDaysAgo: 2,
      },
      {
        subject: "Ratios & Proportions",
        title: "Ratios & Proportions - Practice Questions",
        questions: [
          { question: "Simplify the ratio 4:8.", answer: "1:2" },
          { question: "If 3 apples cost $6, how much do 6 cost?", answer: "$12" },
          { question: "What is 2:5 equivalent to?", answer: "4:10" },
          { question: "In a class of 20 with 12 girls, what is the ratio of girls to boys?", answer: "12:8 (3:2)" },
          { question: "A map uses 1cm = 2km. How far is 5cm?", answer: "10 km" },
        ],
      },
    ],
    sessions: [
      { subject: "Mathematics", topic: "Geometry Basics", minutes: 20, daysAgo: 5 },
      { subject: "English", topic: "Reading Comprehension", minutes: 15, daysAgo: 2 },
    ],
  },
  {
    email: "olivia@demo.com",
    displayName: "Olivia Davis",
    bio: "Just getting started - any tips welcome!",
    subjects: [
      {
        name: "Mathematics",
        grade: "Grade 7",
        topics: [
          { name: "Algebra Basics", status: "IN_PROGRESS", progress: 25, explanation: "Algebra uses variables like x to stand for unknown numbers. Solving an equation like x + 4 = 9 means finding the value of x. Do the same thing to both sides: subtract 4 to get x = 5." },
          { name: "Fractions & Decimals", status: "NOT_STARTED", progress: 0, explanation: "Fractions and decimals both represent parts of a whole. To turn a fraction into a decimal, divide the numerator by the denominator. To add fractions, make the denominators the same first." },
        ],
      },
    ],
    assignments: [
      {
        subject: "Algebra Basics",
        title: "Algebra Basics - Practice Questions",
        questions: [
          { question: "Solve for x: x + 4 = 9", answer: "x = 5" },
          { question: "Solve for x: 3x = 15", answer: "x = 5" },
          { question: "What is the value of 2x when x = 4?", answer: "8" },
          { question: "Solve for x: x/2 = 6", answer: "x = 12" },
          { question: "Solve for x: x - 3 = 10", answer: "x = 13" },
        ],
      },
    ],
    sessions: [
      { subject: "Mathematics", topic: "Algebra Basics", minutes: 12, daysAgo: 3 },
    ],
  },
  {
    email: "maya@demo.com",
    displayName: "Maya Johnson",
    bio: "Science fair champion two years running.",
    subjects: [
      {
        name: "Science",
        grade: "Grade 8",
        scope: "Integrated science",
        topics: [
          { name: "Photosynthesis", status: "MASTERED", progress: 100, explanation: "Photosynthesis is how plants convert light energy into chemical energy. Carbon dioxide and water combine with sunlight to produce glucose and oxygen. It happens in the chloroplasts using the pigment chlorophyll.", suggestions: [
              { name: "Cellular Respiration", description: "Learn how organisms turn glucose back into usable energy.", connection: "The reverse process of photosynthesis — completes the energy story." },
              { name: "Plant Transport", description: "How water and nutrients move through roots, stems, and leaves.", connection: "Connects photosynthesis inputs to how plants are built." },
            ] },
          { name: "Chemical Reactions", status: "MASTERED", progress: 100, explanation: "In a chemical reaction, atoms rearrange to form new substances. Equations show reactants → products, and they must be balanced so atoms are conserved. A catalyst speeds up a reaction without being used up." },
          { name: "Newton's Laws", status: "IN_PROGRESS", progress: 75, explanation: "Newton's first law: objects keep doing what they're doing unless a force acts. Second law: force = mass × acceleration (F = ma). Third law: every action has an equal and opposite reaction.", suggestions: [
              { name: "Friction & Forces", description: "How forces like friction and gravity affect motion.", connection: "Applies Newton's laws to everyday situations." },
              { name: "Work & Energy", description: "The connection between force, motion, and energy.", connection: "Builds on F = ma from Newton's Laws." },
            ] },
          { name: "Ecosystems", status: "IN_PROGRESS", progress: 50, explanation: "An ecosystem is a community of living things interacting with their environment. Energy flows through food chains, starting with producers like plants, then consumers, with decomposers recycling nutrients back into the soil." },
        ],
      },
    ],
    assignments: [
      {
        subject: "Photosynthesis",
        title: "Photosynthesis - Practice Questions",
        questions: [
          { question: "What are the inputs of photosynthesis?", answer: "Carbon dioxide and water (with sunlight)" },
          { question: "What gas does photosynthesis release?", answer: "Oxygen" },
          { question: "Where does photosynthesis occur in a plant?", answer: "In the chloroplasts of leaf cells" },
          { question: "What energy does the plant convert light into?", answer: "Chemical energy stored in glucose" },
          { question: "Name the pigment that absorbs light energy.", answer: "Chlorophyll" },
        ],
        submitted: true,
        aiScore: 94,
        aiFeedback: "Excellent! You clearly understand the inputs, outputs, and location of photosynthesis.",
        teacherScore: 95,
        teacherComment: "Beautiful explanation of chlorophyll's role, Maya!",
        gradedDaysAgo: 7,
      },
      {
        subject: "Chemical Reactions",
        title: "Chemical Reactions - Practice Questions",
        questions: [
          { question: "What is a chemical reaction?", answer: "A process where atoms rearrange to form new substances" },
          { question: "What does a balanced equation conserve?", answer: "Atoms (mass)" },
          { question: "Balance: H₂ + O₂ → H₂O", answer: "2H₂ + O₂ → 2H₂O" },
          { question: "Name the products of burning methane.", answer: "Carbon dioxide and water" },
          { question: "What is a catalyst?", answer: "A substance that speeds up a reaction without being used up" },
        ],
        submitted: true,
        aiScore: 90,
        aiFeedback: "Great understanding of balancing equations. Keep going!",
        gradedDaysAgo: 4,
      },
      {
        subject: "Newton's Laws",
        title: "Newton's Laws - Practice Questions",
        questions: [
          { question: "State Newton's first law.", answer: "An object stays at rest or in uniform motion unless acted on by a force" },
          { question: "What does F = ma describe?", answer: "The relationship between force, mass, and acceleration" },
          { question: "If mass doubles with the same force, what happens to acceleration?", answer: "It halves" },
          { question: "Give an example of Newton's third law.", answer: "Rockets push gas down, gas pushes the rocket up" },
          { question: "What is inertia?", answer: "The resistance of an object to changes in motion" },
        ],
      },
    ],
    sessions: [
      { subject: "Science", topic: "Photosynthesis", minutes: 30, daysAgo: 10 },
      { subject: "Science", topic: "Chemical Reactions", minutes: 25, daysAgo: 6 },
      { subject: "Science", topic: "Newton's Laws", minutes: 20, daysAgo: 2 },
    ],
  },
  {
    email: "noah@demo.com",
    displayName: "Noah Kim",
    bio: "Soccer player. Trying to balance practice and schoolwork.",
    subjects: [
      {
        name: "Science",
        grade: "Grade 8",
        topics: [
          { name: "The Periodic Table", status: "IN_PROGRESS", progress: 20, explanation: "The periodic table organizes all known elements. Each element has an atomic number (number of protons). Elements are arranged in periods (rows) and groups (columns); elements in the same group share similar properties." },
          { name: "Chemical Reactions", status: "NOT_STARTED", progress: 0, explanation: "Chemical reactions rearrange atoms into new substances. A balanced equation conserves mass — the number of atoms on each side must match. Reactants turn into products, often with energy changes." },
        ],
      },
    ],
    assignments: [
      {
        subject: "The Periodic Table",
        title: "The Periodic Table - Practice Questions",
        questions: [
          { question: "What is the atomic symbol for gold?", answer: "Au" },
          { question: "What number on the periodic table equals protons?", answer: "The atomic number" },
          { question: "Which element has symbol H?", answer: "Hydrogen" },
          { question: "What group are the noble gases in?", answer: "Group 18" },
          { question: "What is the atomic number of carbon?", answer: "6" },
        ],
        submitted: true,
        aiScore: 62,
        aiFeedback: "You know the basics. Review the layout of groups and periods.",
        teacherComment: "Noah - check in with me after class for some extra practice.",
        teacherScore: 60,
        gradedDaysAgo: 5,
      },
    ],
    sessions: [
      { subject: "Science", topic: "The Periodic Table", minutes: 10, daysAgo: 8 },
    ],
  },
  {
    email: "ethan@demo.com",
    displayName: "Ethan Brown",
    bio: "Basketball and science fan.",
    subjects: [
      {
        name: "Science",
        grade: "Grade 8",
        topics: [
          { name: "Ecosystems", status: "IN_PROGRESS", progress: 30, explanation: "An ecosystem is all the living and non-living things interacting in an area. Food chains show energy flow starting from producers, and decomposers recycle dead matter back into nutrients for the soil." },
          { name: "Newton's Laws", status: "NOT_STARTED", progress: 0, explanation: "Newton's laws explain how forces affect motion. F = ma means a stronger force makes things accelerate more, while more mass resists acceleration. Every action has an equal and opposite reaction." },
        ],
      },
    ],
    assignments: [
      {
        subject: "Ecosystems",
        title: "Ecosystems - Practice Questions",
        questions: [
          { question: "What is an ecosystem?", answer: "A community of living things interacting with their environment" },
          { question: "What does a food chain begin with?", answer: "A producer (usually a plant)" },
          { question: "What role do decomposers play?", answer: "They break down dead matter and recycle nutrients" },
          { question: "What is a predator?", answer: "An animal that hunts other animals for food" },
          { question: "Give one example of a producer.", answer: "Grass, trees, or algae" },
        ],
        submitted: true,
        aiScore: 70,
        aiFeedback: "Good grasp of food chains. Keep reviewing energy flow in ecosystems.",
        gradedDaysAgo: 3,
      },
    ],
    sessions: [
      { subject: "Science", topic: "Ecosystems", minutes: 12, daysAgo: 7 },
    ],
  },
];

const CLASSES = [
  { name: "Grade 7 Mathematics", inviteCode: "MATH7A", members: ["aiden", "zoe", "liam", "sofia", "olivia"] },
  { name: "Grade 8 Science", inviteCode: "SCI8B", members: ["maya", "noah", "ethan"] },
  { name: "Grade 7 Homeroom", inviteCode: "HOME7C", members: ["aiden", "zoe", "sofia", "maya", "noah"] },
];

type AIConversationSeed = {
  profile: string;
  subject: string;
  topic: string;
  exchanges: { from: "student" | "tutor"; text: string }[];
  daysAgo: number;
};

const AI_CONVERSATIONS: AIConversationSeed[] = [
  {
    profile: "aiden",
    subject: "Algebra Basics",
    topic: "Algebra Basics",
    daysAgo: 1,
    exchanges: [
      { from: "student", text: "Can you explain what a variable is?" },
      { from: "tutor", text: "Sure! A variable is a letter, like x or y, that stands for an unknown number. In 2x + 3 = 11, the x is the number we're trying to find." },
      { from: "student", text: "How do I solve 2x + 3 = 11?" },
      { from: "tutor", text: "Great question. Subtract 3 from both sides to get 2x = 8. Then divide both sides by 2, so x = 4. Try checking: 2(4) + 3 = 11 ✓" },
      { from: "student", text: "What if there are variables on both sides?" },
      { from: "tutor", text: "Then collect the variable terms on one side. For example, in 3x + 2 = x + 8, subtract x from both sides first, then solve." },
    ],
  },
  {
    profile: "aiden",
    subject: "Literary Devices",
    topic: "Literary Devices",
    daysAgo: 3,
    exchanges: [
      { from: "student", text: "What's the difference between a simile and a metaphor?" },
      { from: "tutor", text: "A simile compares two things using 'like' or 'as' (e.g., 'brave as a lion'). A metaphor says one thing IS another directly (e.g., 'time is a thief')." },
      { from: "student", text: "Give me an example of personification." },
      { from: "tutor", text: "Personification gives human qualities to non-human things: 'The wind whispered through the trees.' The wind can't literally whisper!" },
    ],
  },
  {
    profile: "zoe",
    subject: "Percentages",
    topic: "Percentages",
    daysAgo: 1,
    exchanges: [
      { from: "student", text: "How do I find 20% of 150?" },
      { from: "tutor", text: "Multiply 150 by 0.20, which equals 30. Tip: 10% is just a tenth, so 20% is double that — 15 × 2 = 30. Same answer!" },
      { from: "student", text: "How do I convert 0.3 to a percent?" },
      { from: "tutor", text: "Multiply by 100: 0.3 × 100 = 30%. And 45% as a decimal is 0.45." },
    ],
  },
  {
    profile: "liam",
    subject: "Percentages",
    topic: "Percentages",
    daysAgo: 4,
    exchanges: [
      { from: "student", text: "What is a percentage exactly?" },
      { from: "tutor", text: "A percentage is a fraction out of 100. '25%' literally means 25 out of every 100." },
      { from: "student", text: "So what is 25% of 80?" },
      { from: "tutor", text: "Think of 80 as 100 parts. 25% means 25/100, so multiply 80 × 25/100 = 80 × 0.25 = 20." },
    ],
  },
  {
    profile: "sofia",
    subject: "Geometry Basics",
    topic: "Geometry Basics",
    daysAgo: 2,
    exchanges: [
      { from: "student", text: "What's the difference between perimeter and area?" },
      { from: "tutor", text: "Perimeter is the distance around a shape (add all the sides). Area is the space inside it (length × width for a rectangle)." },
      { from: "student", text: "How many degrees are in a triangle?" },
      { from: "tutor", text: "The interior angles of any triangle always add up to 180 degrees." },
    ],
  },
  {
    profile: "maya",
    subject: "Photosynthesis",
    topic: "Photosynthesis",
    daysAgo: 5,
    exchanges: [
      { from: "student", text: "Why do plants need sunlight?" },
      { from: "tutor", text: "Plants need light energy to power photosynthesis — turning carbon dioxide and water into glucose (their food) and oxygen." },
      { from: "student", text: "Where does photosynthesis happen?" },
      { from: "tutor", text: "In the chloroplasts, which are mostly found in the leaf cells. They contain chlorophyll, the green pigment that captures light." },
    ],
  },
  {
    profile: "maya",
    subject: "Newton's Laws",
    topic: "Newton's Laws",
    daysAgo: 1,
    exchanges: [
      { from: "student", text: "Can you explain Newton's second law simply?" },
      { from: "tutor", text: "It says force = mass × acceleration. Push a light object and a heavy object with the same force — the light one accelerates more." },
      { from: "student", text: "Why do rockets work?" },
      { from: "tutor", text: "Newton's third law! The rocket pushes hot gas downward, and the gas pushes the rocket upward with equal force." },
    ],
  },
  {
    profile: "noah",
    subject: "The Periodic Table",
    topic: "The Periodic Table",
    daysAgo: 2,
    exchanges: [
      { from: "student", text: "What is the atomic number?" },
      { from: "tutor", text: "The number of protons in an atom's nucleus. It's what makes each element unique — carbon is 6, oxygen is 8." },
      { from: "student", text: "How do I find the symbol for gold?" },
      { from: "tutor", text: "The symbol is Au, from the Latin 'aurum'. Many symbols come from Latin names." },
    ],
  },
  {
    profile: "ethan",
    subject: "Ecosystems",
    topic: "Ecosystems",
    daysAgo: 3,
    exchanges: [
      { from: "student", text: "What's a food chain?" },
      { from: "tutor", text: "It shows who eats whom in an ecosystem, starting with producers (plants), then consumers. Energy flows from the sun → plant → herbivore → carnivore." },
      { from: "student", text: "What do decomposers do?" },
      { from: "tutor", text: "They break down dead plants and animals, returning nutrients to the soil. Mushrooms and earthworms are decomposers." },
    ],
  },
  {
    profile: "olivia",
    subject: "Algebra Basics",
    topic: "Algebra Basics",
    daysAgo: 1,
    exchanges: [
      { from: "student", text: "I'm brand new to algebra. Where do I start?" },
      { from: "tutor", text: "Start with the idea of a variable — a letter that stands for an unknown number. In x + 4 = 9, the x is the number we're trying to find." },
      { from: "student", text: "How do I solve x + 4 = 9?" },
      { from: "tutor", text: "Do the opposite operation to both sides. Since 4 is added, subtract 4 from both sides: x = 9 - 4, so x = 5. Check: 5 + 4 = 9 ✓" },
      { from: "student", text: "What about 3x = 15?" },
      { from: "tutor", text: "The 3x means 3 multiplied by x. Do the opposite: divide both sides by 3, giving x = 15 ÷ 3 = 5. Check: 3 × 5 = 15 ✓" },
    ],
  },
  {
    profile: "zoe",
    subject: "Fractions & Decimals",
    topic: "Fractions & Decimals",
    daysAgo: 5,
    exchanges: [
      { from: "student", text: "Why is 1/2 equal to 0.5?" },
      { from: "tutor", text: "Because the fraction line means division: 1 ÷ 2 = 0.5. Any fraction is just the numerator divided by the denominator." },
      { from: "student", text: "How do I add 1/4 + 2/4?" },
      { from: "tutor", text: "When denominators match, just add the tops: 1 + 2 = 3, so 1/4 + 2/4 = 3/4. If they differ, find a common denominator first." },
    ],
  },
  {
    profile: "aiden",
    subject: "Percentages",
    topic: "Percentages",
    daysAgo: 2,
    exchanges: [
      { from: "student", text: "A shirt costs $40 and is 20% off. How much is the discount?" },
      { from: "tutor", text: "Find 20% of 40: 40 × 0.20 = 8, so the discount is $8 and you'd pay $32. Nice way to use percentages in real life!" },
      { from: "student", text: "How do I find 25% of 80?" },
      { from: "tutor", text: "Multiply 80 by 0.25 = 20. Quick trick: 25% is a quarter, so 80 ÷ 4 = 20. Same answer, faster." },
    ],
  },
  {
    profile: "sofia",
    subject: "Ratios & Proportions",
    topic: "Ratios & Proportions",
    daysAgo: 1,
    exchanges: [
      { from: "student", text: "What's the difference between a ratio and a proportion?" },
      { from: "tutor", text: "A ratio compares two amounts, like 3:2. A proportion says two ratios are equal — like 3:2 = 6:4. Both show relationships between quantities." },
      { from: "student", text: "If 3 apples cost $6, how much do 6 apples cost?" },
      { from: "tutor", text: "Set up a proportion: 3/$6 = 6/$x. Cross-multiply: 3x = 36, so x = 12. Six apples cost $12." },
    ],
  },
  {
    profile: "noah",
    subject: "Chemical Reactions",
    topic: "Chemical Reactions",
    daysAgo: 1,
    exchanges: [
      { from: "student", text: "What makes a chemical equation balanced?" },
      { from: "tutor", text: "The number of atoms on each side must match. In H₂ + O₂ → H₂O, there are 2 O on the left but only 1 on the right, so you add coefficients: 2H₂ + O₂ → 2H₂O." },
      { from: "student", text: "Why do we need to balance equations?" },
      { from: "tutor", text: "Because matter can't be created or destroyed — atoms just rearrange. Balancing shows the same atoms before and after the reaction." },
    ],
  },
  {
    profile: "ethan",
    subject: "Newton's Laws",
    topic: "Newton's Laws",
    daysAgo: 2,
    exchanges: [
      { from: "student", text: "Why is it harder to stop a bowling ball than a soccer ball?" },
      { from: "tutor", text: "Newton's second law: F = ma. With more mass, the same force produces less acceleration, so heavier things are harder to change — they also take longer to stop." },
      { from: "student", text: "What does 'every action has an equal and opposite reaction' mean?" },
      { from: "tutor", text: "If you push a wall, the wall pushes back with equal force. Rockets work this way: they push gas down, and the gas pushes the rocket up." },
    ],
  },
];

type PeerConvoSeed = {
  between: [string, string];
  messages: [sender: 0 | 1, content: string, daysAgo: number, hour: number][];
};

const PEER_CONVERSATIONS: PeerConvoSeed[] = [
  {
    between: ["aiden", "zoe"],
    messages: [
      [0, "Hey Zoe! Did you finish the algebra homework?", 2, 16],
      [1, "Almost! Stuck on 2x + 3 = 11.", 2, 16],
      [0, "Subtract 3 from both sides first, then divide by 2. Got it?", 2, 17],
      [1, "Oh nice, x = 4. Thanks! Want to study for the quiz together?", 1, 10],
    ],
  },
  {
    between: ["maya", "noah"],
    messages: [
      [0, "Noah, want me to help you with the periodic table?", 3, 15],
      [1, "That would be great, I keep mixing up groups and periods.", 3, 16],
      [0, "Easy trick: periods are rows, groups are columns. Gold is Au 😄", 3, 16],
    ],
  },
  {
    between: ["sofia", "olivia"],
    messages: [
      [1, "Sofia, how do you remember geometry formulas?", 1, 9],
      [0, "I draw them! Area = base × height for rectangles, I just picture a grid.", 1, 9],
      [1, "That's smart. Can we practice together later?", 1, 10],
    ],
  },
];

type TutoringSeed = {
  requester: string;
  type: "LEARN" | "TEACH";
  topic: string;
  grade: string;
  description: string;
  status: "OPEN" | "MATCHED";
  tutor?: string;
  paired?: string;
  daysAgo: number;
};

const TUTORING: TutoringSeed[] = [
  { requester: "aiden", type: "LEARN", topic: "Ratios and proportions", grade: "Grade 7", description: "Want to get better at ratio word problems before the test.", status: "OPEN", daysAgo: 2 },
  { requester: "olivia", type: "LEARN", topic: "Algebra basics", grade: "Grade 7", description: "New to algebra, could use a patient tutor.", status: "OPEN", daysAgo: 1 },
  { requester: "maya", type: "TEACH", topic: "Photosynthesis", grade: "Grade 8", description: "I can help explain photosynthesis and plant biology.", status: "MATCHED", tutor: "maya", paired: "noah", daysAgo: 4 },
  { requester: "noah", type: "LEARN", topic: "Photosynthesis", grade: "Grade 8", description: "Struggling with photosynthesis, need help.", status: "MATCHED", tutor: "maya", paired: "maya", daysAgo: 4 },
];

type BurnoutSeed = {
  profile: string;
  score: number;
  message: string;
  resolved: boolean;
  daysAgo: number;
};

const BURNOUT_ALERTS: BurnoutSeed[] = [
  { profile: "noah", score: 76, message: "Studying irregular hours with low topic progress; signs of disengagement from learning.", resolved: false, daysAgo: 3 },
  { profile: "ethan", score: 61, message: "Long gaps between study sessions and few completed topics suggest early burnout signals.", resolved: false, daysAgo: 1 },
  { profile: "liam", score: 42, message: "Slightly low engagement this week. A lighter, more consistent routine would help.", resolved: true, daysAgo: 10 },
];

// ---------------------------------------------------------------------------
// Seed logic
// ---------------------------------------------------------------------------

async function createUser(email: string, name: string, role: "STUDENT" | "TEACHER", displayName: string, bio: string) {
  const res = (await auth.api.signUpEmail({
    body: { email, password: DEMO_PASSWORD, name },
  })) as any;
  const userId = res.user.id;

  await prisma.user.update({ where: { id: userId }, data: { role, emailVerified: true } });

  const profile = await prisma.profile.findUniqueOrThrow({ where: { userId } });
  await prisma.profile.update({
    where: { id: profile.id },
    data: { displayName, bio, onboardingDone: true },
  });
  return profile;
}

function buildMessages(seed: AIConversationSeed, topicId: string) {
  const msgs: any[] = [];
  seed.exchanges.forEach((ex, i) => {
    const t = daysAgo(seed.daysAgo, i * 1.5);
    const role = ex.from === "student" ? "user" : "assistant";
    msgs.push({ role, content: ex.text, timestamp: t.toISOString(), topicId });
  });
  return msgs;
}

async function main() {
  console.log("🌱 Seeding EduAI demo data...\n");

  // ---- Wipe existing data (FK-safe order) ----
  await prisma.tutoringRequest.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.eduClass.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.user.deleteMany();

  // ---- Teacher ----
  const teacher = await createUser(TEACHER.email, TEACHER.name, "TEACHER", TEACHER.displayName, TEACHER.bio);
  console.log(`✔ Teacher: ${TEACHER.displayName} (${TEACHER.email})`);

  // ---- Students ----
  const profiles: Record<string, any> = {};
  for (const s of STUDENTS) {
    profiles[s.displayName.split(" ")[0].toLowerCase()] = await createUser(s.email, s.displayName, "STUDENT", s.displayName, s.bio);
  }
  console.log(`✔ Students: ${STUDENTS.length} created`);

  // Key by student key
  const byKey = (seed: StudentSeed) => profiles[seed.displayName.split(" ")[0].toLowerCase()];

  // ---- Classes + members ----
  const classMap: Record<string, any> = {};
  const classIdByInvite: Record<string, string> = {};
  for (const c of CLASSES) {
    const cls = await prisma.eduClass.create({
      data: {
        teacherId: teacher.id,
        name: c.name,
        inviteCode: c.inviteCode,
        member: { create: c.members.map((m) => ({ profileId: profiles[m].id })) },
      },
    });
    classMap[c.name] = cls;
    classIdByInvite[c.inviteCode] = cls.id;
  }
  console.log(`✔ Classes: ${CLASSES.map((c) => `${c.name} (${c.inviteCode})`).join(", ")}`);

  // ---- Subjects + topics ----
  const topicIdBy: Record<string, string> = {};
  const subjectIdBy: Record<string, string> = {};
  const topicByName: Record<string, string> = {};
  const subjectByTopic: Record<string, string> = {};
  for (const s of STUDENTS) {
    const profile = byKey(s);
    for (const sub of s.subjects) {
      const subject = await prisma.subject.create({
        data: {
          profileId: profile.id,
          name: sub.name,
          grade: sub.grade,
          scope: sub.scope ?? null,
          topic: {
            create: sub.topics.map((t) => ({
              name: t.name,
              status: t.status,
              progress: t.progress,
              explanation: t.explanation ?? null,
              suggestions: (t.suggestions as Prisma.InputJsonValue) ?? undefined,
            })),
          },
        },
        include: { topic: true },
      });
      subjectIdBy[`${profile.id}:${sub.name}`] = subject.id;
      for (const t of subject.topic) {
        topicIdBy[`${profile.id}:${sub.name}:${t.name}`] = t.id;
        topicByName[`${profile.id}:${t.name}`] = t.id;
        subjectByTopic[`${profile.id}:${t.name}`] = subject.id;
      }
    }
  }
  console.log(`✔ Subjects & topics created for all students`);

  // ---- Teacher subjects + topics ----
  for (const sub of TEACHER_SUBJECTS) {
    const subject = await prisma.subject.create({
      data: {
        profileId: teacher.id,
        name: sub.name,
        grade: sub.grade,
        scope: sub.scope ?? null,
        topic: {
          create: sub.topics.map((t) => ({
            name: t.name,
            status: t.status,
            progress: t.progress,
            explanation: t.explanation ?? null,
            suggestions: (t.suggestions as Prisma.InputJsonValue) ?? undefined,
          })),
        },
      },
      include: { topic: true },
    });
    subjectIdBy[`${teacher.id}:${sub.name}`] = subject.id;
    for (const t of subject.topic) {
      topicIdBy[`${teacher.id}:${sub.name}:${t.name}`] = t.id;
      topicByName[`${teacher.id}:${t.name}`] = t.id;
      subjectByTopic[`${teacher.id}:${t.name}`] = subject.id;
    }
  }
  console.log(`✔ Teacher: ${TEACHER_SUBJECTS.length} subjects with ${TEACHER_SUBJECTS.reduce((n, s) => n + s.topics.length, 0)} topics`);

  // ---- Assignments + submissions ----
  const assignmentIdBy: Record<string, string> = {};
  let submissions = 0;
  for (const s of STUDENTS) {
    const profile = byKey(s);
    for (const a of s.assignments) {
      const subjectKey = `${profile.id}:${s.subjects.find((sub) => sub.topics.some((t) => t.name === a.subject))?.name}`;
      const assignment = await prisma.assignment.create({
        data: {
          subjectId: subjectIdBy[subjectKey],
          creatorId: profile.id,
          title: a.title,
          description: `AI-generated questions based on ${a.subject}`,
          content: {
            questions: a.questions.map((q, i) => ({ ...q, id: `q${i + 1}` })),
          } as Prisma.InputJsonValue,
          dueDate: daysAgo(-7),
        },
      });
      assignmentIdBy[`${profile.id}:${a.title}`] = assignment.id;

      if (a.submitted) {
        await prisma.assignmentSubmission.create({
          data: {
            assignmentId: assignment.id,
            profileId: profile.id,
            content: JSON.stringify(Object.fromEntries(a.questions.map((q, i) => [`q${i + 1}`, q.answer]))),
            status: "GRADED",
            aiScore: a.aiScore ?? null,
            aiFeedback: a.aiFeedback ?? null,
            teacherScore: a.teacherScore ?? null,
            teacherComment: a.teacherComment ?? null,
            submittedAt: daysAgo(a.gradedDaysAgo ?? 5),
            gradedAt: daysAgo((a.gradedDaysAgo ?? 5) - 1),
          },
        });
        submissions++;
      }
    }
  }
  console.log(`✔ Assignments: created for every student (${submissions} submitted & graded)`);

  // ---- Teacher assignments + class submissions ----
  let teacherSubmissions = 0;
  for (const a of TEACHER_ASSIGNMENTS) {
    const subjectKey = `${teacher.id}:${TEACHER_SUBJECTS.find((sub) => sub.topics.some((t) => t.name === a.subject))?.name}`;
    const classId = a.class ? classIdByInvite[a.class] : null;
    const assignment = await prisma.assignment.create({
      data: {
        subjectId: subjectIdBy[subjectKey],
        creatorId: teacher.id,
        classId,
        title: a.title,
        description: `Teacher-made review for ${a.subject}`,
        content: {
          questions: a.questions.map((q, i) => ({ ...q, id: `q${i + 1}`, points: q.points ?? 20 })),
        } as Prisma.InputJsonValue,
        dueDate: daysAgo(-7),
      },
    });

    for (const sub of a.submissions ?? []) {
      const studentSeed = STUDENTS.find((s) => s.email === sub.student);
      if (!studentSeed) continue;
      const studentProfile = byKey(studentSeed);
      await prisma.assignmentSubmission.create({
        data: {
          assignmentId: assignment.id,
          profileId: studentProfile.id,
          content: JSON.stringify(Object.fromEntries(a.questions.map((q, i) => [`q${i + 1}`, q.answer]))),
          status: sub.status,
          aiScore: sub.aiScore ?? null,
          aiFeedback: sub.aiFeedback ?? null,
          teacherScore: sub.teacherScore ?? null,
          teacherComment: sub.teacherComment ?? null,
          submittedAt: daysAgo(sub.submittedDaysAgo ?? 2),
          gradedAt: sub.status === "GRADED" ? daysAgo((sub.submittedDaysAgo ?? 2) - 1) : null,
        },
      });
      teacherSubmissions++;
    }
  }
  console.log(`✔ Teacher: ${TEACHER_ASSIGNMENTS.length} assignments created (${teacherSubmissions} student submissions)`);

  // ---- Study sessions ----
  const sessionsByProfile: Record<string, any[]> = {};
  for (const s of STUDENTS) {
    const profile = byKey(s);
    for (const sess of s.sessions) {
      const topicId = topicByName[`${profile.id}:${sess.topic}`];
      if (!topicId) continue;
      const startedAt = daysAgo(sess.daysAgo, 14);
      const xpEarned = sess.minutes * XP_STUDY_MINUTE;
      const session = await prisma.studySession.create({
        data: {
          profileId: profile.id,
          topicId,
          durationMinutes: sess.minutes,
          xpEarned,
          startedAt,
          lastActiveAt: new Date(startedAt.getTime() + sess.minutes * 60000),
          endedAt: new Date(startedAt.getTime() + sess.minutes * 60000),
        },
      });
      (sessionsByProfile[profile.id] ??= []).push(session);
    }
  }
  console.log(`✔ Study sessions: created for all students`);

  // ---- Teacher study sessions ----
  const teacherSessions: any[] = [];
  for (const sess of TEACHER_SESSIONS) {
    const topicId = topicByName[`${teacher.id}:${sess.topic}`];
    if (!topicId) continue;
    const startedAt = daysAgo(sess.daysAgo, 14);
    const session = await prisma.studySession.create({
      data: {
        profileId: teacher.id,
        topicId,
        durationMinutes: sess.minutes,
        xpEarned: sess.minutes * XP_STUDY_MINUTE,
        startedAt,
        lastActiveAt: new Date(startedAt.getTime() + sess.minutes * 60000),
        endedAt: new Date(startedAt.getTime() + sess.minutes * 60000),
      },
    });
    teacherSessions.push(session);
  }
  console.log(`✔ Teacher: ${teacherSessions.length} study sessions created`);

  // ---- XP transactions + profile totals ----
  for (const s of STUDENTS) {
    const profile = byKey(s);
    let total = 0;

    for (const sub of s.subjects) {
      for (const t of sub.topics) {
        if (t.status === "MASTERED") {
          await prisma.xpTransaction.create({
            data: { profileId: profile.id, amount: XP_TOPIC_MASTERED, reason: "TOPIC_MASTERED", refId: topicIdBy[`${profile.id}:${sub.name}:${t.name}`] },
          });
          total += XP_TOPIC_MASTERED;
        }
      }
    }

    for (const a of s.assignments) {
      if (a.submitted) {
        await prisma.xpTransaction.create({
          data: { profileId: profile.id, amount: XP_ASSIGNMENT_SUBMITTED, reason: "ASSIGNMENT_SUBMITTED", refId: assignmentIdBy[`${profile.id}:${a.title}`] },
        });
        total += XP_ASSIGNMENT_SUBMITTED;
      }
    }

    for (const session of sessionsByProfile[profile.id] ?? []) {
      await prisma.xpTransaction.create({
        data: { profileId: profile.id, amount: session.xpEarned, reason: "STUDY_SESSION", refId: session.id },
      });
      total += session.xpEarned;
    }

    await prisma.profile.update({
      where: { id: profile.id },
      data: { xp: total, level: levelFromXp(total) },
    });
  }
  console.log(`✔ XP history: transactions + levels computed for all students`);

  // ---- Teacher XP ----
  let teacherTotal = 0;
  for (const sub of TEACHER_SUBJECTS) {
    for (const t of sub.topics) {
      if (t.status === "MASTERED") {
        await prisma.xpTransaction.create({
          data: { profileId: teacher.id, amount: XP_TOPIC_MASTERED, reason: "TOPIC_MASTERED", refId: topicIdBy[`${teacher.id}:${sub.name}:${t.name}`] },
        });
        teacherTotal += XP_TOPIC_MASTERED;
      }
    }
  }
  for (const session of teacherSessions) {
    await prisma.xpTransaction.create({
      data: { profileId: teacher.id, amount: session.xpEarned, reason: "STUDY_SESSION", refId: session.id },
    });
    teacherTotal += session.xpEarned;
  }
  await prisma.profile.update({
    where: { id: teacher.id },
    data: { xp: teacherTotal, level: levelFromXp(teacherTotal) },
  });
  console.log(`✔ Teacher: level ${levelFromXp(teacherTotal)} · ${teacherTotal} XP`);

  // ---- AI conversations ----
  for (const c of AI_CONVERSATIONS) {
    const profile = profiles[c.profile];
    const topicId = topicByName[`${profile.id}:${c.topic}`];
    if (!topicId) continue;
    const subjectId = subjectByTopic[`${profile.id}:${c.topic}`];
    if (!subjectId) continue;
    const newMessages = buildMessages(c, topicId) as Prisma.InputJsonValue;
    const existing = await prisma.aiConversation.findUnique({
      where: { profileId_subjectId: { profileId: profile.id, subjectId } },
    });
    await prisma.aiConversation.upsert({
      where: { profileId_subjectId: { profileId: profile.id, subjectId } },
      update: { messages: [...((existing?.messages as any[]) ?? []), ...(newMessages as any[])] },
      create: { profileId: profile.id, subjectId, messages: newMessages },
    });
  }
  console.log(`✔ AI conversations: ${AI_CONVERSATIONS.length} subject chats seeded`);

  // ---- Teacher AI conversation ----
  const teacherTopicId = topicByName[`${teacher.id}:${TEACHER_AI_CONVERSATION.topic}`];
  const teacherSubjectId = subjectByTopic[`${teacher.id}:${TEACHER_AI_CONVERSATION.topic}`];
  if (teacherTopicId && teacherSubjectId) {
    const teacherMsgs = buildMessages(TEACHER_AI_CONVERSATION, teacherTopicId) as Prisma.InputJsonValue;
    await prisma.aiConversation.upsert({
      where: { profileId_subjectId: { profileId: teacher.id, subjectId: teacherSubjectId } },
      update: { messages: teacherMsgs },
      create: { profileId: teacher.id, subjectId: teacherSubjectId, messages: teacherMsgs },
    });
  }
  console.log(`✔ Teacher: AI conversation seeded`);

  // ---- Peer conversations ----
  for (const c of PEER_CONVERSATIONS) {
    const [aKey, bKey] = c.between;
    const a = profiles[aKey];
    const b = profiles[bKey];
    const conversation = await prisma.conversation.create({
      data: { profileIds: [a.id, b.id], status: "ACTIVE", source: "MANUAL" },
    });
    for (const [sender, content, d, hour] of c.messages) {
      await prisma.chatMessage.create({
        data: {
          conversationId: conversation.id,
          senderId: sender === 0 ? a.id : b.id,
          content,
          sentAt: daysAgo(d, hour),
        },
      });
    }
  }
  console.log(`✔ Peer chats: ${PEER_CONVERSATIONS.length} conversations seeded`);

  // ---- Tutoring requests (incl. one matched pair) ----
  const reqByKey: Record<string, any> = {};
  for (const t of TUTORING) {
    const request = await prisma.tutoringRequest.create({
      data: {
        requesterId: profiles[t.requester].id,
        type: t.type,
        topic: t.topic,
        grade: t.grade,
        description: t.description,
        status: t.status,
      },
    });
    reqByKey[t.requester] = request;
  }

  // Pair the MATCHED tutoring requests and open a conversation between them
  const matched = TUTORING.filter((t) => t.status === "MATCHED");
  const pairedConvos = new Set<string>();
  for (const t of matched) {
    const me = reqByKey[t.requester];
    const other = reqByKey[t.paired!];
    await prisma.tutoringRequest.update({
      where: { id: me.id },
      data: { tutorId: t.tutor ? profiles[t.tutor].id : null, pairedId: other.id, resolvedAt: daysAgo(t.daysAgo - 1) },
    });
    const key = [t.requester, t.paired!].sort().join("|");
    if (pairedConvos.has(key)) continue;
    pairedConvos.add(key);
    await prisma.conversation.create({
      data: { profileIds: [profiles[t.requester].id, profiles[t.paired!].id], status: "ACTIVE", source: "PEER_TUTORING" },
    });
  }
  console.log(`✔ Tutoring: ${TUTORING.filter((t) => t.status === "OPEN").length} open + 1 matched pair`);

  // ---- Burnout alerts ----
  for (const b of BURNOUT_ALERTS) {
    await prisma.burnoutAlert.create({
      data: {
        profileId: profiles[b.profile].id,
        alertType: "BURNOUT",
        score: b.score,
        message: b.message,
        resolved: b.resolved,
        createdAt: daysAgo(b.daysAgo),
      },
    });
  }
  console.log(`✔ Burnout alerts: ${BURNOUT_ALERTS.filter((b) => !b.resolved).length} active + 1 resolved`);

  // ---- Summary ----
  console.log("\n✅ Seed complete!");
  console.log("\nDemo accounts (password: demo12345):");
  console.log(`  Teacher  → ${TEACHER.email}  (${TEACHER.displayName})`);
  for (const s of STUDENTS) {
    console.log(`  Student  → ${s.email}  (${s.displayName})`);
  }
  console.log("\nClass invite codes:");
  for (const c of CLASSES) {
    console.log(`  ${c.name}: ${c.inviteCode}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
