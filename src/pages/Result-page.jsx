
import { useLocation } from 'react-router-dom';

const ResultPage = () => {
  const location = useLocation();
  const players = location.state?.players || [];

  const sortedPlayers = [...players].sort((a, b) => (a.score || 0) - (b.score || 0));

  return (
    <div className="result-page">
      <h1>🏆 Résultats du Quiz</h1>
      <ul>
        {sortedPlayers.map((player, index) => (
          <li key={player.id}>
            <strong>{index + 1}.</strong> {player.username} — {player.score || 0} berries
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ResultPage;