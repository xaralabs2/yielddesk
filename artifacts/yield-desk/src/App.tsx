import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Layout } from "@/components/layout";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import SignupPage from "@/pages/signup";
import PublicHomePage from "@/pages/public-home";
import DashboardPage from "@/pages/dashboard";
import PortfolioPage from "@/pages/portfolio";
import HoldingsPage from "@/pages/holdings";
import DealsPage from "@/pages/deals";
import AlertsPage from "@/pages/alerts";
import SignalsPage from "@/pages/signals";
import InvestmentDeskPage from "@/pages/investment-desk";
import DiasporaPage from "@/pages/diaspora";
import SimulatorPage from "@/pages/simulator";
import ComparePage from "@/pages/compare";
import PublicMarketsPage from "@/pages/public-markets";
import NigeriaPage from "@/pages/nigeria";
import PublicRatesPage from "@/pages/public-rates";
import PublicResearchPage from "@/pages/public-research";
import GuestSimulatorPage from "@/pages/guest-simulator";
import { ThemeProvider } from "@/lib/theme";
import { defaultQueryFn } from "@/lib/api-helpers";
import { setBaseUrl } from "@workspace/api-client-react";

setBaseUrl(import.meta.env.PROD ? null : import.meta.env.VITE_API_URL || null);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, refetchOnWindowFocus: false, queryFn: defaultQueryFn as any },
  },
});

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) setLocation("/login");
  }, [isLoading, user, setLocation]);

  if (isLoading || !user) return null;
  return <Component />;
}

function PublicOnlyRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && user) setLocation("/dashboard");
  }, [isLoading, user, setLocation]);

  if (isLoading || user) return null;
  return <Component />;
}

function SimulatorRoute() {
  const { user } = useAuth();
  return user ? <SimulatorPage /> : <GuestSimulatorPage />;
}

function AppRouter() {
  return (
    <Layout>
      <Switch>
        <Route path="/login" component={() => <PublicOnlyRoute component={LoginPage} />} />
        <Route path="/signup" component={() => <PublicOnlyRoute component={SignupPage} />} />
        <Route path="/" component={PublicHomePage} />
        <Route path="/dashboard" component={() => <ProtectedRoute component={DashboardPage} />} />
        <Route path="/compare" component={() => <ProtectedRoute component={ComparePage} />} />
        <Route path="/investment-desk" component={() => <ProtectedRoute component={InvestmentDeskPage} />} />
        <Route path="/diaspora" component={() => <ProtectedRoute component={DiasporaPage} />} />
        <Route path="/nigeria" component={NigeriaPage} />
        <Route path="/markets" component={PublicMarketsPage} />
        <Route path="/rates" component={PublicRatesPage} />
        <Route path="/research" component={PublicResearchPage} />
        <Route path="/simulator" component={SimulatorRoute} />
        <Route path="/portfolio" component={() => <ProtectedRoute component={PortfolioPage} />} />
        <Route path="/holdings" component={() => <ProtectedRoute component={HoldingsPage} />} />
        <Route path="/deals" component={() => <ProtectedRoute component={DealsPage} />} />
        <Route path="/alerts" component={() => <ProtectedRoute component={AlertsPage} />} />
        <Route path="/signals" component={() => <ProtectedRoute component={SignalsPage} />} />
        <Route path="/market-data" component={PublicMarketsPage} />
        <Route path="/mm-rates" component={PublicRatesPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AuthProvider><AppRouter /></AuthProvider>
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
