import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { AdminPage } from "./pages/AdminPage";
import { DoctorRoomPage } from "./pages/DoctorRoomPage";
import { AppointmentsPage } from "./pages/AppointmentsPage";
import { BillingPage } from "./pages/BillingPage";
import { PatientHistoryPage } from "./pages/PatientHistoryPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Route guard component to handle navigation
const RouteGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  
  // Log navigation for debugging
  React.useEffect(() => {
    console.log('Navigating to:', location.pathname);
  }, [location]);
  
  return <>{children}</>;
};

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <RouteGuard>
          <Routes>
            {/* Main Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/home" element={<Navigate to="/" replace />} />
            
            {/* Patient Routes */}
            <Route path="/appointments" element={<AppointmentsPage />} />
            <Route path="/appointments/*" element={<AppointmentsPage />} />
            <Route path="/history" element={<PatientHistoryPage />} />
            <Route path="/history/*" element={<PatientHistoryPage />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/*" element={<AdminPage />} />
            <Route path="/billing" element={<BillingPage />} />
            <Route path="/billing/*" element={<BillingPage />} />
            
            {/* Doctor Routes */}
            <Route path="/doctor" element={<DoctorRoomPage />} />
            <Route path="/doctor/*" element={<DoctorRoomPage />} />
            
            {/* Legacy redirects */}
            <Route path="/mediqueue" element={<Navigate to="/" replace />} />
            <Route path="/queue" element={<Navigate to="/" replace />} />
            
            {/* Error handling */}
            <Route path="/404" element={<NotFoundPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </RouteGuard>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
