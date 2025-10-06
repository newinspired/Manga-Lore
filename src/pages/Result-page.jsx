import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CardName from '../components/card-name';
import '../styles/result-page.scss';
import socket from '../socket';

const ResultPage = () => {
  const [players, setPlayers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    socket.emit("getFinalPlayers");

    socket.on("finalPlayers", (finalPlayers) => {
      setPlayers(finalPlayers);
    });

    socket.on("gameEnded", ({ players }) => {
      setPlayers(players);
    });

    return () => {
      socket.off("finalPlayers");
      socket.off("gameEnded");
    };
  }, []);

  const sortedPlayers = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));

  // 🔹 Fonction pour revenir dans le salon de la même room
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
