import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Auth from './pages/Auth';
import Dashboards from './pages/Dashboards';
import { Activity } from 'lucide-react';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center flex-col gap-3">
        <Activity className="w-10 h-10 text-brand-500 animate-pulse" />
        <span className="text-sm font-bold text-slate-400">Loading MediBridge AI...</span>
      </div>
    );
  }

  return user ? <Dashboards /> : <Auth />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
