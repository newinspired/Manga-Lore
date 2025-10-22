import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import socket, {
  sendPlayerReady,
  onPlayerListUpdate,
  offPlayerListUpdate
} from '../socket.js';
import '../styles/waiting-room.scss';

function WaitingRoom({ roomCode, username, isHost, allArcs, selectedArcs, setSelectedArcs }) {
  const [players, setPlayers] = useState([]);
  const [isReady, setIsReady] = useState(false);
  const navigate = useNavigate();
  const { room } = useParams();

  useEffect(() => {
    onPlayerListUpdate((updatedPlayers) => {
      setPlayers(updatedPlayers);
    });

    socket.on('startGame', () => {
      navigate(`/game/${roomCode}`);
    });

    return () => {
      offPlayerListUpdate();
      socket.off('startGame');
    };
  }, [navigate, roomCode]);

  // ✅ Écouter les choix d’arcs en temps réel (pour les non-hosts)
  useEffect(() => {
    const handleArcsUpdate = (updatedArcs) => {
      setSelectedArcs(updatedArcs);
    };

    socket.on('arcsUpdated', handleArcsUpdate);

    return () => {
      socket.off('arcsUpdated', handleArcsUpdate);
    };
  }, [setSelectedArcs]);

  const handleReadyClick = () => {
    const newReadyState = !isReady;
    setIsReady(newReadyState);

    if (isHost) {
      socket.emit('selectedArcs', roomCode, selectedArcs);
    }

    sendPlayerReady(roomCode, newReadyState);
  };

  const isButtonDisabled = isHost && selectedArcs.length === 0;
  const buttonLabel = isReady ? 'Ready' : 'Start Game';
  const allowedArcs = [
    "EastBlue",
    "Alabasta",
    "Skypiea",
    "WaterSeven",
    "ThrillerBark",
    "MarineFord",
  ];

  return (
    <div className='container-ready-button'>
      <div className='waiting-room'>
        <h2>
          WAITING ROOM : <span className='couleur-pseudo'>{roomCode}</span>
        </h2>
      </div>

      <div className="arc-selection">
        <div className='choose-arc'>
          <h3>
            {isHost
              ? "Select arcs you want to be tested on !"
              : "The head of the salon selects the bows !"}
          </h3>
        </div>
        <div className="arc-buttons">
          {allArcs.map(({ label, value }) => {
            const isSelectable = ["EastBlue", "Alabasta", "Skypiea", "WaterSeven", "ThrillerBark", "MarineFord"].includes(value);

            return (
              <button
                key={value}
                className={`arc-button ${value.toLowerCase()} ${
                  selectedArcs.includes(value) ? "selected" : ""
                }`}
                disabled={!isHost || !isSelectable}
                onClick={() => {
                  if (!isHost || !isSelectable) return;

                  const newSelection = selectedArcs.includes(value)
                    ? selectedArcs.filter((a) => a !== value)
                    : [...selectedArcs, value];

                  setSelectedArcs(newSelection);

                  // ✅ Envoi correct de la nouvelle sélection au serveur
                  socket.emit('selectedArcs', roomCode, newSelection);
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
        <div className='select-all'>
          <button
            className="arc-button all"
            disabled={!isHost}
            onClick={() => {
              if (!isHost) return;
              if (selectedArcs.length === allowedArcs.length) {
                setSelectedArcs([]);
                socket.emit('selectedArcs', roomCode, []);
              } else {
                const newSelection = allArcs
                  .filter(arc => allowedArcs.includes(arc.value))
                  .map(arc => arc.value);
                setSelectedArcs(newSelection);
                socket.emit('selectedArcs', roomCode, newSelection);
              }
            }}
          >
            {selectedArcs.length === allArcs.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>
      </div>

      <div className='ready-button'>
        <button
          onClick={handleReadyClick}
          disabled={isButtonDisabled}
          className={isButtonDisabled ? '' : 'active'}
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}

export default WaitingRoom;
