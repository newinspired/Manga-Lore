import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import CardName from '../components/card-name.jsx';
import WaitingRoom from '../components/waiting-room.jsx';
import socket from '../socket.js';
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

  // ✅ Mise à jour du statut d’hôte
  useEffect(() => {
    const handleHostStatus = (isHost) => {
      setIsHost(isHost);
    };
    socket.on('hostStatus', handleHostStatus);
    return () => {
      socket.off('hostStatus', handleHostStatus);
    };
  }, []);

  // ✅ Synchronise les arcs sélectionnés (émis par le serveur)
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
  );
}

export default SalonPage;
