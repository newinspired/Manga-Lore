import { Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";

import LoginPage from "./pages/Login-page";
import SalonPage from "./pages/Salon-page";
import GamePage from "./pages/game-page";
import ResultPage from "./pages/Result-page";
import CorrectionPage from "./pages/CorrectionPage";
import RegisterPage from "./pages/Register";
import Checkout from "./pages/Checkout";

function App() {
  const [user, setUser] = useState(null);

  const [userData, setUserData] = useState({
    isLoggedIn: false,
    username: null,
    isPremium: false,
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

      <Route path="/register" element={<RegisterPage />} />
      <Route path="/checkout" element={<Checkout />} />

      <Route path="/" element={<LoginPage userData={userData} />} />
      <Route path="/salon/:room" element={<SalonPage userData={userData} />} />
      <Route path="/game/:room" element={<GamePage user={user} />} />
      <Route path="/correction/:room" element={<CorrectionPage user={user} />} />
      <Route path="/result/:room" element={<ResultPage user={user} />} />
    </Routes>
  );
}

export default App;
