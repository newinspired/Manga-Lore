import { useParams, useLocation } from 'react-router-dom';
import Question from '../components/question.jsx';
import '../styles/question.scss';

function GamePage() {
  const { room } = useParams();
  const location = useLocation();
  const { username, avatar } = location.state || {};

  return (
    <div className='container-game-page'>
      <Question username={username} avatar={avatar} roomCode={room} />
    </div>
  );
}

export default GamePage;
