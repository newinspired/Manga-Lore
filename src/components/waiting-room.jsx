// src/components/waiting-room.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import socket, { sendPlayerReady, onPlayerListUpdate, offPlayerListUpdate, sendSelectedArcs } from '../socket';
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

  // Écouter les choix d’arcs en temps réel (pour les non-hosts)
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
      // envoie via helper
      sendSelectedArcs(roomCode, selectedArcs);
    }

    sendPlayerReady(roomCode, newReadyState);
  };

  useEffect(() => {
    onPlayerListUpdate((updatedPlayers) => {
      setPlayers(updatedPlayers);

      console.log("---- LISTE DES JOUEURS (WaitingRoom) ----");
      updatedPlayers.forEach(p => {
        console.log(`"${p.username}" : ${p.isHost ? "host" : "not host"}`);
      });
      console.log("-------------------------------------------");
    });

    socket.on('startGame', () => {
      navigate(`/game/${roomCode}`);
    });

    return () => {
      offPlayerListUpdate();
      socket.off('startGame');
    };
  }, [navigate, roomCode]);


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
            return (
              <button
                key={value}
                className={`arc-button ${value.toLowerCase()} ${selectedArcs.includes(value) ? "selected" : ""}`}
                disabled={!isHost}
                onClick={() => {
                  if (!isHost) return;

                  const newSelection = selectedArcs.includes(value)
                    ? selectedArcs.filter((a) => a !== value)
                    : [...selectedArcs, value];

                  setSelectedArcs(newSelection);
                  sendSelectedArcs(roomCode, newSelection);
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
                sendSelectedArcs(roomCode, []);
              } else {
                const newSelection = allArcs
                  .filter(arc => allowedArcs.includes(arc.value))
                  .map(arc => arc.value);
                setSelectedArcs(newSelection);
                sendSelectedArcs(roomCode, newSelection);
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
