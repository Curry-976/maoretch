import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { GuestRoute } from "@/components/GuestRoute";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import AddPhone from "@/pages/AddPhone";
import Phones from "@/pages/Phones";
import Clients from "@/pages/Clients";
import Pipeline from "@/pages/Pipeline";
import Sellers from "@/pages/Sellers";
import Activity from "@/pages/Activity";
import Users from "@/pages/Users";
import Documents from "@/pages/Documents";
import DocumentEditor from "@/pages/DocumentEditor";
import DocumentView from "@/pages/DocumentView";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Don't refetch every time the user comes back to the tab — the app
      // felt like it was reloading on every focus event.
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      // Consider data fresh for 1 minute, then refetch in background only.
      staleTime: 60_000,
      retry: 1,
    },
  },
});

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      >
        <Routes location={location}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/pipeline" element={<ProtectedRoute><Pipeline /></ProtectedRoute>} />
          <Route path="/add-phone" element={<ProtectedRoute><AddPhone /></ProtectedRoute>} />
          <Route path="/phones" element={<ProtectedRoute><Phones /></ProtectedRoute>} />
          <Route path="/sellers" element={<ProtectedRoute><Sellers /></ProtectedRoute>} />
          <Route path="/clients" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
          <Route path="/activity" element={<ProtectedRoute><Activity /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
          <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
          <Route path="/documents/new" element={<ProtectedRoute><DocumentEditor /></ProtectedRoute>} />
          <Route path="/documents/:id" element={<ProtectedRoute><DocumentView /></ProtectedRoute>} />
          <Route path="/documents/:id/edit" element={<ProtectedRoute><DocumentEditor /></ProtectedRoute>} />
          {/* Old OTP route — redirect to login for users who still have the URL bookmarked */}
          <Route path="/verify-otp" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
