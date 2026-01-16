export function getFireStyle(frp) {
  const value = Number(frp);

  if (value > 30) {
    return { color: "#dc2626", fillOpacity: 0.5 }; // vermelho
  }

  if (value >= 10) {
    return { color: "#f97316", fillOpacity: 0.4 }; // laranja
  }

  return { color: "#facc15", fillOpacity: 0.3 }; // amarelo
}
