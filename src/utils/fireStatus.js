export function getFireStatus(frp) {
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
