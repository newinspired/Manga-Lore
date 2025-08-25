import { useLocation } from 'react-router-dom';
import CardName from '../components/card-name';
import '../styles/result-page.scss';

const ResultPage = () => {
  const location = useLocation();
  const players = location.state?.players || [];

  // Tri du plus grand score au plus petit
  const sortedPlayers = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));

  return (
    <div className="result-page">
      <h2>Résultats du Quiz</h2>

      <div className="results-container">
        <CardName players={sortedPlayers} showResults={true} />
      </div>
    </div>
  );
};

export default ResultPage;
