import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import socket from '../socket';
import '../styles/question.scss';

const Question = ({ username, avatar }) => {
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [maxTime, setMaxTime] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const { room } = useParams();
  const navigate = useNavigate();

  const currentAnswerRef = useRef('');
  const currentQuestionRef = useRef(null);

  useEffect(() => {
    if (!room) return;
    socket.emit('joinRoom', { roomId: room, username, avatar });
    socket.emit('playerReady', room, true);
  }, [room, username, avatar]);

  useEffect(() => {
    const onNewQuestion = ({ question, timeLeft }) => {
      currentAnswerRef.current = '';
      setUserAnswer('');
      setCurrentQuestion(question);
      currentQuestionRef.current = question;
      setTimeLeft(timeLeft);
      setMaxTime(timeLeft);
    };

    const onTimer = (time) => setTimeLeft(time);

    const onGameEnded = (payload) => {
      // ⚡ On récupère directement l'historique envoyé par le serveur
      navigate(`/correction/${room}`, {
        state: {
          answersHistory: payload?.answersHistory || [],
          players: payload?.players || [],
          room,
          currentSocketId: socket.id, // permet de savoir si je suis le host
        },
      });
    };

    socket.on('newQuestion', onNewQuestion);
    socket.on('timer', onTimer);
    socket.on('gameEnded', onGameEnded);

    return () => {
      socket.off('newQuestion', onNewQuestion);
      socket.off('timer', onTimer);
      socket.off('gameEnded', onGameEnded);
    };
  }, [navigate, room]);

  const handleChange = (e) => {
    const val = e.target.value;
    setUserAnswer(val);
    currentAnswerRef.current = val;
    socket.emit('playerAnswer', room, val);
  };

  if (!currentQuestion) {
    return (
      <div className="waiting-screen">
        <p>Chargement de la partie...</p>
        <img
          src="/illustration-chapitre-1023.png"
          alt="Illustration du chapitre 1023 de One Piece"
        />
      </div>
    );
  }

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const progress = maxTime > 0 ? (timeLeft / maxTime) * circumference : circumference;

  return (
    <div className="container-question-component">
      <div className="container-question">
        <div className="timer-circle">
          <svg width="100" height="100">
            <circle stroke="#ddd" fill="transparent" strokeWidth="6" r={radius} cx="50" cy="50" />
            <circle
              stroke="#b3926f"
              fill="transparent"
              strokeWidth="6"
              r={radius}
              cx="50"
              cy="50"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - progress}
              style={{
                transition: 'stroke-dashoffset 1s linear',
                transform: 'rotate(-90deg)',
                transformOrigin: '50% 50%',
              }}
            />
          </svg>
          <div className="timer-text">{timeLeft}</div>
        </div>
        <div className="question-section">
          <p className="question-text">{currentQuestion.question}</p>
          <input
            type="text"
            value={userAnswer}
            onChange={handleChange}
            placeholder="Type your answer here"
            disabled={timeLeft === 0}
            autoFocus
          />
        </div>
        <div className="difficulty-question">
          {currentQuestion && (
            <p className={`difficulty ${currentQuestion.difficulty}`}>
              {currentQuestion.difficulty.charAt(0).toUpperCase() + currentQuestion.difficulty.slice(1)}
            </p>
          )}
        </div>
      </div>

      <style>{`
        .timer-circle { position: relative; width: 100px; height: 100px; }
        .timer-text { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 20px; font-weight: bold; color: #f0d8b6; }
      `}</style>
    </div>
  );
};

export default Question;
