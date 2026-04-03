export function LogRow({
  time,
  title,
  body,
  tone,
}: {
  time: string;
  title: string;
  body: string;
  tone: "ok" | "alert" | "neutral";
}) {
  const color =
    tone === "ok" ? "#f2d48a" : tone === "alert" ? "#ff6a6a" : "#d6d7da";

  return (
    <div className="flex gap-4">
      <div
        className="w-[64px] text-[10px] tracking-[0.22em] uppercase"
        style={{ color }}
      >
        {time}
      </div>
      <div className="flex-1">
        <div className="text-[#d6d7da] text-[12px] tracking-[0.22em] uppercase">
          {title}
        </div>
        <div className="mt-1 text-[#5f636a] text-[11px] leading-relaxed">
          {body}
        </div>
      </div>
    </div>
  );
}
