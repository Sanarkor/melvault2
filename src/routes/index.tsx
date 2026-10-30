import { createFileRoute } from "@tanstack/react-router";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { PageSkeleton } from "@/components/ui";
import { VaultScreen } from "@/components/vault-screen";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) return <PageSkeleton />;
  if (!user) return <RedirectToSignIn />;
  return <VaultScreen userId={user.id} email={user.primaryEmail} />;
}
