import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import socket, { sendPlayerReady, onPlayerListUpdate, offPlayerListUpdate } from '../socket';
import '../styles/ready-button.scss';

function WaitingRoom({ roomCode, username, selectedMode, isHost }) {
  const [players, setPlayers] = useState([]);
  const [isReady, setIsReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Écoute les mises à jour des joueurs
    onPlayerListUpdate((updatedPlayers) => {
      setPlayers(updatedPlayers);
    });

    // 🔥 Quand tous les joueurs sont prêts
    socket.on('startGame', () => {
      navigate(`/game/${roomCode}`);
    });
    
    return () => {
      offPlayerListUpdate();
    };
  }, [navigate, roomCode]);

  const handleReadyClick = () => {
    const newReadyState = !isReady;
    setIsReady(newReadyState);
    sendPlayerReady(roomCode, newReadyState);
  };

  // Le bouton est désactivé uniquement si je suis host ET que selectedMode est null
  const isButtonDisabled = isHost && !selectedMode;

  return (
    <div className='container-ready-button'>
      <h2>Salle d’attente : <span className='couleur-pseudo'>{roomCode}</span></h2>
      <span>
        <span className='couleur-pseudo'>{username}</span>{' '}
        {isHost 
          ? 'choisis un mode de jeu et clique sur le bouton quand tu es prêt !' 
          : 'clique sur le bouton quand tu es prêt !'
        }
      </span>

      <button
        onClick={handleReadyClick}
        disabled={isButtonDisabled}
        className={isButtonDisabled ? 'disabled-button' : ''}
      >
        {isReady ? 'Prêt ✔️' : 'En attente...'}
      </button>
    </div>
  );
}

export default WaitingRoom;