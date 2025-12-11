import { useNavigate } from 'react-router-dom';
import '../styles/login-page.scss';
import '../styles/modal-avatar.scss';
import { useState, useEffect, useRef } from 'react';
import socket from '../socket';
import ModalAvatar from '../components/modal-avatar.jsx';
import Footer from '../components/footer.jsx';
import Header from '../components/header.jsx';

import luffy from '../assets/avatars-color/luffy5.jpg';
import sanji from '../assets/avatars-color/sanji5.jpg';
import nami from '../assets/avatars-color/nami5.jpg';

import ace from '../assets/avatars-color/ace5.jpg';
import sabo from '../assets/avatars-color/sabo5.jpg';
import law from '../assets/avatars-color/law5.jpg';



function LoginPage({ setUsername, setRoomCode }) {
  const navigate = useNavigate();
  const modalRef = useRef(null);
  const avatarOptions = [
    { name: 'luffy', src: luffy },
    { name: 'ace', src: ace },
    { name: 'sanji', src: sanji },
    { name: 'nami', src: nami },
    { name: 'sabo', src: sabo },
    { name: 'law', src: law },
  
  ];

  const [input, setInput] = useState('');
  const [roomInput, setRoomInput] = useState('');
  const [showRoomInput, setShowRoomInput] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(avatarOptions[0].name);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  const trimmedInput = input.trim();
  const trimmedRoom = roomInput.trim();
  const isFormValid = trimmedInput !== '' && trimmedRoom !== '';

  const [showRules, setShowRules] = useState(false);
  const [showDescription, setShowDescription] = useState(false);

  const handleCreateGame = () => {
    if (trimmedInput === '') return;

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomInput(code);

    const avatarObj = avatarOptions.find(a => a.name === selectedAvatar);
    setUsername(trimmedInput);
    setRoomCode(code);

    localStorage.setItem('username', trimmedInput);
    localStorage.setItem('roomCode', code);
    localStorage.setItem('avatar', selectedAvatar);

    socket.emit('createRoom', code, trimmedInput, selectedAvatar);

    navigate(`/salon/${code}`, {
      state: {
        username: trimmedInput,
        avatar: avatarObj.name,
      },
    });
  };

  const handleSubmit = () => {
    if (!isFormValid) return;

    const avatarObj = avatarOptions.find(a => a.name === selectedAvatar);
    setUsername(trimmedInput);
    setRoomCode(trimmedRoom);

    localStorage.setItem('username', trimmedInput);
    localStorage.setItem('roomCode', trimmedRoom);
    localStorage.setItem('avatar', selectedAvatar);

    socket.emit('createRoom', trimmedRoom, trimmedInput, selectedAvatar);

    navigate(`/salon/${trimmedRoom}`, {
      state: {
        username: trimmedInput,
        avatar: avatarObj.name,
      },
    });
  };

  // 👇 Ferme le champ "Join private game" si on clique en dehors de la modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setShowRoomInput(false);
        setRoomInput('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    socket.on('connect', () => {
      console.log('✅ Socket connecté:', socket.id);
    });

    socket.on('connect_error', (err) => {
      console.error('❌ Erreur de connexion socket:', err);
    });

    return () => {
      socket.off('connect');
      socket.off('connect_error');
    };
  }, []);

  return (
    <div className="login-page">
      <Header />
      <div className="login-wrapper">
        <div className='paying-container'>
          <div className='content-description'>
            <div className='paying-content'>
              <h3>GO PREMIUM !</h3>
              <div>
                <p>- Unlock all arcs — from East Blue to the very latest chapters !</p>
                <p>- 800 additional high-quality questions</p>
                <p>- Support the project and help us keep expanding the adventure !</p>
              </div>
              <div className='button-container'>
                <button className='button-premium'> BUY IT </button>
              </div>
            </div>
          </div>
        </div>
        <div className="modal-login" ref={modalRef}>
          <div className='section-one-piece-game-title'>
            <h3>ONE PIECE - GAME</h3>
          </div>

          <div className='information-player'>
            <input
              type="text"
              value={input}
              onChange={(e) => {
                const val = e.target.value;
                const formatted = val.charAt(0).toUpperCase() + val.slice(1);
                if (formatted.length <= 10) setInput(formatted);
              }}
              placeholder="Name"
              maxLength={10}
              
            />

            <button
              className="button-choose-avatar"
              onClick={() => setShowAvatarModal((prev) => !prev)}
            >
              Choose an avatar
            </button>
          </div>

          <div className='room-section'>
            <button
              className={`button-create ${trimmedInput ? 'active' : ''}`}
              onClick={handleCreateGame}
              disabled={!trimmedInput}
            >
              Create private game
            </button>
            <div className="join-game-section">
              {!showRoomInput ? (
                <button
                  className={`button-private-party ${trimmedInput ? 'active' : ''}`}
                  onClick={() => {
                    if (trimmedInput) {
                      setShowRoomInput(true);
                    }
                  }}
                  disabled={!trimmedInput}
                >
                  Private party code
                </button>
              ) : (
                <>
                <div className="join-row">
                  <input
                    className="room-input"
                    type="text"
                    value={roomInput}
                    onChange={(e) => setRoomInput(e.target.value)}
                    placeholder="Game code"
                    maxLength={10}
                  />
                  <button
                    className={`button-join-game ${isFormValid ? 'active' : ''}`}
                    onClick={handleSubmit}
                    disabled={!isFormValid}
                  >
                    Join
                  </button>
                </div>
                </>
              )}
            </div>
          </div>

          <div className="info-collapses">
            {/* Collapse pour les règles du jeu */}
            <div className="collapse">
              <button
                className="collapse-header"
                onClick={() =>
                  setShowRules((prev) => !prev)
                }
              >
                Game Rules
              </button>
              {showRules && (
                <div className="collapse-content">
                  <p>
                    The game consists of 15 questions, increasing in difficulty. Once you’ve completed them, you’ll correct your own answers and discover your final score at the end.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {showAvatarModal ? (
          <ModalAvatar
            avatarOptions={avatarOptions}
            selectedAvatar={selectedAvatar}
            onSelect={setSelectedAvatar}
            onClose={() => setShowAvatarModal(false)}
          />
        ) : (
          <div className='content-description'>
            <div className="free-content">
              <h3>Play for free !</h3>
                <p>- Test your knowledge of the One Piece world — solo or with your friends !</p>
                <p>- Not up to date ? No problem ! Choose the arcs you want to be quizzed on.</p>
                <p>- 400 questions covering the journey from East Blue to Marineford !</p>
            </div>
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
}

export default LoginPage;
