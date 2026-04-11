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
import DashboardPage from "@/pages/dashboard";
import PortfolioPage from "@/pages/portfolio";
import HoldingsPage from "@/pages/holdings";
import DealsPage from "@/pages/deals";
import AlertsPage from "@/pages/alerts";
import SignalsPage from "@/pages/signals";
import MarketDataPage from "@/pages/market-data";
import MmRatesPage from "@/pages/mm-rates";
import { ThemeProvider } from "@/lib/theme";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [isLoading, user, setLocation]);

  if (isLoading || !user) return null;

  return <Component />;
}

function PublicOnlyRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && user) {
      setLocation("/");
    }
  }, [isLoading, user, setLocation]);

  if (isLoading || user) return null;

  return <Component />;
}

function AppRouter() {
  return (
    <Layout>
      <Switch>
        <Route path="/login" component={() => <PublicOnlyRoute component={LoginPage} />} />
        <Route path="/signup" component={() => <PublicOnlyRoute component={SignupPage} />} />
        <Route path="/" component={() => <ProtectedRoute component={DashboardPage} />} />
        <Route path="/portfolio" component={() => <ProtectedRoute component={PortfolioPage} />} />
        <Route path="/holdings" component={() => <ProtectedRoute component={HoldingsPage} />} />
        <Route path="/deals" component={() => <ProtectedRoute component={DealsPage} />} />
        <Route path="/alerts" component={() => <ProtectedRoute component={AlertsPage} />} />
        <Route path="/signals" component={() => <ProtectedRoute component={SignalsPage} />} />
        <Route path="/market-data" component={() => <ProtectedRoute component={MarketDataPage} />} />
        <Route path="/mm-rates" component={() => <ProtectedRoute component={MmRatesPage} />} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AuthProvider>
              <AppRouter />
            </AuthProvider>
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
