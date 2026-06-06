import { redirect } from "next/navigation";

// Onboarding now begins with the "Book a Free Audit" lead form on the marketing
// site (Phase 2). Keep the old path working by redirecting there.
export default function OnboardingRedirect() {
  redirect("/#book");
}
