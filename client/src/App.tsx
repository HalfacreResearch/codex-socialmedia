import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import ThisWeek from "./pages/ThisWeek";
import VisualizationLibrary from "./pages/VisualizationLibrary";
import MontageStudio from "./pages/MontageStudio";
import Publications from "./pages/Publications";
import ContentCalendar from "./pages/ContentCalendar";
import SettingsPage from "./pages/SettingsPage";

function Router() {
  return (
    <Switch>
      <Route path="/">
        <DashboardLayout>
          <ThisWeek />
        </DashboardLayout>
      </Route>
      <Route path="/visualizations">
        <DashboardLayout>
          <VisualizationLibrary />
        </DashboardLayout>
      </Route>
      <Route path="/montage">
        <DashboardLayout>
          <MontageStudio />
        </DashboardLayout>
      </Route>
      <Route path="/publications">
        <DashboardLayout>
          <Publications />
        </DashboardLayout>
      </Route>
      <Route path="/calendar">
        <DashboardLayout>
          <ContentCalendar />
        </DashboardLayout>
      </Route>
      <Route path="/settings">
        <DashboardLayout>
          <SettingsPage />
        </DashboardLayout>
      </Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
