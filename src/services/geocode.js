export async function geocodePlace(place) {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      place
    )}&format=json&limit=1`,
    {
      headers: {
        "User-Agent": "FireAlertApp/1.0 (contato@exemplo.com)",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Erro na requisição");
  }

  const data = await response.json();

  if (!data || data.length === 0) {
    throw new Error("Local não encontrado");
  }

  return {
    lat: Number(data[0].lat),
    lng: Number(data[0].lon),
    name: data[0].display_name,
  };
}
