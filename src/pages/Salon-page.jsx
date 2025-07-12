import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import CardName from '../components/card-name.jsx';
import WaitingRoom from '../components/ready-button.jsx';
import GameMode from '../components/game-mode.jsx';
import socket from '../socket.js';
import '../styles/card-name.scss';
import '../styles/salon-page.scss';



function SalonPage() {
  const { room } = useParams(); // Récupère l'ID de la room depuis l'URL
  const location = useLocation(); // Utilise useLocation pour accéder à l'état passé par la page précédente
  const navigate = useNavigate(); // Utilise useNavigate pour naviguer vers d'autres pages
  const { username, avatar } = location.state || {};

  const [selectedMode, setSelectedMode] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const hasJoinedRef = useRef(false);

  useEffect(() => {
    const handleConnect = () => {
      console.log('📡 Connecté avec socket.id :', socket.id);
      if (username && avatar && !hasJoinedRef.current) {
        hasJoinedRef.current = true;
        console.log('📨 Envoi unique de joinRoom');
      }

      socket.emit('joinRoom', { roomId: room, username, avatar }, (response) => {
        if (!response.success) {
          alert(response.message);
          navigate('/'); // retourne à la page d'accueil
        }
      });
    };

    if (socket.connected) {
      handleConnect();
    } else {
      socket.once('connect', handleConnect);
    }

    return () => {
      socket.off('connect', handleConnect);
    };
  }, [room, username, avatar]);

  useEffect(() => {
    const handleHostStatus = (isHost) => {
      setIsHost(isHost);
      console.log('👑 Suis-je le host ? →', isHost);
    };

    socket.on('hostStatus', handleHostStatus);

    return () => {
      socket.off('hostStatus', handleHostStatus);
    };
  }, []);

  // 🎮 Écoute lancement du jeu
  useEffect(() => {
    const handleStartGame = () => {
      navigate(`/game/${room}`);
    };

    socket.on('startGame', handleStartGame);

    return () => {
      socket.off('startGame', handleStartGame);
    };
  }, [room, navigate]);

  return (
    <div className="container">
      <div className="container-bonne-chance">
        <CardName currentSocketId={socket.id} />
      </div>
      <div className="container-waiting">
      
        <WaitingRoom
          roomCode={room}
          username={username}
          selectedMode={selectedMode}
          isHost={isHost} 
        />
        
      </div>
      <GameMode
        roomCode={room}
        username={username}
        setSelectedMode={setSelectedMode}
        isHost={isHost}  
        currentSocketId={socket.id}
      />
    </div>
  );
}

export default SalonPage;