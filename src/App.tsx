import React from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DatabaseInitializer } from './components/DatabaseInitializer';
import { NotificationSystem } from './components/NotificationSystem';
import { HomePage } from './pages/HomePage';
import { AdminPage } from './pages/AdminPage';
import { DoctorRoomPage } from './pages/DoctorRoomPage';

function App() {
  const path = window.location.pathname;
  
  const renderPage = () => {
    if (path === '/admin' || path === '/admin/') {
      return <AdminPage />;
    }
    
    if (path === '/doctor' || path === '/doctor/') {
      return <DoctorRoomPage />;
    }
    
    return <HomePage />;
  };

  return (
    <ErrorBoundary>
      <DatabaseInitializer>
        <NotificationSystem />
        {renderPage()}
      </DatabaseInitializer>
    </ErrorBoundary>
  );
}

export default App;