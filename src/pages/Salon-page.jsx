import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import CardName from '../components/card-name.jsx';
import WaitingRoom from '../components/waiting-room.jsx';
import socket from '../socket.js';
import Footer from '../components/footer.jsx';
import '../styles/card-name.scss';
import '../styles/salon-page.scss';

function SalonPage() {
  const { room } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { username, avatar } = location.state || {};

  const [isHost, setIsHost] = useState(false);
  const hasJoinedRef = useRef(false);

  const allArcs = [
    { label: 'East Blue', value: 'EastBlue' },
    { label: 'Alabasta', value: 'Alabasta' },
    { label: 'Skypiea', value: 'Skypiea' },
    { label: 'Water Seven', value: 'WaterSeven' },
    { label: 'Thriller Bark', value: 'ThrillerBark' },
    { label: 'MarineFord', value: 'MarineFord' },
    { label: 'Fish-Man Island', value: 'FishManIsland' },

    { label: 'Dressrosa', value: 'Dressrosa' },
    { label: 'Whole Cake Island', value: 'WholeCakeIsland' },
    { label: 'Wano', value: 'Wano' },
    { label: 'Egg head', value: 'Egg head' },
  ];

  const [selectedArcs, setSelectedArcs] = useState([]);

  useEffect(() => {
    const handleConnect = () => {
      if (username && avatar && !hasJoinedRef.current) {
        hasJoinedRef.current = true;
        socket.emit('joinRoom', { roomId: room, username, avatar }, (response) => {
          if (!response.success) {
            alert(response.message);
            navigate('/');
          }
        });
      }
    };

    if (socket.connected) {
      handleConnect();
    } else {
      socket.once('connect', handleConnect);
    }

    return () => {
      socket.off('connect', handleConnect);
    };
  }, [room, username, avatar, navigate]);


  useEffect(() => {
    const handleHostStatus = (isHost) => {
      setIsHost(isHost);
    };
    socket.on('hostStatus', handleHostStatus);
    return () => {
      socket.off('hostStatus', handleHostStatus);
    };
  }, []);

  useEffect(() => {
    const handleArcsUpdate = (updatedArcs) => {
      setSelectedArcs(updatedArcs);
    };
    socket.on('arcsUpdated', handleArcsUpdate);
    return () => {
      socket.off('arcsUpdated', handleArcsUpdate);
    };
  }, []);

  return (
    <div className="container">
      <div className='container-salon'>
        <div className="container-waiting">
          <WaitingRoom
            roomCode={room}
            username={username}
            isHost={isHost}
            allArcs={allArcs}
            selectedArcs={selectedArcs}
            setSelectedArcs={setSelectedArcs}
          />
        </div>
        <div className="container-bonne-chance">
          <CardName currentSocketId={socket.id} />
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default SalonPage;
