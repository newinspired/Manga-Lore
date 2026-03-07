import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import CardName from '../components/card-name.jsx';
import WaitingRoom from '../components/waiting-room.jsx';
import WaitingRoomGuess from '../components/waiting-room-guess.jsx';
import WaitingRoomRanked from '../components/waiting-room-ranked.jsx';
import RankedGame from "../pages-ranked/RankedGame.jsx";
import RankedResult from "../pages-ranked/RankedResult.jsx";
import socket from '../socket';
import Footer from '../components/footer.jsx';
import Header from '../components/header.jsx';
import { joinRoom } from "../socket";


import '../styles/card-name.scss';
import '../styles/salon-page.scss';

function SalonPage({ userData, firebaseUid, handleReadyClick, isButtonDisabled, buttonLabel }) {

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
  const [votes, setVotes] = useState({
    AllTheLore: 0,
    PutInOrder: 0,
    ranked: 0
  });

  const [myVote, setMyVote] = useState(null);

  const [readyPlayers, setReadyPlayers] = useState(0);
  const [totalPlayers, setTotalPlayers] = useState(0);

  const [isReady, setIsReady] = useState(false);
  

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

  const handleBackToMode = () => {
    setSelectedMode(null);
  };

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

    socket.on("votesUpdated", (counts) => {
      setVotes(counts);
    });

    socket.on("readyUpdate", ({ ready, total }) => {
      setReadyPlayers(ready);
      setTotalPlayers(total);
    });

    socket.on("modeChosen", (mode) => {
      setSelectedMode(mode);
    });

    // 🔥 1️⃣ On attache les listeners AVANT de join
    socket.on("playerList", handlePlayerList);
    socket.on("hostStatus", handleHostStatus);

    const handleJoin = () => {
      if (storedUsername && storedAvatar && !hasJoinedRef.current) {
        hasJoinedRef.current = true;

        joinRoom({
          roomId: storedRoomCode,
          username: storedUsername,
          avatar: storedAvatar,
          playerId: firebaseUid
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
      socket.off("votesUpdated");
      socket.off("readyUpdate");
      socket.off("modeChosen");
    };

  }, [room]);

  // 🗂 Sync arcs
  useEffect(() => {
    const handleArcsUpdate = (arcs) => setSelectedArcs(arcs);
    socket.on("arcsUpdated", handleArcsUpdate);
    return () => socket.off("arcsUpdated", handleArcsUpdate);
  }, []);

  const handleVote = (mode) => {
    if (myVote === mode) return;

    setMyVote(mode);

    socket.emit("voteMode", {
      roomId: room,
      mode
    });

  };

  const handleVoteReady = () => {
    const newReady = !isReady;

    setIsReady(newReady);

    socket.emit("voteReady", {
      roomId: room,
      ready: newReady
    });

  };

  useEffect(() => {
    console.log("IS HOST UPDATED:", isHost);
  }, [isHost]);

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
              </div>
              <h2>Select the Game Mode</h2>
              <p>Please vote for the game mode you want to play</p>
              <p>Wait all your friends if you are not playing alone</p>

              <button
                className={`mode-button ${myVote === "AllTheLore" ? "selected" : ""}`}
                onClick={() => handleVote("AllTheLore")}
              >
                All the One Piece lore ({votes.AllTheLore})
              </button>

              <button
                className={`mode-button ${myVote === "PutInOrder" ? "selected" : ""}`}
                onClick={() => handleVote("PutInOrder")}
              >
                Put in Order ({votes.PutInOrder})
              </button>

              <div className="separate"></div>

              <button
                className={`mode-button ${myVote === "ranked" ? "selected" : ""}`}
                onClick={() => handleVote("ranked")}
              >
                Ranked - Name Them All ({votes.ranked})
              </button>

              <button
                className="ready-button"
                disabled={!myVote}
                onClick={handleVoteReady}
              >
                {isReady ? "Not ready" : "Ready"} ({readyPlayers}/{totalPlayers})
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
              onBackToMode={handleBackToMode}
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
              onBackToMode={handleBackToMode}
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
              onBackToMode={handleBackToMode}
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