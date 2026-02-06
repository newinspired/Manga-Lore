import { useState } from "react";
import { auth } from "../firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "../styles/register-login.scss";

function Register() {
  // 👉 Création de compte par défaut
  const [isRegister, setIsRegister] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setError("");

    if (!email || !password || (isRegister && !username)) {
      setError("Please complete all fields");
      return;
    }

    try {
      if (isRegister) {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        await updateProfile(userCredential.user, {
          displayName: username,
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }

      // ✅ REDIRECTION CORRECTE (ICI ET NULLE PART AILLEURS)
      const redirect = localStorage.getItem("redirectAfterLogin");

      if (redirect) {
        localStorage.removeItem("redirectAfterLogin");
        navigate(redirect);
      } else {
        navigate("/");
      }

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="register-page">
      <div className="register-header">
        <h2>{isRegister ? "Welcome to Manga Lore ! Sign up" : "Log in"}</h2>
      </div>

      <div className="register-form">
        <div className="main-content">
          {isRegister && (
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          )}

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

          <button onClick={handleSubmit}>
            {isRegister ? "Sign up" : "Log in"}
          </button>
        </div>

        {error && <p className="error">{error}</p>}

        <div className="auth-toggle">
          {isRegister ? (
            <p>
              Already have an account ?{" "}
              <span onClick={() => setIsRegister(false)}>
                Log in
              </span>
            </p>
          ) : (
            <p>
              Don’t have an account yet ?{" "}
              <span onClick={() => setIsRegister(true)}>
                Sign up
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Register;
