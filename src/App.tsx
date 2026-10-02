import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { AppLayout } from './components/layout/AppLayout.js';
import { LoginPage } from './pages/LoginPage.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { LeadsPage } from './pages/LeadsPage.js';
import { ClientsPage } from './pages/ClientsPage.js';
import { ClientDetailPage } from './pages/ClientDetailPage.js';
import { DealsPage } from './pages/DealsPage.js';
import { PaymentsPage } from './pages/PaymentsPage.js';
import { TasksPage } from './pages/TasksPage.js';
import { FollowupsPage } from './pages/FollowupsPage.js';
import { AccountRegistryPage } from './pages/AccountRegistryPage.js';
import { RenewalsPage } from './pages/RenewalsPage.js';
import { ReportsPage } from './pages/ReportsPage.js';
import { AIAssistantPage } from './pages/AIAssistantPage.js';
import { SettingsPage } from './pages/SettingsPage.js';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>('/dashboard');

  // Handle client detail path: e.g. /clients/cli-abc-1
  const isClientDetail = currentPath.startsWith('/clients/') && currentPath !== '/clients';
  const selectedClientId = isClientDetail ? currentPath.replace('/clients/', '') : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400 text-xs">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="font-semibold text-slate-300">Initializing PARxCON Ops Agent...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const renderPage = () => {
    if (isClientDetail && selectedClientId) {
      return (
        <ClientDetailPage
          clientId={selectedClientId}
          onBack={() => setCurrentPath('/clients')}
          onNavigate={(path) => setCurrentPath(path)}
        />
      );
    }

    switch (currentPath) {
      case '/dashboard':
        return <DashboardPage onNavigate={(path) => setCurrentPath(path)} />;
      case '/leads':
        return <LeadsPage onNavigate={(path) => setCurrentPath(path)} />;
      case '/clients':
        return <ClientsPage onNavigate={(path) => setCurrentPath(path)} />;
      case '/deals':
        return <DealsPage onNavigate={(path) => setCurrentPath(path)} />;
      case '/payments':
        return <PaymentsPage onNavigate={(path) => setCurrentPath(path)} />;
      case '/tasks':
        return <TasksPage />;
      case '/followups':
        return <FollowupsPage />;
      case '/accounts':
        return <AccountRegistryPage />;
      case '/renewals':
        return <RenewalsPage />;
      case '/reports':
        return <ReportsPage />;
      case '/ai-assistant':
        return <AIAssistantPage />;
      case '/settings':
        return <SettingsPage />;
      default:
        return <DashboardPage onNavigate={(path) => setCurrentPath(path)} />;
    }
  };

  return (
    <AppLayout currentPath={currentPath} onNavigate={(path) => setCurrentPath(path)}>
      {renderPage()}
    </AppLayout>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
