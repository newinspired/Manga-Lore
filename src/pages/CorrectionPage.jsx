import '../styles/question.scss';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import socket from '../socket';
import { playerId } from "../socket";

function CorrectionPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const { answersHistory = [], players = [], room } = location.state || {};

  const [questionIndex, setQuestionIndex] = useState(0);
  const [playerIndex, setPlayerIndex] = useState(0);
  const [currentPlayer, setCurrentPlayer] = useState(players[0] || null);
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    if (!room) return;

    const me = players.find(p => p.id === playerId);
    if (me?.isHost) setIsHost(true);

    socket.on("correctionUpdate", ({ questionIndex, playerIndex }) => {
      setQuestionIndex(questionIndex);
      setPlayerIndex(playerIndex);
      setCurrentPlayer(players[playerIndex]);
    });

    socket.on("gameEnded", ({ players, answersHistory }) => {
      navigate(`/result/${room}`, {
        state: {
          players,
          answersHistory,
          room
        }
      });
    });

    return () => {
      socket.off("correctionUpdate");
      socket.off("gameEnded");
    };
  }, [players, navigate, room]);

  const handleCorrection = (isCorrect) => {
    if (!currentPlayer) return;

    socket.emit("applyCorrection", {
      room,
      playerId: currentPlayer.id,
      questionIndex,
      isCorrect
    });

    if (playerIndex + 1 < players.length) {
      const nextPlayerIndex = playerIndex + 1;

      setPlayerIndex(nextPlayerIndex);
      setCurrentPlayer(players[nextPlayerIndex]);

      socket.emit("correctionUpdate", {
        room,
        questionIndex,
        playerIndex: nextPlayerIndex
      });

    } else if (questionIndex + 1 < answersHistory.length) {

      const nextQuestionIndex = questionIndex + 1;

      setQuestionIndex(nextQuestionIndex);
      setPlayerIndex(0);
      setCurrentPlayer(players[0]);

      socket.emit("correctionUpdate", {
        room,
        questionIndex: nextQuestionIndex,
        playerIndex: 0
      });

    } else {
      // ✅ Fin totale de la correction → le host prévient le serveur
      socket.emit("correctionFinished", { room });
    }
  };

  if (!answersHistory.length || !currentPlayer) {
    return (
      <div className="container-question-component">
        <p>Chargement...</p>
      </div>
    );
  }

  const currentQuestion = answersHistory[questionIndex];

  return (
    <div className="container-question-component">
      <div className="container-correction">

        <div className="correction">
          Correction Question : {questionIndex + 1} / {answersHistory.length}
        </div>

        <div className="main-correction">
          <p className="question-text">
            {currentQuestion.question}
          </p>

          <div className="reponses-correction">
            <p className="reponse-right">
              {currentQuestion.correctAnswer}
            </p>

            <p className="reponse-text">
              {currentPlayer.username} :{" "}
              <strong>
                {currentQuestion.answers?.[currentPlayer.id] || "(no response)"}
              </strong>
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