import { Navigate } from "react-router-dom";
import { useSession } from "@/lib/auth-client";

export function GuestRoute({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();

  // Once the session resolves, redirect authenticated users to the dashboard.
  // While the check is in flight on first paint, show a quiet placeholder so
  // we don't flash the login form for users who are actually signed in.
  if (isPending) {
    return <div className="min-h-screen bg-background" aria-hidden />;
  }

  if (session?.user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
