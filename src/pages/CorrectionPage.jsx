import React, { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import '../styles/question.scss';

const SCORE_TABLE = {
  easy: 50_000_000,
  medium: 100_000_000,
  difficult: 150_000_000,
};

const CorrectionPage = () => {
  const { state } = useLocation();
  const { answersHistory = [], username, players = [] } = state || {};
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const navigate = useNavigate();
  const { room } = useParams();

  const nextQuestion = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < answersHistory.length) {
      setCurrentIndex(nextIndex);
    } else {
      // envoi vers la page résultat avec le score total
      navigate(`/result/${room}`, {
        state: {
          username,
          players: [{ username, score }],
        },
      });
    }
  };

  const handleCorrect = () => {
    const current = answersHistory[currentIndex];
    const points = SCORE_TABLE[current.difficulty] ?? SCORE_TABLE.easy;
    setScore(prev => prev + points);
    nextQuestion();
  };

  const handleWrong = () => nextQuestion();

  if (answersHistory.length === 0) return <div>Aucune question à corriger.</div>;

  const current = answersHistory[currentIndex];

  return (
    <div className="container-question-component">
      <div className="container-question">
        <div className="timer">Correction {currentIndex + 1} / 20</div>
        <p className="question-text">Question : {current.question}</p>
        <p className="question-text">
          Ta réponse : <strong>{current.playerAnswer || '(aucune réponse)'}</strong>
        </p>
        <p className="question-text">Bonne réponse : <strong>{current.correctAnswer}</strong></p>
        <div className='buttons-correction'>
          <button onClick={handleCorrect} >Correct</button>
          <button onClick={handleWrong}>False</button>
        </div>
      </div>
    </div>
  );
};

export default CorrectionPage;
