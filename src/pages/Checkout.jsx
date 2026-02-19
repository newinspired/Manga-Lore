import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";

function Checkout() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.currentUser) {
      localStorage.setItem("redirectAfterLogin", "/checkout");
      navigate("/register");
    }
  }, [navigate]);

  const handlePayment = async () => {
  const res = await fetch(
    "http://127.0.0.1:5001/manga-lore/us-central1/createCheckoutSession",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

    const data = await res.json();
      window.location.href = data.url;
    };

  return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <h2>Checkout</h2>
      <p>You are about to unlock Premium 🚀</p>

        <button onClick={handlePayment}>
            Confirm payment
        </button>

    </div>
  );
}

export default Checkout;
