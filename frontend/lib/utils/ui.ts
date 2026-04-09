export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function makeTicks(seed: string, n = 64) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = (h ^ seed.charCodeAt(i)) * 16777619;
  const arr: number[] = [];
  for (let i = 0; i < n; i++) {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    const v = ((h >>> 0) % 1000) / 1000;
    arr.push(Math.max(0.18, Math.min(1, 0.18 + v * 0.82)));
  }
  return arr;
}

export type UIStatus = "LIVE" | "ALERT" | "IDLE";

export function resolveMonitorStatus(m: any): UIStatus {
  const s = (m?.last_status ?? m?.status) as string | undefined;
  if (s === "UP") return "LIVE";
  if (s === "PENDING") return "IDLE";
  return "ALERT";
}

export function iconGlyph(
  icon:
    | "home"
    | "pulse"
    | "heart"
    | "page"
    | "team"
    | "gear"
    | "gauge"
    | "alert"
    | "timer"
    | "shield"
) {
  switch (icon) {
    case "home":
      return "⌂";
    case "pulse":
      return "∿";
    case "heart":
      return "♥";
    case "page":
      return "▤";
    case "team":
      return "◎";
    case "gear":
      return "⛭";
    case "gauge":
      return "◔";
    case "alert":
      return "!";
    case "timer":
      return "⧖";
    case "shield":
      return "🛡";
    default:
      return "•";
  }
}
