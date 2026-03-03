import { useLocation, useNavigate, useParams } from "react-router-dom";

const RankedResult = () => {

  const location = useLocation();
  const navigate = useNavigate();
  const { room } = useParams();

  const scores = location.state?.scores || {};

  const sorted = Object.entries(scores)
    .sort((a, b) => b[1] - a[1]);

  return (
    <div className="ranked-result">
      <h2>🏆 Final Results</h2>

      <table>
        <thead>
          <tr>
            <th>Player</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(([playerId, score]) => (
            <tr key={playerId}>
              <td>{playerId}</td>
              <td>{score}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <button onClick={() => navigate(`/salon/${room}`)}>
        Back to Waiting Room
      </button>
    </div>
  );
};

export default RankedResult;