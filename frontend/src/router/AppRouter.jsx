import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { LandingPage } from '@/pages/LandingPage';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { ForgotPassword } from '@/pages/ForgotPassword';
import { ResetPassword } from '@/pages/ResetPassword';
import { Dashboard } from '@/pages/Dashboard';
import { Incidents } from '@/pages/Incidents';
import { IncidentDetail } from '@/pages/IncidentDetail';
import { Services } from '@/pages/Services';
import { AIInvestigations } from '@/pages/AIInvestigations';
import { Logs } from '@/pages/Logs';
import { Metrics } from '@/pages/Metrics';
import { KnowledgeBase } from '@/pages/KnowledgeBase';
import { Settings } from '@/pages/Settings';
import { ProfileSettings } from '@/pages/ProfileSettings';
import { LoadingState } from '@/components/common/LoadingState';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingState label="Authenticating session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export const AppRouter = () => {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* Public SaaS Landing & Auth Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected Application Routes */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/incidents" element={<Incidents />} />
          <Route path="/incidents/:incidentId" element={<IncidentDetail />} />
          <Route path="/services" element={<Services />} />
          <Route path="/ai-investigations" element={<AIInvestigations />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/metrics" element={<Metrics />} />
          <Route path="/knowledge" element={<KnowledgeBase />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/settings/profile" element={<ProfileSettings />} />
        </Route>

        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
