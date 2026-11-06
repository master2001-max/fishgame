import React, { useState } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import MainMenu from './components/MainMenu';
import GameScreen from './components/GameScreen';
import Leaderboard from './components/Leaderboard';
import Settings from './components/Settings';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('login'); // 'login' | 'register' | 'menu' | 'game' | 'leaderboard' | 'settings'
  const [currentUser, setCurrentUser] = useState('');

  const handleAuthSuccess = (username) => {
    setCurrentUser(username);
    setCurrentScreen('menu'); // Goes to Hunter's Hub
  };

  const handleLogout = () => {
    setCurrentUser('');
    setCurrentScreen('login');
  };

  const handleNavigation = (destination) => {
    setCurrentScreen(destination); // Switches to 'game', 'leaderboard', or 'settings'
  };

  return (
    <main className="w-screen h-screen overflow-hidden bg-[url('https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center flex items-center justify-center">
      
      {currentScreen === 'login' && (
        <Login 
          onLoginSuccess={handleAuthSuccess}
          onSwitchToRegister={() => setCurrentScreen('register')}
        />
      )}

      {currentScreen === 'register' && (
        <Register 
          onRegisterSuccess={handleAuthSuccess}
          onSwitchToLogin={() => setCurrentScreen('login')}
        />
      )}

      {currentScreen === 'menu' && (
        <MainMenu 
          username={currentUser}
          onNavigate={handleNavigation}
          onLogout={handleLogout}
        />
      )}

      {currentScreen === 'game' && (
        <GameScreen onReturnHome={() => setCurrentScreen('menu')} />
      )}

      {currentScreen === 'leaderboard' && (
        <Leaderboard onReturnHome={() => setCurrentScreen('menu')} />
      )}

      {currentScreen === 'settings' && (
        <Settings onReturnHome={() => setCurrentScreen('menu')} />
      )}

    </main>
  );
}