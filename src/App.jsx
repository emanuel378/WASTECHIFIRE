import { useEffect, useState } from "react";
import { getUserLocation } from "./services/location";
import { getFires } from "./services/fireApi";
import { calcDistance } from "./utils/distance";
import { geocodePlace } from "./services/geocode";
import Map from "./components/Map";
import "leaflet/dist/leaflet.css";

function App() {
  const [user, setUser] = useState(null);
  const [fires, setFires] = useState([]);
  const [nearbyFires, setNearbyFires] = useState([]);
  const [viewLocation, setViewLocation] = useState(null);
  const [place, setPlace] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // 1. Obtém localização do usuário
        const location = await getUserLocation();
        setUser(location);

        // 2. Obtém dados das queimadas
        const fireData = await getFires();

        // 3. TRATAMENTO DOS DADOS (Converte triângulos em números para virarem fogos)
        const validFires = fireData.map(f => ({
          ...f,
          // parseFloat garante que a coordenada seja um número puro
          latitude: parseFloat(f.latitude),
          longitude: parseFloat(f.longitude),
          frp: parseFloat(f.frp || 0)
        })).filter(f => !isNaN(f.latitude) && !isNaN(f.longitude));

        setFires(validFires);

        // 4. Filtra queimadas num raio de 10km
        const near = validFires.filter((fire) => {
          const dist = calcDistance(
            location.lat,
            location.lng,
            fire.latitude,
            fire.longitude
          );
          return dist <= 10;
        });

        setNearbyFires(near);
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
        setError("Não foi possível carregar os dados de monitoramento.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Função de Busca por Cidade
  async function handleSearchPlace() {
    if (!place) return;
    try {
      setError(null);
      const result = await geocodePlace(place);
      setViewLocation({ lat: result.lat, lng: result.lng });
    } catch (err) {
      setError("Local não encontrado. Tente novamente.");
    }
  }

  if (loading) {
    return (
      <div style={{ background: "#0f172a", height: "100vh", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <h2>Carregando Monitoramento Wastech...</h2>
      </div>
    );
  }

  return (
    <div className="app">
      <h1>Wastech</h1>

      {/* 🔎 CONTAINER DE BUSCA */}
      <div className="search-container">
        <input 
          type="text" 
          placeholder="Buscar cidade ou região..." 
          value={place}
          onChange={(e) => setPlace(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearchPlace()}
        />
        <button onClick={handleSearchPlace}>Buscar</button>
      </div>

      {error && <p style={{ color: "#ef4444", marginBottom: "10px" }}>{error}</p>}

      {/* 🗺️ COMPONENTE DO MAPA */}
      {user && (
        <Map
          user={user}
          fires={fires}
          nearbyFires={nearbyFires}
          viewLocation={viewLocation}
        />
      )}
    </div>
  );
}

export default App;