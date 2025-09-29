import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/Login-page.jsx';
import SalonPage from './pages/Salon-page.jsx';
import React, { useState, useEffect } from 'react';
import GamePage from './pages/game-page.jsx';
import ResultPage from './pages/Result-page.jsx';
import CorrectionPage from './pages/CorrectionPage.jsx';
import { auth } from './firebase.js'; // ton fichier firebase.js
import { onAuthStateChanged } from 'firebase/auth';
import Login from './components/login.jsx';
import RegisterPage from './components/register.jsx';

function App() {
  const [user, setUser] = useState(null); // utilisateur connecté
  const [username, setUsername] = useState('');
  const [roomCode, setRoomCode] = useState('');

  // Vérifie l'état de connexion Firebase pour gérer le contenu premium
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser); // null si non connecté
      if (currentUser) {
        setUsername(currentUser.email); // ou currentUser.displayName si défini
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage setUsername={setUsername} setRoomCode={setRoomCode} />} />
        <Route path="/salon/:room" element={<SalonPage username={username} roomCode={roomCode} user={user} />} />
        <Route path="/game/:room" element={<GamePage user={user} />} />
        <Route path="/correction/:room" element={<CorrectionPage user={user} />} />
        <Route path="/result/:room" element={<ResultPage user={user} />} />


        <Route path="/login" element={<Login setUsername={setUsername} setRoomCode={setRoomCode} />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
