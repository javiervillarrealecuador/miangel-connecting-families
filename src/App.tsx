import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import LoginPage from "./pages/LoginPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import OnboardingPage from "./pages/OnboardingPage";
import DashboardPage from "./pages/DashboardPage";
import NewObservationPage from "./pages/NewObservationPage";
import ObservationsPage from "./pages/ObservationsPage";
import ActivitiesPage from "./pages/ActivitiesPage";
import GoalsPage from "./pages/GoalsPage";
import AlertsPage from "./pages/AlertsPage";
import TeamPage from "./pages/TeamPage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
import DocumentsPage from "./pages/DocumentsPage";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          
          <Route element={<ProtectedRoute />}>
            <Route path="/onboarding/create-child" element={<OnboardingPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/observations" element={<ObservationsPage />} />
            <Route path="/observations/new" element={<NewObservationPage />} />
            <Route path="/activities/search" element={<ActivitiesPage />} />
            <Route path="/goals" element={<GoalsPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/team" element={<TeamPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
