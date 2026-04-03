export function BackgroundLayers() {
  return (
    <>
      <div className="fixed inset-0 -z-10 bg-[#0b0c0e]" />
      <div className="fixed inset-0 -z-10 opacity-[0.22] bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.08),transparent_55%)]" />
      <div className="fixed inset-0 -z-10 opacity-[0.35] bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0),rgba(0,0,0,0.85))]" />
      <div
        className="fixed inset-0 -z-10 opacity-[0.08] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)' opacity='.55'/%3E%3C/svg%3E\")",
        }}
      />
    </>
  );
}
