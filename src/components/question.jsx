import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import socket from '../socket';

const Question = ({ username, avatar }) => {
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [maxTime, setMaxTime] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const { room } = useParams();
  const navigate = useNavigate();

  const currentAnswerRef = useRef('');
  const answersHistoryRef = useRef([]);
  const currentQuestionRef = useRef(null);

  useEffect(() => {
    if (!room) return;
    socket.emit('joinRoom', { roomId: room, username, avatar });
    socket.emit('playerReady', room, true);
  }, [room, username, avatar]);

  useEffect(() => {
    const onNewQuestion = ({ question, timeLeft }) => {
      if (currentQuestionRef.current) {
        answersHistoryRef.current.push({
          question: currentQuestionRef.current.question,
          correctAnswer: currentQuestionRef.current.answer,
          playerAnswer: currentAnswerRef.current || '',
          difficulty: currentQuestionRef.current.difficulty,
        });
      }

      currentAnswerRef.current = '';
      setUserAnswer('');
      setCurrentQuestion(question);
      currentQuestionRef.current = question;
      setTimeLeft(timeLeft);
      setMaxTime(timeLeft);
    };

    const onTimer = (time) => setTimeLeft(time);

    const onGameEnded = (payload) => {
      if (
        currentQuestionRef.current &&
        !answersHistoryRef.current.find(
          (q) => q.question === currentQuestionRef.current.question
        )
      ) {
        answersHistoryRef.current.push({
          question: currentQuestionRef.current.question,
          correctAnswer: currentQuestionRef.current.answer,
          playerAnswer: currentAnswerRef.current || '',
          difficulty: currentQuestionRef.current.difficulty,
        });
      }

      console.log('Payload reçu gameEnded:', payload.players);

      navigate(`/result/${room}`, {
        state: {
          answersHistory: answersHistoryRef.current,
          username,
          players: payload?.players || [],
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
  }, [navigate, room, username, avatar]);

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
  const progress =
    maxTime > 0 ? (timeLeft / maxTime) * circumference : circumference;

  return (
    <div className="container-question-component">
      <div className="container-question">
        <div className="timer-circle">
          <svg width="100" height="100">
            <circle
              stroke="#ddd"
              fill="transparent"
              strokeWidth="6"
              r={radius}
              cx="50"
              cy="50"
            />
            <circle
              stroke="#ff5252"
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

        <p className="question-text">{currentQuestion.question}</p>
        <input
          type="text"
          value={userAnswer}
          onChange={handleChange}
          placeholder="Ta réponse"
          disabled={timeLeft === 0}
          autoFocus
        />
      </div>

      <style>{`
        .timer-circle {
          position: relative;
          width: 100px;
          height: 100px;
        }
        .timer-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 20px;
          font-weight: bold;
          color: #ff5252;
        }
      `}</style>
    </div>
  );
};

export default Question;
