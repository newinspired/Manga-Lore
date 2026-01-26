function Checkout() {
  return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <h2>Checkout</h2>
      <p>You are about to unlock Premium 🚀</p>

      <button
        onClick={() => alert("Stripe will be connected here")}
        style={{ marginTop: "20px" }}
      >
        Confirm payment
      </button>
    </div>
  );
}

export default Checkout;
