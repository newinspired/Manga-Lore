import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/header.jsx';
import LoginPage from './pages/Login-page.jsx';
import Footer from './components/footer.jsx';
import SalonPage from './pages/salon-page.jsx';
import React, {useState} from 'react';
import GamePage from './pages/game-page.jsx';


function App() {

  const [username, setUsername] = useState('');
  const [roomCode, setRoomCode] = useState('');

  return (
    <BrowserRouter>
      <Header />
      <Routes>

        <Route path="/" element={<LoginPage setUsername={setUsername} setRoomCode={setRoomCode} />} />
        <Route path="/salon/:room" element={<SalonPage username={username} roomCode={roomCode} />} />
        <Route path="/game/:room" element={<GamePage />} />

      </Routes>
      <Footer />
    </BrowserRouter>
  );
}

export default App;