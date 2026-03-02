import { useEffect, useState } from "react";
import socket from "../socket";
import { useParams, useNavigate } from "react-router-dom";

const RankedGame = ({ roomCode, onGameEnd }) => {

  const [question, setQuestion] = useState("");
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState("");
  const [timer, setTimer] = useState(0);
  const [winner, setWinner] = useState(null);
  const { room } = useParams();
  const navigate = useNavigate();

  // 📥 Nouvelle question
  useEffect(() => {
    socket.on("rankedNewQuestion", (data) => {
      setQuestion(data.question);
      setInput("");
      setFeedback("");
      setWinner(null);
    });

    socket.on("rankedTimer", (elapsed) => {
      setTimer(elapsed);
    });

    socket.on("rankedAnswerValidated", ({ totalFound, totalRequired }) => {
      setFeedback(`✅ Correct (${totalFound}/${totalRequired})`);
    });

    socket.on("rankedWinner", ({ username }) => {
      setWinner(username);
      setFeedback(`🏆 ${username} completed everything!`);
    });

    socket.on("rankedGameEnded", (data) => {
      navigate(`/ranked/${room}/result`, {
        state: { scores: data.scores }
      });
    });

    return () => {
      socket.off("rankedNewQuestion");
      socket.off("rankedTimer");
      socket.off("rankedAnswerValidated");
      socket.off("rankedWinner");
      socket.off("rankedGameEnded");
    };
  }, []);

  // ⌨ Envoi réponse avec ENTER
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && input.trim() !== "") {
      socket.emit("rankedAnswer", {
        roomCode,
        input
      });
      setInput("");
    }
  };

  return (
    <div className="ranked-game">

      <h2>{question}</h2>

      <div className="timer">⏱ {timer}s</div>

      <input
        type="text"
        value={input}
        placeholder="Type your answer..."
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
      />

      <div className="feedback">{feedback}</div>

      {winner && <h3>🎉 Winner: {winner}</h3>}

    </div>
  );
};

export default RankedGame;