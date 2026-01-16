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
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const location = await getUserLocation();
        setUser(location);

        const fireData = await getFires();

        const validFires = fireData.filter(
          (fire) =>
            fire.latitude !== undefined &&
            fire.longitude !== undefined &&
            !isNaN(fire.latitude) &&
            !isNaN(fire.longitude)
        );

        setFires(validFires);

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
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  async function handleSearchPlace() {
    try {
      setSearching(true);
      setError(null);

      const result = await geocodePlace(place);
      setViewLocation({ lat: result.lat, lng: result.lng });
    } catch (err) {
      setError("Local não encontrado");
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="app">
      <h1>Wastech</h1>

      {/* 🔎 BUSCA POR NOME */}
     

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
