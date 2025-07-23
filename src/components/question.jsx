import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useParams, useNavigate } from 'react-router-dom';

const socket = io('http://localhost:3001');

const Question = ({ username, avatar }) => {
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState(0);
  const [isHost, setIsHost] = useState(false);
  const [players, setPlayers] = useState([]);
  const { room } = useParams();
  const [isRevealPhase, setIsRevealPhase] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    socket.emit('joinRoom', {
      roomId: room,
      username,
      avatar,
    });

    socket.emit('playerReady', room, true);

    socket.on('hostStatus', (hostStatus) => setIsHost(hostStatus));
    socket.on('playerList', (playersList) => setPlayers(playersList));

    socket.on('startGame', () => {
      console.log('✅ Événement startGame reçu (le jeu commence)');
    });

    socket.on('newQuestion', ({ question, timeLeft }) => {
      setCurrentQuestion(question);
      setTimeLeft(timeLeft);
      setUserAnswer('');
      setFeedback('');
      setIsRevealPhase(false);
    });

    socket.on('timer', (time) => setTimeLeft(time));

    socket.on('questionEnded', ({ correctAnswer, scores, playerAnswers }) => {
      const rawAnswer = playerAnswers?.[socket.id] || '';
      const cleanedUserAnswer = rawAnswer.trim().toLowerCase();
      setIsRevealPhase(true);

      const expectedAnswers = Array.isArray(correctAnswer)
        ? correctAnswer.map(ans => ans.trim().toLowerCase())
        : [correctAnswer.trim().toLowerCase()];

      const isCorrect = expectedAnswers.includes(cleanedUserAnswer);

      if (isCorrect) {
        setFeedback(`✅ Bonne réponse !`);
      } else {
        const expected = Array.isArray(correctAnswer) ? correctAnswer.join(', ') : correctAnswer;
        setFeedback(`❌ Mauvaise réponse ! → Réponse attendue : ${expected}`);
      }

      const player = players.find((p) => p.id === socket.id);
      setScore(scores?.[player?.id] || 0);
    });


    socket.on('gameEnded', () => {
      navigate(`/result/${room}`, { state: { players } });
    });

    return () => {
      socket.off('hostStatus');
      socket.off('playerList');
      socket.off('startGame');
      socket.off('newQuestion');
      socket.off('timer');
      socket.off('questionEnded');
      socket.off('gameEnded');
    };
  }, [room, username, avatar]);

  const handleChange = (e) => {
    setUserAnswer(e.target.value);
    socket.emit('playerAnswer', room, e.target.value);
  };

  return (
    <div className="container-question-component">
      {currentQuestion ? (
        <div className="container-question">
          <div className="timer">Temps restant : {timeLeft}</div>
          {isRevealPhase ? (
            <p className="question-text reveal"><strong>{feedback}</strong></p>
          ) : (
            <>
              <p className="question-text">{currentQuestion.question}</p>
              <input
                type="text"
                value={userAnswer}
                onChange={handleChange}
                placeholder="Tape ta réponse ici"
                disabled={timeLeft === 0}
                autoFocus
              />
            </>
          )}
        </div>
      ) : (
        <p>⏳ En attente de la prochaine question...</p>
      )}

      <div className="container-ranking">
        <h4>Joueurs :</h4>
        <ul>
          {players.map((p) => (
            <li key={p.id}>
              {p.username} {p.isHost ? '(Host)' : ''} - {p.score || 0} berries
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Question;
