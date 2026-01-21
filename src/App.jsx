import { useEffect, useState, useCallback } from "react";
import { getUserLocation } from "./services/location";
import { getFires, refreshFires, getLastUpdateTime } from "./services/fireApi";
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
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Função principal para carregar dados
  const loadData = useCallback(async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // 1. Obtém localização do usuário (só na primeira carga)
      if (!user) {
        const location = await getUserLocation();
        setUser(location);
      }

      // 2. Obtém dados das queimadas (com ou sem cache)
      const fireData = await getFires(forceRefresh);

      // 3. TRATAMENTO DOS DADOS
      const validFires = fireData
        .map(f => ({
          ...f,
          latitude: parseFloat(f.latitude),
          longitude: parseFloat(f.longitude),
          frp: parseFloat(f.frp || 0),
          brightness: parseFloat(f.brightness || 0),
          scan: parseFloat(f.scan || 0),
          track: parseFloat(f.track || 0)
        }))
        .filter(f => !isNaN(f.latitude) && !isNaN(f.longitude));

      setFires(validFires);

      // 4. Filtra queimadas num raio de 10km (só se tiver user)
      if (user) {
        const near = validFires.filter((fire) => {
          const dist = calcDistance(
            user.lat,
            user.lng,
            fire.latitude,
            fire.longitude
          );
          return dist <= 10;
        });
        setNearbyFires(near);
      }

      // 5. Atualiza timestamp da última atualização
      const updateTime = getLastUpdateTime();
      setLastUpdate(updateTime);

    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      setError(err.message || "Não foi possível carregar os dados de monitoramento.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  // Carregamento inicial
  useEffect(() => {
    loadData(false);
  }, [loadData]);

  // Função para atualizar manualmente
  const handleRefresh = async () => {
    await loadData(true);
  };

  // Função de Busca por Cidade
  async function handleSearchPlace() {
    if (!place.trim()) return;
    try {
      setError(null);
      const result = await geocodePlace(place);
      setViewLocation({ lat: result.lat, lng: result.lng });
      
      // Atualiza queimadas próximas à nova localização
      if (fires.length > 0) {
        const near = fires.filter((fire) => {
          const dist = calcDistance(
            result.lat,
            result.lng,
            fire.latitude,
            fire.longitude
          );
          return dist <= 10;
        });
        setNearbyFires(near);
      }
    } catch (err) {
      setError("Local não encontrado. Tente novamente.");
    }
  }

  // Formatar tempo desde a última atualização
  const formatTimeAgo = (date) => {
    if (!date) return "Nunca";
    
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 1) return "Agora mesmo";
    if (diffMins < 60) return `Há ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
    if (diffHours < 24) return `Há ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Estatísticas
  const totalFires = fires.length;
  const highIntensityFires = fires.filter(f => f.frp > 10).length;
  const veryHighIntensityFires = fires.filter(f => f.frp > 50).length;

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader"></div>
        <h2>Carregando Monitoramento Wastech...</h2>
        <p>Buscando dados de satélite da NASA</p>
      </div>
    );
  }

  return (
    <div className="app">
      {/* CABEÇALHO */}
      <header className="header">
        <div className="header-left">
          <h1>🔥 Wastech Fire Monitor</h1>
          <div className="subtitle">Monitoramento de Queimadas em Tempo Real</div>
        </div>
        
        <div className="header-right">
          <div className="update-info">
            <span className="update-label">Última atualização:</span>
            <span className="update-time">{formatTimeAgo(lastUpdate)}</span>
            <button 
              className="refresh-btn" 
              onClick={handleRefresh}
              disabled={refreshing}
              title="Atualizar dados agora"
            >
              {refreshing ? '🔄 Atualizando...' : '🔄 Atualizar'}
            </button>
          </div>
        </div>
      </header>

      {/* ESTATÍSTICAS */}
      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-value">{totalFires}</div>
          <div className="stat-label">Focos Ativos</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{highIntensityFires}</div>
          <div className="stat-label">Alta Intensidade</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{veryHighIntensityFires}</div>
          <div className="stat-label">Muito Alta</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{0}</div>
          <div className="stat-label">Próximos de Você</div>
        </div>
      </div>

      {/* 🔎 BUSCA E CONTROLES */}
      <div className="controls-container">
        <div className="search-box">
          <input 
            type="text" 
            placeholder="Buscar cidade, estado ou coordenadas..." 
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearchPlace()}
          />
          <button 
            className="search-btn"
            onClick={handleSearchPlace}
          >
            🔍 Buscar
          </button>
          {user && (
            <button 
              className="location-btn"
              onClick={() => {
                setViewLocation(null);
                // Recalcula queimadas próximas à localização original
                const near = fires.filter((fire) => {
                  const dist = calcDistance(
                    user.lat,
                    user.lng,
                    fire.latitude,
                    fire.longitude
                  );
                  return dist <= 10;
                });
                setNearbyFires(near);
              }}
              title="Voltar para minha localização"
            >
              📍 Minha Localização
            </button>
          )}
        </div>
      </div>

      {/* MENSAGENS DE ERRO/STATUS */}
      {error && (
        <div className="error-alert">
          ⚠️ {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {refreshing && (
        <div className="refreshing-alert">
          🔄 Atualizando dados da NASA...
        </div>
      )}

      {/* 🗺️ MAPA */}
      <div className="map-container">
        {user ? (
          <Map
            user={user}
            fires={fires}
            nearbyFires={nearbyFires}
            viewLocation={viewLocation}
          />
        ) : (
          <div className="map-placeholder">
            <p>Permita o acesso à localização para ver o mapa</p>
          </div>
        )}
      </div>

      {/* RODAPÉ INFORMATIVO */}
      <footer className="footer">
        <div className="footer-info">
          <p>
            <strong>Fonte de dados:</strong> NASA FIRMS - Dados de satélite VIIRS atualizados a cada 24h
          </p>
          <p>
            <strong>FRP (Fire Radiative Power):</strong> Medida da intensidade do fogo em MW (Megawatts)
          </p>
          <p className="footer-note">
            ⚠️ Dados são atualizados automaticamente. Raio de proximidade: 10km.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;