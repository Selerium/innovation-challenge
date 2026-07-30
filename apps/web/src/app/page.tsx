import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="text-center">
        <h1 className="text-5xl font-bold tracking-tight">
          <span className="text-primary">Edu</span>AI
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-md">
          Personalized AI-powered learning with gamification, peer tutoring, and smart analytics.
        </p>
      </div>
      <div className="flex gap-4">
        <Link
          href="/auth/sign-in"
          className="rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Sign In
        </Link>
        <Link
          href="/auth/sign-up"
          className="rounded-lg border border-border px-6 py-3 font-medium hover:bg-secondary transition-colors"
        >
          Sign Up
        </Link>
      </div>
    </div>
  );
}
