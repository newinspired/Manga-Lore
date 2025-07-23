import { useNavigate } from 'react-router-dom';
import '../styles/login-page.scss';
import '../styles/modal-avatar.scss'
import { useState, useEffect } from 'react';
import socket from '../socket';
import ModalAvatar from '../components/modal-avatar.jsx';
import Footer from '../components/footer.jsx';

import trafalgarLaw from '../assets/avatars/trafalgar.jpg';
import blackbeard from '../assets/avatars/blackbeard.jpg';
import luffy from '../assets/avatars/luffy.jpg';
import shanks from '../assets/avatars/shanks.jpg';
import baggy from '../assets/avatars/baggy.jpg';

import sanji from '../assets/avatars/sanji.jpg';
import nami from '../assets/avatars/nami.jpg';
import mihawk from '../assets/avatars/mihawk.jpg';
import crocodile from '../assets/avatars/crocodile.jpg'
import hancock from '../assets/avatars/hancock-manga.jpg';

import doflamingo from '../assets/avatars/doflamingo.jpg';
import barbeBlanche from '../assets/avatars/barbe-blanche.jpg';
import sabo from '../assets/avatars/sabo.jpg';
import akainu from '../assets/avatars/akainu.jpg';
import aokiji from '../assets/avatars/aokiji.jpg';

import kaido from '../assets/avatars/kaido.jpg';
import robin from '../assets/avatars/robin.jpg';
import ace from '../assets/avatars/ace.jpg';
import zoro from '../assets/avatars/zoro.jpg'


function LoginPage({ setUsername, setRoomCode }) {
  const navigate = useNavigate();

  const avatarOptions = [

    { name: 'trafalgarLaw', src: trafalgarLaw },
    { name: 'shanks', src: shanks },
    { name: 'luffy', src: luffy },
    { name: 'doflamingo', src: doflamingo },
    
    { name: 'akainu', src: akainu },

    { name: 'Hancock', src: hancock },
    { name: 'Mihawk', src: mihawk },

    
    { name: 'Barbe noir', src: blackbeard },
    { name: 'robin', src: robin },
    { name: 'Ace', src: ace },


  
    { name: 'nami', src: nami },
    { name: 'sabo', src: sabo },
    { name: 'sanji', src: sanji },
    { name: 'crocodile', src: crocodile },
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

      socket.emit('createRoom', trimmedRoom, trimmed, selectedAvatar);

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
              placeholder="Name"
              maxLength={11}
            />

            <button className='button-top' onClick={() => setShowAvatarModal(true)}>Choose an avatar</button>
            
            <button className='button-mid' onClick={generateRoomCode}>Create private game</button>

            {!showRoomInput ? (
              <button className='button-bot' onClick={() => setShowRoomInput(true)}>Join a game</button>
            ) : (
              <input
                className="room-input"
                type="text"
                value={roomInput}
                onChange={(e) => setRoomInput(e.target.value)}
                placeholder="Game code"
                maxLength={10}
              />
            )}

              
              

            <button className="button-ready" onClick={handleSubmit} disabled={!isFormValid}>Ready</button>
          
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

      <Footer />  
    </div>
  );
}

export default LoginPage;