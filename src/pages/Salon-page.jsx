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
    { label: 'Punk Hazard/Dressrosa', value: 'Dressrosa' },
    { label: 'Whole Cake Island', value: 'WholeCakeIsland' },
    { label: 'Wano', value: 'Wano' },
    { label: 'Egg head', value: 'Egg head' },
    { label: 'Erbaf', value: 'Erbaf' },
  ];

  // 🔹 Rejoint la room au chargement ou après reconnexion socket
  useEffect(() => {
    const storedUsername = localStorage.getItem("username") || locationUsername;
    const storedAvatar = localStorage.getItem("avatar") || locationAvatar;
    const storedRoomCode = localStorage.getItem("roomCode") || room;

    const handleJoin = () => {
      if (storedUsername && storedAvatar && !hasJoinedRef.current) {
        hasJoinedRef.current = true;

        socket.emit(
          "joinRoom",
          { roomId: storedRoomCode, username: storedUsername, avatar: storedAvatar },
          (response) => {
            if (!response.success) {
              alert(response.message);
              navigate('/');
            } else {
              // ✅ Stockage local pour reconnexion rapide
              localStorage.setItem("username", storedUsername);
              localStorage.setItem("avatar", storedAvatar);
              localStorage.setItem("roomCode", storedRoomCode);
            }
          }
        );
      }
    };

    if (socket.connected) handleJoin();
    else socket.once("connect", handleJoin);

    return () => socket.off("connect", handleJoin);
  }, [room, locationUsername, locationAvatar, navigate]);

  // 🔹 Gère la reconnexion + affiche immédiatement la CardName locale
  useEffect(() => {
    const storedUsername = localStorage.getItem("username") || locationUsername;
    const storedAvatar = localStorage.getItem("avatar") || locationAvatar;
    const storedRoomCode = localStorage.getItem("roomCode") || room;

    if (storedUsername && storedAvatar && storedRoomCode) {
      // 🟢 Si aucun joueur n'est encore affiché, on affiche localement le joueur
      if (players.length === 0) {
        setPlayers([
          {
            id: "local-player",
            username: storedUsername,
            avatar: storedAvatar,
            score: 0, // reset du score
          },
        ]);
      }

      // 🟢 En parallèle, on notifie le serveur pour rejoinRoom
      if (!hasJoinedRef.current) {
        hasJoinedRef.current = true;
        socket.emit("rejoinRoom", {
          roomCode: storedRoomCode,
          username: storedUsername,
          avatar: storedAvatar,
        });
      }
    }
  }, [players, locationUsername, locationAvatar, room]);

  // 🔹 Mise à jour du statut d’hôte
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

  // 🔹 Mise à jour de la liste des joueurs depuis le serveur
  useEffect(() => {
    const handlePlayerList = (updatedPlayers) => setPlayers(updatedPlayers);
    socket.on("playerList", handlePlayerList);
    return () => socket.off("playerList", handlePlayerList);
  }, []);

  return (
    <div className="container">
      <Header />
      <div className="container-salon">
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
          {/* 🔹 Affiche la liste des joueurs, y compris celui restauré localement */}
          <CardName players={players} currentSocketId={socket.id} />
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default SalonPage;
