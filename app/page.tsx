import { AuthScreen } from "@/components/AuthScreen";
import { OnboardingScreen } from "@/components/OnboardingScreen";
import { PortalApp } from "@/components/PortalApp";
import { isProfileComplete, loadAccount, loadPortalState } from "@/lib/portal-data";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ auth_error?: string }> }) {
  const [{ auth_error: authError }, { account }] = await Promise.all([searchParams, loadAccount()]);

  if (!account) return <AuthScreen authError={authError === "1"} />;
  if (account.status !== "active" || !isProfileComplete(account)) return <OnboardingScreen profile={account} />;

  const state = await loadPortalState(account);
  return <PortalApp initialState={state} />;
}
