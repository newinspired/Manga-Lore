import { useNavigate } from 'react-router-dom';
import '../styles/login-page.scss';
import '../styles/modal-avatar.scss';
import { useState, useEffect, useRef } from 'react';
import socket from '../socket';
import ModalAvatar from '../components/modal-avatar.jsx';
import Footer from '../components/footer.jsx';

import luffy from '../assets/avatars-color/luffy.jpg';
import zoro from '../assets/avatars-color/zoro.jpg';
import nami from '../assets/avatars-color/nami.jpg';
import usopp from '../assets/avatars-color/usopp.jpg';
import sanji from '../assets/avatars-color/sanji.jpg';

import chopper from '../assets/avatars-color/chopper.jpg';
import robin from '../assets/avatars-color/robin.jpg';
import franky from '../assets/avatars-color/franky.jpg';
import brook from '../assets/avatars-color/brook.jpg';
import jimbei from '../assets/avatars-color/jimbei.jpg';

import shanks from '../assets/avatars-color/shanks.jpg';
import kobby from '../assets/avatars-color/kobby.jpg';


function LoginPage({ setUsername, setRoomCode }) {
  const navigate = useNavigate();
  const modalRef = useRef(null);
  const avatarOptions = [
    { name: 'shanks', src: shanks },
    { name: 'kobby', src: kobby },

    { name: 'luffy', src: luffy },
    { name: 'zoro', src: zoro },
    { name: 'nami', src: nami },
    { name: 'usopp', src: usopp },
    { name: 'sanji', src: sanji },

    { name: 'chopper', src: chopper },
    { name: 'robin', src: robin },
    { name: 'franky', src: franky },
    { name: 'brook', src: brook },
    { name: 'jimbei', src: jimbei },



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
      <div className="login-wrapper">
        <div className="modal-login" ref={modalRef}>
          <h3>ONE PIECE - GAME</h3>

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
            className="button-top"
            onClick={() => setShowAvatarModal((prev) => !prev)}
          >
            Choose an avatar
          </button>

          <button
            className={`button-mid ${trimmedInput ? 'active' : ''}`}
            onClick={handleCreateGame}
            disabled={!trimmedInput}
          >
            Create private game
          </button>

          {!showRoomInput ? (
            <button
              className={`button-bot ${trimmedInput ? 'active' : ''}`}
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
              <input
                className="room-input"
                type="text"
                value={roomInput}
                onChange={(e) => setRoomInput(e.target.value)}
                placeholder="Game code"
                maxLength={10}
              />
            </>
          )}

          <button
            className={`button-ready ${isFormValid ? 'active' : ''}`}
            onClick={handleSubmit}
            disabled={!isFormValid}
          >
            Join private game
          </button>
        </div>

        {showAvatarModal && (
          <ModalAvatar
            avatarOptions={avatarOptions}
            selectedAvatar={selectedAvatar}
            onSelect={setSelectedAvatar}
            onClose={() => setShowAvatarModal(false)}
          />
        )}
      </div>
      
      <div className="info-collapses">
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
                This is a quiz game about the world of One Piece. Regardless of how far you have read or seen the work, you can select the arcs you want. First, you will be asked a series of 20 questions ranging from easy to difficult, and then you will correct your answers yourself.
              </p>
            </div>
          )}
        </div>

        {/* Collapse pour la description */}
        <div className="collapse">
          <button
            className="collapse-header"
            onClick={() =>
              setShowDescription((prev) => !prev)
            }
          >
            Description
          </button>
          {showDescription && (
            <div className="collapse-content">
              <p>
                This site was created by a fan who loves Eiichirō Oda and his work. It is, of course, not official. I really hope you will enjoy the game :)
              </p>
            </div>
          )}
        </div>
      </div>




      <Footer />
    </div>
  );
}

export default LoginPage;
