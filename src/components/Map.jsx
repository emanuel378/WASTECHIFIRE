import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  Pane,
} from "react-leaflet";
import L from "leaflet";
import { calcDistance } from "../utils/distance";
import { getFireStyle } from "../utils/fireStyle";
import "leaflet/dist/leaflet.css";

/* 🔴 ÍCONE CIRCULAR PARA INCÊNDIOS */
const fireDotIcon = new L.DivIcon({
  className: "",
  html: `
    <div style="
      width: 14px;
      height: 14px;
      background: radial-gradient(circle, #ff6b6b, #dc2626);
      border: 2px solid #ffffff;
      border-radius: 50%;
      box-shadow: 0 0 12px rgba(220,38,38,0.8);
    "></div>
  `,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

/* 🔥 STATUS DO FOGO PELO FRP */
function getFireStatus(frp) {
  if (!frp || isNaN(frp)) {
    return { label: "Desconhecido", color: "#6b7280" };
  }

  if (frp < 20) {
    return { label: "Baixo", color: "#16a34a" };
  }

  if (frp < 50) {
    return { label: "Médio", color: "#f59e0b" };
  }

  return { label: "Alto", color: "#dc2626" };
}

export default function Map({ user, fires, nearbyFires }) {
  if (!user?.lat || !user?.lng) return null;

  const validFires = fires.filter(
    (fire) =>
      fire.latitude !== undefined &&
      fire.longitude !== undefined &&
      !isNaN(fire.latitude) &&
      !isNaN(fire.longitude)
  );

  const validNearby = nearbyFires.filter(
    (fire) =>
      fire.latitude !== undefined &&
      fire.longitude !== undefined &&
      !isNaN(fire.latitude) &&
      !isNaN(fire.longitude)
  );

  return (
    <div style={{ position: "relative" }}>
      <MapContainer
        center={[user.lat, user.lng]}
        zoom={9}
        scrollWheelZoom
        style={{
          height: "500px",
          width: "100%",
          borderRadius: "20px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
        }}
      >
        {/* 🗺️ MAPA BASE */}
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* 🧱 CAMADAS */}
        <Pane name="user" style={{ zIndex: 600 }} />
        <Pane name="markers" style={{ zIndex: 550 }} />
        <Pane name="nearby" style={{ zIndex: 500 }} />
        <Pane name="fires" style={{ zIndex: 400 }} />

        {/* 📍 SUA LOCALIZAÇÃO */}
        <Marker pane="user" position={[user.lat, user.lng]}>
          <Popup>
            <strong>📍 Sua localização</strong>
            <br />
            Latitude: {user.lat}
            <br />
            Longitude: {user.lng}
          </Popup>
        </Marker>

        <Circle
          pane="user"
          center={[user.lat, user.lng]}
          radius={10000}
          pathOptions={{
            color: "#2563eb",
            fillColor: "#2563eb",
            fillOpacity: 0.15,
            dashArray: "6 6",
          }}
        />

        {/* 🔥 INCÊNDIOS (CLICÁVEL + STATUS) */}
        {validFires.map((fire, index) => {
          const style = getFireStyle(fire.frp);
          const status = getFireStatus(fire.frp);

          return (
            <Circle
              key={`fire-${index}`}
              pane="fires"
              center={[
                Number(fire.latitude),
                Number(fire.longitude),
              ]}
              radius={2500}
              pathOptions={{
                color: style.color,
                fillColor: style.color,
                fillOpacity: style.fillOpacity,
              }}
            >
              <Popup>
                <strong>🔥 Incêndio</strong>
                <br />
                Status:{" "}
                <span style={{ color: status.color, fontWeight: "bold" }}>
                  {status.label}
                </span>
                <br />
                FRP: {fire.frp ?? "N/A"}
                <br />
                Confiança: {fire.confidence ?? "N/A"}%
              </Popup>
            </Circle>
          );
        })}

        {/* 🚨 MARCADORES ATÉ 300km */}
        {validFires
          .filter((fire) => {
            const d = calcDistance(
              user.lat,
              user.lng,
              fire.latitude,
              fire.longitude
            );
            return d <= 300;
          })
          .map((fire, index) => (
            <Marker
              key={`marker-${index}`}
              pane="markers"
              icon={fireDotIcon}
              position={[
                Number(fire.latitude),
                Number(fire.longitude),
              ]}
            >
              <Popup>
                <strong>🔥 Incêndio detectado</strong>
                <br />
                FRP: {fire.frp ?? "N/A"}
              </Popup>
            </Marker>
          ))}

        {/* ⚠️ INCÊNDIOS PRÓXIMOS */}
        {validNearby.map((fire, index) => (
          <Circle
            key={`near-${index}`}
            pane="nearby"
            center={[
              Number(fire.latitude),
              Number(fire.longitude),
            ]}
            radius={5000}
            pathOptions={{
              color: "#dc2626",
              fillColor: "#dc2626",
              fillOpacity: 0.35,
            }}
          />
        ))}
      </MapContainer>

      {/* 📊 LEGENDA */}
      <div
        style={{
          position: "absolute",
          bottom: 16,
          left: 16,
          background: "rgba(255,255,255,0.95)",
          padding: "12px 14px",
          borderRadius: "12px",
          fontSize: "13px",
          boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
        }}
      >
        <strong>Legenda</strong>
        <div>🟢 Fogo baixo</div>
        <div>🟡 Fogo médio</div>
        <div>🔴 Fogo alto</div>
        <div>🔵 Raio do usuário (10km)</div>
      </div>
    </div>
  );
}
