import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AdminModeProvider } from "@/contexts/AdminModeContext";
import { Layout } from "@/components/Layout";
import { Dashboard } from "@/pages/Dashboard";
import { DashboardRole } from "@/pages/DashboardRole";
import { Register } from "@/pages/Register";
import { Pendaftaran } from "@/pages/Pendaftaran";
import { Paywall } from "@/pages/Paywall";
import { Analytics } from "@/pages/Analytics";
import { Export } from "@/pages/Export";
import { Participants } from "@/pages/Participants";
import { Children } from "@/pages/Children";
import { Competitif } from "@/pages/Competitif";
import { MatchDashboard } from "@/pages/MatchDashboard";
import { Tournaments } from "@/pages/Tournaments";
import { TournamentDetail } from "@/pages/TournamentDetail";
import { Admin } from "@/pages/Admin";
import { EventDisplay } from "@/pages/EventDisplay";
import { Home } from "@/pages/Home";
import { Login } from "@/pages/Login";
import { RegisterParticipant } from "@/pages/RegisterParticipant";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10000,
      retry: 1,
    },
  },
});

function RoleRoute({ children, allowedRoles }) {
  const role = localStorage.getItem("role");

  if (!role) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AdminModeProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register-participant" element={<RegisterParticipant />}/>

              <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/dashboard-role" element={<DashboardRole />} />
                <Route path="/admin" element={ <RoleRoute allowedRoles={["guru"]}> <Admin />  </RoleRoute> }/>
                <Route path="/participants" element={<Participants />} />
                <Route path="/children" element={<Children />} />
                <Route path="/register" element={<Register />} />
                <Route path="/pendaftaran" element={<Pendaftaran />} />
                <Route path="/paywall/:uid" element={<Paywall />} />
                <Route path="/analytics/:uid" element={<Analytics />} />
                <Route path="/export" element={<Export />} />
                <Route path="/duel" element={<Competitif />} />
                <Route path="/tournaments" element={<Tournaments />} />
                <Route path="/tournament/:id" element={<TournamentDetail />} />
              </Route>
              <Route path="/match/:room_id" element={<MatchDashboard />} />
              <Route path="/event" element={<EventDisplay />} />
            </Routes>
          </BrowserRouter>
          <Toaster richColors position="top-right" />
        </AdminModeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
