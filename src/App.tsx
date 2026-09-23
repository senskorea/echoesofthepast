import PageErrorBoundary from "./components/PageErrorBoundary";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import EOPHome from "./pages/EOPHome";
import PostcardDetail from "./pages/PostcardDetail";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import LearnHub from "./pages/LearnHub";
import SmartTutor from "./components/SmartTutor";
import GoatCounterAnalytics from "./components/GoatCounterAnalytics";
import { LanguageProvider } from "./lib/i18n";

const queryClient = new QueryClient();

const App = () => (
  <PageErrorBoundary><HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter basename={import.meta.env.BASE_URL}>
            <GoatCounterAnalytics />
            <Routes>
              <Route path="/" element={<EOPHome />} />
              <Route path="/postcards/:id" element={<PostcardDetail />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/learn" element={<LearnHub />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <SmartTutor />
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  </HelmetProvider></PageErrorBoundary>
);

export default App;
