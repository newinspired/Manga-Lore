import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import CardName from '../components/card-name.jsx';
import WaitingRoom from '../components/waiting-room.jsx';
import WaitingRoomGuess from '../components/waiting-room-guess.jsx';
import WaitingRoomRanked from '../components/waiting-room-ranked.jsx';
import socket from '../socket';
import Footer from '../components/footer.jsx';
import Header from '../components/header.jsx';
import { joinRoom } from "../socket";

import '../styles/card-name.scss';
import '../styles/salon-page.scss';

function SalonPage({ userData }) {

  const { room } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [showRules, setShowRules] = useState(false);
  const [showDescription, setShowDescription] = useState(false);

  const { username: locationUsername, avatar: locationAvatar } = location.state || {};

  const [isHost, setIsHost] = useState(false);
  const [players, setPlayers] = useState([]);
  const [selectedArcs, setSelectedArcs] = useState([]);
  const [selectedMode, setSelectedMode] = useState(null);

  const hasJoinedRef = useRef(false);

  const isPremiumUser = userData?.isPremium;

  const allArcs = [
    { label: 'East Blue', value: 'EastBlue', isPremium: false },
    { label: 'Alabasta', value: 'Alabasta', isPremium: false },
    { label: 'Skypiea', value: 'Skypiea', isPremium: false },
    { label: 'Water Seven', value: 'WaterSeven', isPremium: false },
    { label: 'Thriller Bark', value: 'ThrillerBark', isPremium: false },
    { label: 'MarineFord', value: 'MarineFord', isPremium: false },
    { label: 'Fish-Man Island', value: 'FishManIsland', isPremium: true },
    { label: 'Punk Hazard/Dressrosa', value: 'Dressrosa', isPremium: true },
    { label: 'Whole Cake Island', value: 'WholeCakeIsland', isPremium: true },
    { label: 'Wano', value: 'Wano', isPremium: true },
    { label: 'Egg head', value: 'Egg head', isPremium: true },
    { label: 'Erbaf', value: 'Elbaf', isPremium: true },
  ];

  // 🔒 Sécurité : si pas username ou avatar → retour login
  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    const storedAvatar = localStorage.getItem("avatar");

    if (!storedUsername || !storedAvatar) {
      navigate("/", { state: { redirectTo: `/salon/${room}` } });
    }
  }, [room, navigate]);

  // ✅ USE EFFECT UNIQUE ET PROPRE POUR CARDNAME + JOIN
  useEffect(() => {
    const storedUsername = localStorage.getItem("username") || locationUsername;
    const storedAvatar = localStorage.getItem("avatar") || locationAvatar;
    const storedRoomCode = localStorage.getItem("roomCode") || room;

    const handlePlayerList = (updatedPlayers) => {
      console.log("PLAYER LIST RECEIVED:", updatedPlayers);
      setPlayers(updatedPlayers);
    };

    const handleHostStatus = (flag) => {
      setIsHost(flag);
    };

    // 🔥 1️⃣ On attache les listeners AVANT de join
    socket.on("playerList", handlePlayerList);
    socket.on("hostStatus", handleHostStatus);

    const handleJoin = () => {
      if (storedUsername && storedAvatar && !hasJoinedRef.current) {
        hasJoinedRef.current = true;

        joinRoom({
          roomId: storedRoomCode,
          username: storedUsername,
          avatar: storedAvatar
        });

        // 🔥 Demande explicitement les joueurs actuels
        socket.emit("getPlayersInRoom", storedRoomCode);
      }
    };

    if (socket.connected) {
      handleJoin();
    } else {
      socket.once("connect", handleJoin);
    }

    return () => {
      socket.off("playerList", handlePlayerList);
      socket.off("hostStatus", handleHostStatus);
      socket.off("connect", handleJoin);
    };

  }, [room]);

  // 🗂 Sync arcs
  useEffect(() => {
    const handleArcsUpdate = (arcs) => setSelectedArcs(arcs);
    socket.on("arcsUpdated", handleArcsUpdate);
    return () => socket.off("arcsUpdated", handleArcsUpdate);
  }, []);

  return (
    <div className="container">
      <Header userData={userData} />

      <div className="container-salon">

        <div className="container-waiting">

          {!selectedMode && (
            <div className="mode-selection">

              <div className='waiting-room'>
                <h2>
                  WAITING ROOM : <span className='couleur-pseudo'>{room}</span>
                </h2>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert("Invitation link copied!");
                  }}
                >
                  Copy invitation link
                </button>
              </div>

              <h2>Select a Game Mode</h2>

              <button
                className="mode-button"
                onClick={() => setSelectedMode("AllTheLore")}
              >
                All the One Piece lore !
              </button>

              <button
                className="mode-button"
                onClick={() => setSelectedMode("PutInOrder")}
              >
                " Put in Order "
              </button>

              <div className="separate"></div>

              <button
                className="mode-button"
                onClick={() => setSelectedMode("ranked")}
              >
                Ranked - Name Them All
              </button>
            </div>
          )}

          {selectedMode === "AllTheLore" && (
            <WaitingRoom
              roomCode={room}
              username={locationUsername}
              isHost={isHost}
              allArcs={allArcs}
              selectedArcs={selectedArcs}
              setSelectedArcs={setSelectedArcs}
              isPremiumUser={isPremiumUser}
            />
          )}

          {selectedMode === "PutInOrder" && (
            <WaitingRoomGuess
              roomCode={room}
              username={locationUsername}
              isHost={isHost}
              selectedArcs={selectedArcs}
              setSelectedArcs={setSelectedArcs}
              isPremiumUser={isPremiumUser}
            />
          )}

          {selectedMode === "ranked" && (
            <WaitingRoomRanked
              roomCode={room}
              username={locationUsername}
              isHost={isHost}
              selectedArcs={selectedArcs}
              setSelectedArcs={setSelectedArcs}
              isPremiumUser={isPremiumUser}
            />
          )}
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