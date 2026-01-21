import Papa from "papaparse";

const LOCAL_NASA_FILE =
  "/MODIS_C6_1_South_America_MCD14DL_NRT_2026021.txt";
const CACHE_KEY = "nasa_fires_cache";
const CACHE_DURATION = 4 * 60 * 60 * 1000; // 4 horas de cache

export async function getFires(forceUpdate = false) {
  // 1. Verificar cache primeiro (se não for forçado)
  if (!forceUpdate) {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION) {
        console.log("📂 Usando dados em cache (atualizado há", 
          Math.round((Date.now() - timestamp) / 60000), "minutos)");
        return data;
      }
    }
  }

  // 2. Buscar dados novos da NASA
  console.log("🌐 Buscando dados atualizados da NASA...");
  try {
    const response = await fetch(LOCAL_NASA_FILE);

    
    if (!response.ok) {
      throw new Error(`Erro NASA: ${response.status}`);
    }
    
    const text = await response.text();
    
    // 3. Parsear os dados
    const parsed = Papa.parse(text, {
      header: true,
      dynamicTyping: true,
    });
    
    const fireData = parsed.data;
    
    // 4. Salvar no cache (localStorage)
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data: fireData,
      timestamp: Date.now()
    }));
    
    console.log(`✅ ${fireData.length} focos de incêndio carregados`);
    return fireData;
    
  } catch (error) {
    console.error("❌ Erro ao buscar dados da NASA:", error);
    
    // 5. Fallback: tentar usar cache mesmo que antigo
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      console.log("⚡ Usando cache antigo como fallback");
      return JSON.parse(cached).data;
    }
    
    // 6. Último fallback: arquivo local original
    console.log("📁 Tentando arquivo local como último recurso...");
    try {
      const localResponse = await fetch("/fires.csv");
      const localText = await localResponse.text();
      const localParsed = Papa.parse(localText, {
        header: true,
        dynamicTyping: true,
      });
      console.log("⚠️ Usando arquivo LOCAL (pode estar desatualizado)");
      return localParsed.data;
    } catch (localError) {
      throw new Error("Falha ao carregar dados: " + error.message);
    }
  }
}

// Função extra para forçar atualização
export async function refreshFires() {
  return await getFires(true); // true = força atualização
}

// Função para verificar quando foi a última atualização
export function getLastUpdateTime() {
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    const { timestamp } = JSON.parse(cached);
    return new Date(timestamp);
  }
  return null;
}