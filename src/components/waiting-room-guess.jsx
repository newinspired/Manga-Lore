import "../styles/waiting-room.scss";
import { useState } from "react";
import { sendPlayerReady } from "../socket";

const WaitingRoomGuess = ({ roomCode, username, isHost, allArcs, selectedArcs, setSelectedArcs, isPremiumUser }) => {

    const [isReady, setIsReady] = useState(false);

    const handleReadyClick = () => {
    const newReadyState = !isReady;
    setIsReady(newReadyState);
    sendPlayerReady(roomCode, newReadyState);
    };
    const isButtonDisabled = false;
    const buttonLabel = isReady ? "Ready" : "Start Game";
    
  return (
    <div className="waiting-room-guess">

        <div className='ready-button'>
            <button
            onClick={handleReadyClick}
            disabled={isButtonDisabled}
            className={isButtonDisabled ? '' : 'active'}
            >
            {buttonLabel}
            </button>
            <button className='back-to-mode'
                onClick={() => window.location.href = `/salon/${roomCode}`}
            >
                Back to mode selection
            </button>
        </div>
    </div>
    );
};

export default WaitingRoomGuess;                                   