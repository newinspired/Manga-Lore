import '../styles/question.scss';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import socket from '../socket';
import { playerId } from "../socket";

function CorrectionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { answersHistory = [], players = [], room, currentSocketId } = location.state || {};

  const [questionIndex, setQuestionIndex] = useState(0);
  const [playerIndex, setPlayerIndex] = useState(0);
  const [currentPlayer, setCurrentPlayer] = useState(players[0] || null);
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    const me = players.find(p => p.id === playerId);
    if (me?.isHost) setIsHost(true);

    socket.on("correctionUpdate", ({ questionIndex, playerIndex }) => {
      setQuestionIndex(questionIndex);
      setPlayerIndex(playerIndex);
      setCurrentPlayer(players[playerIndex]);
    });

    // 🔹 Tous les joueurs passent automatiquement à la ResultPage
    socket.on("gameEnded", () => {
      navigate(`/result/${room}`, { state: { players, answersHistory, room, currentSocketId } });
    });

    return () => {
      socket.off("correctionUpdate");
      socket.off("gameEnded");
    };
  }, [players, currentSocketId, navigate, room, answersHistory]);

  const handleCorrection = (isCorrect) => {
    const currentQuestion = answersHistory[questionIndex];

    socket.emit("applyCorrection", {
      room,
      playerId: currentPlayer.id,
      questionIndex,
      isCorrect
    });

    if (playerIndex + 1 < players.length) {
      setPlayerIndex(playerIndex + 1);
      setCurrentPlayer(players[playerIndex + 1]);

      socket.emit("correctionUpdate", {
        room,
        questionIndex,
        playerIndex: playerIndex + 1
      });
    } else {
      if (questionIndex + 1 < answersHistory.length) {
        setQuestionIndex(questionIndex + 1);
        setPlayerIndex(0);
        setCurrentPlayer(players[0]);

        socket.emit("correctionUpdate", {
          room,
          questionIndex: questionIndex + 1,
          playerIndex: 0
        });
      } else {
        // 🔹 Chef émet l'événement pour tous les joueurs
        socket.emit("correctionFinished", { room });
        navigate(`/result/${room}`, { state: { players, answersHistory, room, currentSocketId } });
      }
    }
  };

  const currentQuestion = answersHistory[questionIndex];

  return (
    <div className="container-question-component">
      <div className="container-correction">
        <div className="correction">
          Correction Question : {questionIndex + 1} / {answersHistory.length}
        </div>

        <div className="main-correction">
          <p className="question-text">{currentQuestion.question}</p>
          <div className="reponses-correction">
            <p className="reponse-right">
              {currentQuestion.correctAnswer}
            </p>
            <p className="reponse-text">
              {currentPlayer?.username || "Joueur"} :{" "}
              <strong>{currentQuestion.answers?.[currentPlayer?.id] || "(no response)"}</strong>
            </p>
          </div>
        </div>

        {isHost ? (
          <div className="buttons-correction">
            <button onClick={() => handleCorrection(true)}>Correct</button>
            <button onClick={() => handleCorrection(false)}>Faux</button>
          </div>
        ) : (
          <p>Le chef est en train de corriger...</p>
        )}
      </div>
    </div>
  );
}

export default CorrectionPage;
