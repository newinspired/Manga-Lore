import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CardName from '../components/card-name';
import '../styles/result-page.scss';
import socket from '../socket';

const ResultPage = () => {
  const [players, setPlayers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const storedPlayers = localStorage.getItem("finalPlayers");
    if (storedPlayers) {
      setPlayers(JSON.parse(storedPlayers));
    }

    socket.emit("getFinalPlayers");

    const handleFinalPlayers = (finalPlayers) => {
      setPlayers(finalPlayers);
      localStorage.setItem("finalPlayers", JSON.stringify(finalPlayers));

      // 🔹 Sauvegarde aussi pseudo/avatar du joueur actuel
      const me = finalPlayers.find(p => p.id === socket.id);
      if (me) {
        localStorage.setItem("username", me.username);
        localStorage.setItem("avatar", me.avatar);
      }
    };

    const handleGameEnded = ({ players }) => {
      setPlayers(players);
      localStorage.setItem("finalPlayers", JSON.stringify(players));

      const me = players.find(p => p.id === socket.id);
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

  // 🔹 Revenir au salon (même room)
  const handleReturnToSalon = () => {
    const roomCode = localStorage.getItem("roomCode");
    if (roomCode) {
      navigate(`/salon/${roomCode}`);
    } else {
      navigate("/salon");
    }
  };

  return (
    <div className="result-page">
      <h2>Quiz Results</h2>
      <div className="results-container">
        <CardName players={sortedPlayers} showResults={true} />
      </div>

      <div className="return-salon container">
        <button onClick={handleReturnToSalon} className="btn btn-primary">
          Return to Salon
        </button>
      </div>
    </div>
  );
};

export default ResultPage;
