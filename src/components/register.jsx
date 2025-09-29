import { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../firebase';

function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState(''); // pseudo du jeu
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!email || !password || !username) {
      setError('Please fill all fields');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Ajouter le pseudo dans le profil Firebase
      await updateProfile(userCredential.user, {
        displayName: username,
      });

      // Tu peux aussi stocker ce pseudo localement si besoin
      localStorage.setItem('username', username);

      // Rediriger vers la page de connexion ou salon
      console.log('User registered with pseudo:', username);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="register-page">
      <div className="register-header">
        <p>Welcome to Manga Lore !</p>
      </div>
      <div className="register-form">
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={handleRegister}>Register</button>
        {error && <p>{error}</p>}
      </div>
    </div>
  );
}

export default RegisterPage;
