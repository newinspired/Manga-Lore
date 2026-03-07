// src/components/waiting-room.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import socket, { sendPlayerReady, sendSelectedArcs } from '../socket';
import '../styles/waiting-room.scss';

function WaitingRoom({ roomCode, username, isHost, allArcs, selectedArcs, setSelectedArcs, isPremiumUser, onBackToMode }) {
  const [isReady, setIsReady] = useState(false);
  const navigate = useNavigate();
  const { room } = useParams();

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

  useEffect(() => {
    const handleStartGame = () => {
      navigate(`/game/${roomCode}`);
    };

    socket.on("startGame", handleStartGame);

    return () => {
      socket.off("startGame", handleStartGame);
    };
  }, [navigate, roomCode]);

  const handleReadyClick = () => {
    const newReadyState = !isReady;
    setIsReady(newReadyState);

    if (isHost) {
      sendSelectedArcs(roomCode, selectedArcs);
    }

    sendPlayerReady(roomCode, newReadyState);
  };

  const isButtonDisabled = isHost && selectedArcs.length === 0;
  const buttonLabel = isReady ? 'Not ready' : 'Ready';
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
      <div>
        <h2>
          Select arcs you want to be tested on !
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

  {isHost ? (
    <>
      <div className="arc-buttons">
        {allArcs.map(({ label, value, isPremium }) => {
          const isLocked = isPremium && !isPremiumUser;
          return (
            <button
              key={value}
              className={`arc-button ${value.toLowerCase()} ${
                selectedArcs.includes(value) ? "selected" : ""
              }`}
              disabled={isLocked}
              onClick={() => {
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
          onClick={() => {

            const selectableArcs = isPremiumUser
              ? allArcs.map(arc => arc.value)
              : allArcs
                  .filter(arc => !arc.isPremium)
                  .map(arc => arc.value);

            if (selectedArcs.length === selectableArcs.length) {
              setSelectedArcs([]);
              sendSelectedArcs(roomCode, []);
            } else {
              setSelectedArcs(selectableArcs);
              sendSelectedArcs(roomCode, selectableArcs);
            }
          }}
        >
          {selectedArcs.length === allArcs.length
            ? 'Deselect All'
            : 'Select All'}
        </button>
      </div>
    </>
  ) : (
    <div className="selected-arcs-display">

      {selectedArcs.length === 0 && (
        <p>The host has not selected any arcs yet.</p>
      )}

      {selectedArcs.length > 0 && (
        <>
          {selectedArcs.length === allArcs.length && (
            <p>
              The host selected all arcs of the game (East Blue → Elbaf).
            </p>
          )}

          {selectedArcs.length === allArcs.filter(a => !a.isPremium).length && (
            <p>
              The host selected all free arcs.
            </p>
          )}

          {selectedArcs.length !== allArcs.length &&
           selectedArcs.length !== allArcs.filter(a => !a.isPremium).length && (
            <>
              <p>Selected arcs:</p>
              <ul>
                {selectedArcs.map(value => {
                  const arc = allArcs.find(a => a.value === value);
                  return (
                    <li key={value}>
                      {arc?.label || value}
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </>
      )}
    </div>
  )}

</div>

      <div className='ready-button'>
        <button
          onClick={handleReadyClick}
          disabled={isButtonDisabled}
          className={isButtonDisabled ? '' : 'active'}
        >
          {buttonLabel}
        </button>
        <button
          className="back-to-mode"
          onClick={onBackToMode}
          >Back to mode selection
        </button>
      </div>
    </div>
  );
}

export default WaitingRoom;
