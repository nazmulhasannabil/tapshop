import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { OnboardingScreen } from "@/components/onboarding/onboarding-screen";
import { getSession } from "@/lib/auth/server";
import { ONBOARDING_COOKIE } from "@/lib/constants";

export default async function RootPage() {
  const cookieStore = await cookies();
  const onboardingDone = cookieStore.get(ONBOARDING_COOKIE);

  if (onboardingDone) {
    const session = await getSession();
    redirect(session ? "/home" : "/login");
  }

  return <OnboardingScreen />;
}
