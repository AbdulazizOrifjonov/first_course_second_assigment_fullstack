import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext/AuthContext';
import { AppProvider } from './context/AppContext/AppContext';
import { ToastProvider } from './context/ToastContext/ToastContext';
import { LoginPage } from './components/LoginPage/LoginPage';
import { Layout } from './components/Layout/Layout';
import { Dashboard } from './components/Dashboard/Dashboard';
import { DoctorsPage } from './components/pages/DoctorsPage/DoctorsPage';
import { PatientsPage } from './components/pages/PatientsPage/PatientsPage';
import { IllnessesPage } from './components/pages/IllnessesPage/IllnessesPage';
import { AppointmentsPage } from './components/pages/AppointmentsPage/AppointmentsPage';
import { ReportsPage } from './components/pages/ReportsPage/ReportsPage';
import { AuditPage } from './components/pages/AuditPage/AuditPage';
import { SettingsPage } from './components/pages/SettingsPage/SettingsPage';
import { UsersCredentialsPage } from './components/pages/UsersCredentialsPage/UsersCredentialsPage';
import { ChatPage } from './components/pages/ChatPage/ChatPage';

function AppContent() {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (!user) return <LoginPage />;

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':    return <Dashboard />;
      case 'doctors':      return <DoctorsPage />;
      case 'patients':     return <PatientsPage />;
      case 'illnesses':    return <IllnessesPage />;
      case 'appointments': return <AppointmentsPage />;
      case 'reports':      return <ReportsPage />;
      case 'chat':         return <ChatPage />;
      case 'audit':        return <AuditPage />;
      case 'settings':     return <SettingsPage onBack={() => setCurrentPage('dashboard')} />;
      case 'users-credentials': return <UsersCredentialsPage onBack={() => setCurrentPage('dashboard')} />;
      default:             return <Dashboard />;
    }
  };

  return (
    <div className="app-container">
      <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
        {renderPage()}
      </Layout>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
