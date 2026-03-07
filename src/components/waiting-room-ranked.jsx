import "../styles/waiting-room-ranked.scss";
import { useState, useEffect } from "react";
import { sendPlayerReady } from "../socket";
import { useNavigate } from "react-router-dom";
import socket from "../socket";

const WaitingRoomRanked = ({ roomCode, username, isHost, allArcs, selectedArcs, setSelectedArcs, isPremiumUser, onBackToMode }) => {

    const navigate = useNavigate();

    const [isReady, setIsReady] = useState(false);

    const [leaderboard, setLeaderboard] = useState([]);
    const [myRank, setMyRank] = useState(null);
    const [myScore, setMyScore] = useState(null);

    const firebaseUid = localStorage.getItem("firebaseUid");

    const handleReadyClick = () => {
    const newReadyState = !isReady;
    setIsReady(newReadyState);
    sendPlayerReady(roomCode, newReadyState, "ranked"); // ✅ IMPORTANT
    };

    const isButtonDisabled = false;
    const buttonLabel = isReady ? "Ready" : "Start Game";

    useEffect(() => {
    if (!firebaseUid) return;
    fetch(`http://localhost:3001/api/ranked/leaderboard/${firebaseUid}`)
        .then(res => res.json())
        .then(data => {
        setLeaderboard(data.topPlayers);
        setMyRank(data.position);
        setMyScore(data.me?.rankedScore || 0);
        });
    }, [firebaseUid]);

    useEffect(() => {
    socket.on("rankedNewQuestion", () => {
        navigate(`/ranked/${roomCode}`);
    });

    return () => socket.off("rankedNewQuestion");
    }, [roomCode]);
            
  return (
    <div className="waiting-room-ranked">
        <table className="leaderboard-table">
            <thead>
            <tr>
                <th>#</th>
                <th>Username</th>
                <th>Score</th>
            </tr>
            </thead>

            <tbody>
                    {leaderboard.map((player, index) => (
                        <tr key={index}>
                        <td>{index + 1}</td>
                        <td>{player.username}</td>
                        <td>{player.rankedScore}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="my-ranking">
                <h3>📍 Your Ranking</h3>
                <p>
                Position: <strong>{myRank}</strong> <br />
                Score: <strong>{myScore}</strong>
                </p>
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
};

export default WaitingRoomRanked;  