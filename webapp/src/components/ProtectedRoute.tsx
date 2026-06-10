import { Navigate } from "react-router-dom";
import { useSession } from "@/lib/auth-client";

// Once we've seen a session this tab, we keep that fact for the lifetime of
// the page. Sign-out explicitly does a hard reload so this flag naturally
// resets on the next page. We never clear it from inside this component —
// transient null states from background session re-checks must NOT yank the
// user back to /login.
let everAuthenticated = false;

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();

  if (session?.user) {
    everAuthenticated = true;
  }

  // First paint, no cached auth, server hasn't answered yet — wait quietly.
  if (isPending && !everAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Server confirmed there's no session and we never had one — redirect.
  if (!isPending && !session?.user && !everAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
