import { Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";

import LoginPage from "./pages/Login-page";
import SalonPage from "./pages/Salon-page";
import GamePage from "./pages/game-page";
import ResultPage from "./pages/Result-page";
import CorrectionPage from "./pages/CorrectionPage";
import Login from "./components/login";
import RegisterPage from "./components/register";

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route path="/salon/:room" element={<SalonPage user={user} />} />
      <Route path="/game/:room" element={<GamePage user={user} />} />
      <Route path="/correction/:room" element={<CorrectionPage user={user} />} />
      <Route path="/result/:room" element={<ResultPage user={user} />} />
    </Routes>
  );
}

export default App;
