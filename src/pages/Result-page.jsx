// src/pages/ResultPage.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CardName from '../components/card-name';
import '../styles/result-page.scss';
import socket, { playerId, rejoinRoom } from '../socket';
import Footer from '../components/footer.jsx';

const ResultPage = () => {
  const [players, setPlayers] = useState([]);
  const navigate = useNavigate();
  const roomCode = localStorage.getItem("roomCode");

  useEffect(() => {
    const storedPlayers = localStorage.getItem("finalPlayers");
    if (storedPlayers) {
      try {
        setPlayers(JSON.parse(storedPlayers));
      } catch (e) { /* ignore */ }
    }

    // ask server for finalPlayers (server should respond with finalPlayers)
    socket.emit("getFinalPlayers");

    const handleFinalPlayers = (finalPlayers) => {
      if (!finalPlayers) return;
      setPlayers(finalPlayers);
      localStorage.setItem("finalPlayers", JSON.stringify(finalPlayers));

      // mettre à jour pseudo/avatar local si l'entry contient notre player
      // Attention : server sends id as playerId or socketId depending on impl
      const me = finalPlayers.find(p => p.id === playerId || p.id === socket.id);
      if (me) {
        localStorage.setItem("username", me.username);
        localStorage.setItem("avatar", me.avatar);
      }
    };

    const handleGameEnded = ({ players: finalPlayers }) => {
      if (!finalPlayers) return;
      setPlayers(finalPlayers);
      localStorage.setItem("finalPlayers", JSON.stringify(finalPlayers));
      const me = finalPlayers.find(p => p.id === playerId || p.id === socket.id);
      if (me) {
        localStorage.setItem("username", me.username);
        localStorage.setItem("avatar", me.avatar);
      }
    };

    socket.on("finalPlayers", handleFinalPlayers);
    socket.on("gameEnded", handleGameEnded);

    return () => {
      socket.off("finalPlayers", handleFinalPlayers);
      socket.off("gameEnded", handleGameEnded);
    };
  }, []);

  const sortedPlayers = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));

  // Revenir au salon
  const handleReturnToSalon = () => {
    const roomCodeLocal = localStorage.getItem("roomCode");
    if (roomCodeLocal) {
      navigate(`/salon/${roomCodeLocal}`);
    } else {
      navigate("/salon");
    }
  };

  // Réenvoi des infos pour forcer la réapparition du joueur (avec playerId)
  // Important : on émet rejoinRoom ici pour que le serveur mette à jour socketId
  useEffect(() => {
    const room = localStorage.getItem("roomCode");
    const storedUsername = localStorage.getItem("username");
    const storedAvatar = localStorage.getItem("avatar");

    if (room && storedUsername && storedAvatar) {
      rejoinRoom({ roomCode: room, username: storedUsername, avatar: storedAvatar });
    }
    // only run once on mount
  }, []);

  return (
    <div className="result-page">
      <h2>Quiz Results</h2>
      <div className="results-container">
        <CardName players={sortedPlayers} showResults={true} />
      </div>

      <div className="return-salon-container">
        <button onClick={handleReturnToSalon} className="btn btn-primary">
          Return to Salon
        </button>
      </div>
      <Footer />
    </div>
  );
};

export default ResultPage;
