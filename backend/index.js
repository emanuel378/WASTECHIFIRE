import express from "express";
import cors from "cors";
import axios from "axios";

const app = express();
app.use(cors());
app.use(express.json());

const NASA_API_KEY = "SUA_API_KEY_AQUI";

// rota teste
app.get("/", (req, res) => {
  res.send("🔥 Fire Alert API rodando (NASA FIRMS - AREA)");
});

// focos por ÁREA (Brasil)
app.get("/fires", async (req, res) => {
  try {
    const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${NASA_API_KEY}/VIIRS_SNPP_NRT/-74,-34,-34,5/1`;

    const response = await axios.get(url);

    const lines = response.data.split("\n");
    const headers = lines[0].split(",");

    const data = lines.slice(1).map(line => {
      const values = line.split(",");
      return {
        latitude: parseFloat(values[0]),
        longitude: parseFloat(values[1]),
        brightness: values[2],
        confidence: values[8]
      };
    }).filter(f => !isNaN(f.latitude));

    res.json(data);
  } catch (error) {
    console.error("Erro NASA:", error.message);
    res.status(500).json({ error: "Erro ao buscar dados da NASA FIRMS" });
  }
});

app.listen(3000, () => {
  console.log("🔥 Backend rodando em http://localhost:3000");
});
