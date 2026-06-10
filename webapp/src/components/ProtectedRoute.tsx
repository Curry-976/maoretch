import { Navigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useSession } from "@/lib/auth-client";

// Module-level cache: once we know there's a session, we keep that fact
// across re-renders / tab refocuses. Cleared on explicit sign-out (the
// next session fetch resolves to null and we drop the user).
let lastKnownAuthenticated = false;

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const wasAuthenticated = useRef(lastKnownAuthenticated);
  const [, force] = useState(0);

  useEffect(() => {
    if (session?.user) {
      lastKnownAuthenticated = true;
      wasAuthenticated.current = true;
      force((n) => n + 1);
    } else if (!isPending) {
      // Server confirmed there's no session — clear the cache.
      lastKnownAuthenticated = false;
      wasAuthenticated.current = false;
      force((n) => n + 1);
    }
  }, [session?.user, isPending]);

  // First visit, no cached session: wait briefly for the check.
  if (isPending && !wasAuthenticated.current) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Confirmed unauthenticated: redirect to login.
  if (!isPending && !session?.user && !wasAuthenticated.current) {
    return <Navigate to="/login" replace />;
  }

  // Authenticated — or we previously were and are re-checking. Render the
  // page either way: the brief re-check on tab focus must not unmount it.
  return <>{children}</>;
}
