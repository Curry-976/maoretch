import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { GuestRoute } from "@/components/GuestRoute";
import Login from "@/pages/Login";
import VerifyOtp from "@/pages/VerifyOtp";
import Dashboard from "@/pages/Dashboard";
import AddPhone from "@/pages/AddPhone";
import Phones from "@/pages/Phones";
import Clients from "@/pages/Clients";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/verify-otp" element={<GuestRoute><VerifyOtp /></GuestRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/add-phone" element={<ProtectedRoute><AddPhone /></ProtectedRoute>} />
          <Route path="/phones" element={<ProtectedRoute><Phones /></ProtectedRoute>} />
          <Route path="/clients" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
