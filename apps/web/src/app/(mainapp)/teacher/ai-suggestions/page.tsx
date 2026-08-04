"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/lib/profile-context";
import { PageLoading } from "@/components/ui/loading";
import { toast } from "sonner";

type Suggestion = {
  category: "At-risk student" | "Class-wide" | "Topic mastery" | "Grading";
  priority: "High" | "Medium" | "Low";
  title: string;
  description: string;
  action: string;
  students?: string[];
};

type ClassSuggestions = {
  className: string;
  inviteCode: string;
  suggestions: Suggestion[];
};

const SUGGESTIONS: ClassSuggestions[] = [
  {
    className: "Grade 7 Mathematics",
    inviteCode: "MATH7A",
    suggestions: [
      {
        category: "At-risk student",
        priority: "High",
        title: "Check in with Noah — possible disengagement",
        description:
          "Noah has an unresolved burnout score of 76 with irregular study hours and slow topic progress. He hasn't submitted the Percentages Practice yet.",
        action: "Schedule a 1:1 check-in and offer a lighter study plan this week.",
        students: ["Noah Kim"],
      },
      {
        category: "Grading",
        priority: "High",
        title: "4 submissions are waiting for a grade",
        description:
          "The Algebra Basics Unit Warm-Up and Percentages Practice have ungraded submissions. Zoe's warm-up has a low AI score of 74 — worth reviewing with her.",
        action: "Open Grade Assignments to review the pending submissions.",
      },
      {
        category: "Topic mastery",
        priority: "Medium",
        title: "Review two-step equations with the class",
        description:
          "Zoe, Sofia, and Olivia all missed inverse-operation questions on the warm-up. A short whole-class review before moving on would help.",
        action: "Post a short two-step equations warm-up to MATH7A.",
        students: ["Zoe Chen", "Sofia Ramirez", "Olivia Davis"],
      },
      {
        category: "Topic mastery",
        priority: "Low",
        title: "Aiden is ready for harder content",
        description:
          "Aiden scored 90 on the Percentages Practice and has mastered Algebra Basics. He may benefit from extension work on linear equations.",
        action: "Suggest a challenging linear-equations topic for Aiden.",
        students: ["Aiden Patel"],
      },
    ],
  },
  {
    className: "Grade 8 Science",
    inviteCode: "SCI8B",
    suggestions: [
      {
        category: "At-risk student",
        priority: "High",
        title: "Ethan is showing early burnout signs",
        description:
          "Ethan's burnout score is 61 with long gaps between sessions. His Forces & Motion Quiz submission is pending and his AI score was only 69.",
        action: "Reach out with encouragement and a lighter study routine.",
        students: ["Ethan Brown"],
      },
      {
        category: "Topic mastery",
        priority: "Medium",
        title: "Re-teach the relationship in F = ma",
        description:
          "Ethan's quiz answer suggested he believes acceleration scales with mass. A quick visual demo or guided problem set would clarify it.",
        action: "Add a F = ma guided-practice set to SCI8B.",
        students: ["Ethan Brown"],
      },
      {
        category: "Class-wide",
        priority: "Low",
        title: "Maya could lead a photosynthesis study group",
        description:
          "Maya mastered Photosynthesis and scored well on the review. Pairing her to lead a group review could help Noah and others.",
        action: "Encourage a peer-led photosynthesis review session.",
        students: ["Maya Johnson", "Noah Kim"],
      },
    ],
  },
  {
    className: "Grade 7 Homeroom",
    inviteCode: "HOME7C",
    suggestions: [
      {
        category: "Class-wide",
        priority: "Low",
        title: "Balance study load across the week",
        description:
          "Several students concentrate their study in a single subject per week. Spreading sessions out is linked to better retention and lower burnout.",
        action: "Share a weekly balanced-study schedule with the class.",
      },
    ],
  },
];

const PRIORITY_STYLES: Record<Suggestion["priority"], string> = {
  High: "bg-red-500/15 text-red-600 dark:text-red-400",
  Medium: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  Low: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
};

const CATEGORY_ICONS: Record<Suggestion["category"], string> = {
  "At-risk student": "M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Zm1.294 6.336a6.721 6.721 0 0 1-3.17.789 6.721 6.721 0 0 1-3.168-.789 3.376 3.376 0 0 1 6.338 0Z",
  "Class-wide": "M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z",
  "Topic mastery": "M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-3.044 0",
  Grading: "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z",
};

export default function AISuggestionsPage() {
  const router = useRouter();
  const { user } = useProfile();

  useEffect(() => {
    if (user != null && user.role !== "TEACHER") {
      router.replace("/dashboard");
    }
  }, [user, router]);

  if (user == null) {
    return <PageLoading />;
  }

  if (user.role !== "TEACHER") {
    return <PageLoading />;
  }

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">AI Suggestions</h1>
          <p className="subheading text-muted-foreground mt-1">
            Personalized recommendations for your classes, based on your students
          </p>
        </div>

        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
          <p className="text-sm">
            <span className="font-semibold text-primary">Preview mode.</span>{" "}
            These suggestions show how the AI will analyze your students&apos; progress, submissions,
            and burnout risk. Full generation is coming soon.
          </p>
          <button
            onClick={() => toast.info("AI suggestion generation is coming soon")}
            className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Regenerate
          </button>
        </div>

        <div className="space-y-8">
          {SUGGESTIONS.map((cls) => (
            <section key={cls.inviteCode}>
              <div className="flex items-baseline justify-between mb-3">
                <h2 className="text-lg font-semibold">{cls.className}</h2>
                <span className="text-xs text-muted-foreground">Invite · {cls.inviteCode}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {cls.suggestions.map((s) => (
                  <div
                    key={s.title}
                    className="flex flex-col rounded-xl border border-border bg-secondary p-5"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${PRIORITY_STYLES[s.priority]}`}
                      >
                        {s.priority} priority
                      </span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="size-5 text-primary"
                      >
                        <path d={CATEGORY_ICONS[s.category]} />
                      </svg>
                    </div>

                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                      {s.category}
                    </div>
                    <h3 className="text-sm font-semibold leading-snug">{s.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.description}</p>

                    {s.students && s.students.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {s.students.map((name) => (
                          <span
                            key={name}
                            className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                          >
                            {name}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 rounded-lg border border-border bg-muted/40 px-3.5 py-2.5">
                      <div className="text-xs font-medium text-muted-foreground mb-0.5">
                        Suggested action
                      </div>
                      <div className="text-sm">{s.action}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
