import { useRef } from "react";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { AuthScreen } from "@/components/auth-screen";
import { PageSkeleton } from "@/components/ui";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const { user, isPending } = useCurrentUserState();
  const hold = useRef(false);
  if (!hold.current && isPending) return <PageSkeleton />;
  if (!hold.current && user) return <Navigate to="/" />;
  return (
    <AuthScreen
      holdSession={() => {
        hold.current = true;
      }}
      releaseSession={() => {
        hold.current = false;
      }}
    />
  );
}
