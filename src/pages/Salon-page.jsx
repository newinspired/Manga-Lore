import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import CardName from '../components/card-name.jsx';
import WaitingRoom from '../components/waiting-room.jsx';
import socket, { playerId, joinRoom, rejoinRoom, onPlayerListUpdate } from '../socket';
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
  const isPremiumUser = false;


  const allArcs = [
    { label: 'East Blue', value: 'EastBlue', isPremium: false},
    { label: 'Alabasta', value: 'Alabasta', isPremium: false },
    { label: 'Skypiea', value: 'Skypiea', isPremium: false },
    { label: 'Water Seven', value: 'WaterSeven', isPremium: false },
    { label: 'Thriller Bark', value: 'ThrillerBark', isPremium: false },
    { label: 'MarineFord', value: 'MarineFord', isPremium: false },

    { label: 'Fish-Man Island', value: 'FishManIsland', isPremium: true },
    { label: 'Punk Hazard/Dressrosa', value: 'Dressrosa', isPremium: true },
    { label: 'Whole Cake Island', value: 'WholeCakeIsland' , isPremium: true},
    { label: 'Wano', value: 'Wano', isPremium: true },
    { label: 'Egg head', value: 'Egg head', isPremium: true},
    { label: 'Erbaf', value: 'Erbaf', isPremium: true },
  ];

  // Rejoint la room au chargement ou après reconnexion socket
  useEffect(() => {
    const storedUsername = localStorage.getItem("username") || locationUsername;
    const storedAvatar = localStorage.getItem("avatar") || locationAvatar;
    const storedRoomCode = localStorage.getItem("roomCode") || room;

    const handleJoin = () => {
      if (storedUsername && storedAvatar && !hasJoinedRef.current) {
        hasJoinedRef.current = true;

        // Utilise joinRoom helper qui inclut playerId
        joinRoom({ roomId: storedRoomCode, username: storedUsername, avatar: storedAvatar }, (response) => {
          if (response && response.success === false) {
            alert(response.message || "Impossible de rejoindre la room");
            navigate('/');
          } else {
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

  // Gère la reconnexion + affiche immédiatement la CardName locale
  useEffect(() => {
    const storedUsername = localStorage.getItem("username") || locationUsername;
    const storedAvatar = localStorage.getItem("avatar") || locationAvatar;
    const storedRoomCode = localStorage.getItem("roomCode") || room;

    if (storedUsername && storedAvatar && storedRoomCode) {
      if (players.length === 0) {
        setPlayers([
          {
            id: "local-player",
            username: storedUsername,
            avatar: storedAvatar,
            score: 0,
          },
        ]);
      }

      if (!hasJoinedRef.current) {
        hasJoinedRef.current = true;
        // utilise rejoinRoom qui envoie playerId
        rejoinRoom({ roomCode: storedRoomCode, username: storedUsername, avatar: storedAvatar });
      }
    }
  }, [players, locationUsername, locationAvatar, room]);

  // Mise à jour du statut d’hôte
  useEffect(() => {
    const handleHostStatus = (isHostFlag) => setIsHost(isHostFlag);
    socket.on("hostStatus", handleHostStatus);
    return () => socket.off("hostStatus", handleHostStatus);
  }, []);

  // Mise à jour des arcs sélectionnés
  useEffect(() => {
    const handleArcsUpdate = (updatedArcs) => setSelectedArcs(updatedArcs);
    socket.on("arcsUpdated", handleArcsUpdate);
    return () => socket.off("arcsUpdated", handleArcsUpdate);
  }, []);

  // Mise à jour de la liste des joueurs depuis le serveur
  useEffect(() => {
    const handlePlayerList = (updatedPlayers) => setPlayers(updatedPlayers);
    socket.on("playerList", handlePlayerList);
    return () => socket.off("playerList", handlePlayerList);
  }, []);

  useEffect(() => {
    const handlePlayerList = (updatedPlayers) => {
      setPlayers(updatedPlayers);

      console.log("---- LISTE DES JOUEURS (SalonPage) ----");
      updatedPlayers.forEach(p => {
        console.log(`"${p.username}" : ${p.isHost ? "host" : "not host"}`);
      });
      console.log("-----------------------------------------");
    };

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
          <CardName players={players} currentSocketId={socket.id} />
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default SalonPage;
