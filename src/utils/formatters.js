export function formatMetric(value, suffix = "") {
  if (typeof value === "boolean") return value ? "ON" : "OFF";
  if (typeof value === "number" && suffix.includes("lux")) return `${value.toLocaleString("en-IN")}${suffix}`;
  return `${value ?? "—"}${suffix}`;
}

export function statusLabel(status) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}
