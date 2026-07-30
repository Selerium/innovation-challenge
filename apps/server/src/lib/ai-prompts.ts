import { prisma } from "./prisma.ts";

type SubjectContext = {
  name: string;
  grade: string;
  scope: string | null;
};

type TopicInfo = {
  name: string;
  status: string;
  progress: number;
};

export async function buildStudyPrompt(
  profileId: string,
  subjectId: string,
  topicName?: string
): Promise<string> {
  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    include: {
      topic: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!subject) {
    throw new Error("Subject not found");
  }

  const topics = subject.topic;
  const weakerTopics = topics.filter(
    (t) => t.progress < 50 || t.status === "NOT_STARTED"
  );

  let prompt = `You are a friendly, encouraging tutor helping a student learn ${subject.name} (${subject.grade}).`;

  if (subject.scope) {
    prompt += ` The current scope of study is: ${subject.scope}.`;
  }

  if (topicName) {
    prompt += `\n\nThe student is currently focusing on "${topicName}". Help them understand this topic deeply.`;
  }

  if (topics.length > 0) {
    prompt += `\n\nHere are the student's topics and their progress:`;
    for (const topic of topics) {
      const icon =
        topic.status === "MASTERED"
          ? "✅"
          : topic.status === "IN_PROGRESS"
          ? "📖"
          : "📝";
      prompt += `\n${icon} ${topic.name} — ${topic.progress}% complete (${topic.status.replace("_", " ").toLowerCase()})`;
    }
  }

  if (weakerTopics.length > 0) {
    prompt += `\n\nThe student needs extra help with:`;
    for (const t of weakerTopics) {
      prompt += `\n- ${t.name} (${t.progress}%)`;
    }
  }

  prompt += `\n\nGuidelines:
- Support the student's learning — don't give away answers directly, guide them.
- Use simple, clear explanations appropriate for their grade level.
- Point them to topics they might be struggling with.
- Be encouraging and celebrate their progress.
- Use analogies and real-world examples where helpful.
- If they ask about something outside ${subject.name}, gently steer back to the subject.`;

  return prompt;
}

export function buildSuggestPrompt(
  subjectName: string,
  topicName: string,
  scope: string | null
): string {
  let prompt = `The student is studying ${subjectName}`;

  if (scope) {
    prompt += ` (${scope})`;
  }

  prompt += ` and has been learning about "${topicName}".`;

  prompt += `\n\nSuggest 3-5 related subtopics or advanced topics that branch naturally from "${topicName}". For each suggestion, provide:
1. The topic name
2. A one-sentence description of what it covers
3. Why it connects to what they've been learning

Format each suggestion as:
TOPIC: [name]
DESCRIPTION: [one sentence]
CONNECTION: [why it connects]`;

  return prompt;
}

export function buildDeepDivePrompt(
  subjectName: string,
  topicName: string
): string {
  return `The student is studying ${subjectName} and wants a deep dive into "${topicName}".

Provide a comprehensive but grade-appropriate explanation of "${topicName}". Include:
1. A clear definition
2. Key concepts and principles
3. A real-world example or application
4. One or two important formulas or relationships (if applicable)
5. A simple analogy to help understand it

Keep the explanation engaging and thorough, but avoid overwhelming the student with too much detail at once.`;
}
