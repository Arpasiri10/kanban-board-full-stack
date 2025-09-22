import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import LoginForm from './components/Auth/LoginForm';
import BoardList from './components/Board/BoardList';
import KanbanBoard from './components/Board/KanbanBoard';
import NotificationPanel from './components/Notifications/NotificationPanel';
import { Board } from './types';

function AppContent() {
  const { state, dispatch } = useApp();
  const [currentBoard, setCurrentBoard] = useState<Board | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);

  if (!state.auth.isAuthenticated) {
    return <LoginForm />;
  }

  if (currentBoard) {
    return (
      <div className="relative">
        <KanbanBoard
          board={currentBoard}
          onBack={() => setCurrentBoard(null)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <BoardList
        onSelectBoard={setCurrentBoard}
        showLogoutButton={true}
        onLogout={() => dispatch({ type: 'LOGOUT' })}
      />
      <NotificationPanel
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;