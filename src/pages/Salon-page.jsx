import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import CardName from '../components/card-name.jsx';
import WaitingRoom from '../components/waiting-room.jsx';
import socket from '../socket.js';
import Footer from '../components/footer.jsx';
import Header from '../components/header.jsx';
import '../styles/card-name.scss';
import '../styles/salon-page.scss';

function SalonPage() {
  const { room } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { username: locationUsername, avatar: locationAvatar } = location.state || {};

  const [isHost, setIsHost] = useState(false);
  const [players, setPlayers] = useState([]);
  const [selectedArcs, setSelectedArcs] = useState([]);
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

  // 🔹 Quand la page charge, rejoins ou reviens dans la room
  useEffect(() => {
    const storedUsername = localStorage.getItem("username") || locationUsername;
    const storedAvatar = localStorage.getItem("avatar") || locationAvatar;
    const storedRoomCode = localStorage.getItem("roomCode") || room;

    const handleJoin = () => {
      if (storedUsername && storedAvatar && !hasJoinedRef.current) {
        hasJoinedRef.current = true;

        socket.emit("joinRoom", { roomId: storedRoomCode, username: storedUsername, avatar: storedAvatar }, (response) => {
          if (!response.success) {
            alert(response.message);
            navigate('/');
          } else {
            // ✅ Stockage local pour reconnexion rapide
            localStorage.setItem("username", storedUsername);
            localStorage.setItem("avatar", storedAvatar);
            localStorage.setItem("roomCode", storedRoomCode);
          }
        });
      }
    };

    if (socket.connected) handleJoin();
    else socket.once("connect", handleJoin);

    return () => socket.off("connect", handleJoin);
  }, [room, locationUsername, locationAvatar, navigate]);

  // 🔹 Mise à jour du statut host
  useEffect(() => {
    const handleHostStatus = (isHost) => setIsHost(isHost);
    socket.on("hostStatus", handleHostStatus);
    return () => socket.off("hostStatus", handleHostStatus);
  }, []);

  // 🔹 Mise à jour des arcs sélectionnés
  useEffect(() => {
    const handleArcsUpdate = (updatedArcs) => setSelectedArcs(updatedArcs);
    socket.on("arcsUpdated", handleArcsUpdate);
    return () => socket.off("arcsUpdated", handleArcsUpdate);
  }, []);

  // 🔹 Mise à jour de la liste des joueurs
  useEffect(() => {
    const handlePlayerList = (updatedPlayers) => setPlayers(updatedPlayers);
    socket.on("playerList", handlePlayerList);
    return () => socket.off("playerList", handlePlayerList);
  }, []);

  // 🔹 Rejoint automatiquement la room si retour depuis ResultPage
  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    const storedAvatar = localStorage.getItem("avatar");
    const storedRoomCode = localStorage.getItem("roomCode");

    if (storedUsername && storedAvatar && storedRoomCode && !hasJoinedRef.current) {
      hasJoinedRef.current = true;
      socket.emit("rejoinRoom", {
        roomCode: storedRoomCode,
        username: storedUsername,
        avatar: storedAvatar,
      });
    }
  }, []);

  return (
    <div className="container">
      <Header />
      <div className='container-salon'>
        <div className="container-waiting">
          <WaitingRoom
            roomCode={room}
            username={locationUsername}
            isHost={isHost}
            allArcs={allArcs}
            selectedArcs={selectedArcs}
            setSelectedArcs={setSelectedArcs}
          />
        </div>

        <div className="container-bonne-chance">
          {/* 🔹 On repasse la liste des joueurs au composant CardName */}
          <CardName
            players={players}
            currentSocketId={socket.id}
          />
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default SalonPage;
