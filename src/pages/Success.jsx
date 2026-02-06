import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Success() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/");
    }, 3000); // ⏳ 3 secondes

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <h2>Payment successful 🎉</h2>
      <p>Welcome to Premium!</p>

      <p>
        You will be redirected to the home page shortly.
      </p>

      <button
        style={{
          marginTop: "20px",
          padding: "10px 20px",
          cursor: "pointer",
        }}
        onClick={() => navigate("/")}
      >
        Go to home
      </button>
    </div>
  );
}

export default Success;
