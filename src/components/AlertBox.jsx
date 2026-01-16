export default function AlertBox({ distance }) {
  return (
    <div style={{
      backgroundColor: "#ff4d4f",
      color: "white",
      padding: "16px",
      borderRadius: "8px",
      marginTop: "12px",
      textAlign: "center",
      fontWeight: "bold"
    }}>
      🔥 Atenção! Incêndio detectado a menos de {distance} km de você.
    </div>
  );
}
