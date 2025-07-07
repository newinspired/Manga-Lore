import { useNavigate } from 'react-router-dom';
import '../styles/login-page.scss';
import '../styles/modal-avatar.scss'
import { useState, useEffect } from 'react';
import socket from '../socket';
import ModalAvatar from '../components/modal-avatar.jsx';

import trafalgarLaw from '../assets/avatars/trafalgar.jpg';
import blackbeard from '../assets/avatars/blackbeard.jpg';
import luffy from '../assets/avatars/luffy.jpg';
import shanks from '../assets/avatars/shanks2.jpg';
import baggy from '../assets/avatars/baggy.jpg';

import sanji from '../assets/avatars/sanji.jpg';
import nami from '../assets/avatars/nami.jpg';
import mihawk from '../assets/avatars/mihawk.jpg';
import crocodile from '../assets/avatars/crocodile.jpg'
import hancock from '../assets/avatars/hancock-manga.jpg';

import doflamingo from '../assets/avatars/doflamingo.jpg';
import barbeBlanche from '../assets/avatars/barbe-blanche.jpg';
import sabo from '../assets/avatars/sabo.jpg';
import rayleigh from '../assets/avatars/rayleigh.jpg';
import aokiji from '../assets/avatars/aokiji.jpg';

import kaido from '../assets/avatars/kaido.jpg';
import robin from '../assets/avatars/robin.jpg';
import ace from '../assets/avatars/ace.jpg';
import zoro from '../assets/avatars/zoro.jpg'


function LoginPage({ setUsername, setRoomCode }) {
  const navigate = useNavigate();

  const avatarOptions = [
    { name: 'Luffy', src: luffy },
    { name: 'zoro', src: zoro },
    { name: 'Shanks', src: shanks },
    { name: 'Mihawk', src: mihawk },
    { name: 'aokiji', src: aokiji },

    { name: 'Barbe noir', src: blackbeard },
    { name: 'robin', src: robin },
    { name: 'Doflamingo', src: doflamingo },

    { name: 'Ace', src: ace },
    { name: 'Hancock', src: hancock },

    
    
    { name: 'nami', src: nami },
    
    { name: 'sabo', src: sabo },
    { name: 'kaido', src: kaido },
    { name: 'Sanji', src: sanji },
    { name: 'Barbe Blanche', src: barbeBlanche },
  ];

  const [input, setInput] = useState('');
  const [roomInput, setRoomInput] = useState('');
  const [showRoomInput, setShowRoomInput] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(avatarOptions[0].name);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  const isFormValid = input.trim() !== '' && roomInput.trim() !== '';

  const generateRoomCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomInput(code);
  };

  const handleSubmit = () => {
    const trimmed = input.trim();
    const trimmedRoom = roomInput.trim();

    if (trimmed && trimmedRoom) {
      const avatarObj = avatarOptions.find(a => a.name === selectedAvatar);
      setUsername(trimmed);
      setRoomCode(trimmedRoom);

      localStorage.setItem('username', trimmed);
      localStorage.setItem('roomCode', trimmedRoom);
      localStorage.setItem('avatar', selectedAvatar);

      socket.emit('joinRoom', trimmedRoom, trimmed, avatarObj.name);

      navigate(`/salon/${trimmedRoom}`, {
        state: {
          username: trimmed,
          avatar: avatarObj.name,
        },
      });
    }
  };

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
        <div className="modal-login">
          <h3>MANGA | LORE</h3>
          
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nom"
              maxLength={10}
            />
            
              <button className='button-top' onClick={generateRoomCode}>Créer une partie</button>

              <button className='button-mid' onClick={() => setShowRoomInput(true)}>Rejoindre une partie</button>

              {showRoomInput && (
                <input
                  type="text"
                  value={roomInput}
                  onChange={(e) => setRoomInput(e.target.value)}
                  placeholder="Code de la partie"
                  maxLength={10}
                />
              )}

              <button className='button-bot' onClick={() => setShowAvatarModal(true)}>Choisir un avatar</button>

              
              

              <button onClick={handleSubmit} disabled={!isFormValid}>Prêt</button>
          
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
    </div>
  );
}

export default LoginPage;