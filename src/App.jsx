import { Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";

import LoginPage from "./pages/Login-page";
import SalonPage from "./pages/Salon-page";
import GamePage from "./pages/game-page";
import ResultPage from "./pages/Result-page";
import CorrectionPage from "./pages/CorrectionPage";
import Checkout from "./pages/Checkout";
import Register from "./pages/register";
import Success from "./pages/Success";
import FindThemAll from "./pages/Find-them-all";

function App() {
  const [user, setUser] = useState(null);

  const [userData, setUserData] = useState({
    isLoggedIn: false,
    username: null,
    isPremium: true,
  });

  useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        setUserData({
          isLoggedIn: true,
          username: currentUser.displayName,
          isPremium: false,
        });
      } else {
        setUserData({
          isLoggedIn: false,
          username: null,
          isPremium: false,
        });
      }
    });

    return () => unsubscribe();
  }, []);


  return (
    <Routes>

      <Route path="/register" element={<Register />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/success" element={<Success />} />

      <Route path="/" element={<LoginPage userData={userData} />} />
      <Route path="/salon/:room" element={<SalonPage userData={userData} />} />
      <Route path="/game/:room" element={<GamePage user={user} />} />
      <Route path="/correction/:room" element={<CorrectionPage user={user} />} />
      <Route path="/result/:room" element={<ResultPage user={user} />} />

      <Route path="/findthemAll/:room" element={<FindThemAll user={user} />} />

    </Routes>
  );
}

export default App;
