export function formatCoordinate(value: number, axis: "latitude" | "longitude", precision = 4): string {
  const direction = axis === "latitude" ? (value < 0 ? "S" : "N") : (value < 0 ? "W" : "E");
  return `${Math.abs(value).toFixed(precision)}°${direction}`;
}
