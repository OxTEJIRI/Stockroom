import { ImageResponse } from "next/og";
import { getBytes } from "@/lib/storage";
import { listWorks } from "@/lib/works";

export const alt = "Stockroom: your agent licenses the photo, the photographer gets paid";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-dynamic";

async function googleFont(family: string, text: string) {
  try {
    const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${family}&text=${encodeURIComponent(text)}`)).text();
    const url = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
    return url ? await (await fetch(url)).arrayBuffer() : null;
  } catch {
    return null;
  }
}

const HEAD = "Your agent licenses the photo.";
const SUB = "The photographer gets paid.";
const FOOT = "Paid in USDC through PayBox, straight to the creator. The payment is the licence.";
const FALLBACK = ["linear-gradient(135deg,#9a5a2c,#e2a865)", "linear-gradient(135deg,#29566a,#7cc0cf)", "linear-gradient(135deg,#3d3a5c,#c48c8a)"];

export default async function Image() {
  const works = (await listWorks().catch(() => [])).slice(0, 3);
  const [display, body, hand] = await Promise.all([
    googleFont("Archivo:wght@800", `Stockroom${HEAD}${SUB}`),
    googleFont("Archivo:wght@500", FOOT),
    googleFont("Permanent+Marker", "$0123456789.Licensed"),
  ]);
  const fonts = [
    ...(display ? [{ name: "Archivo", data: display, weight: 800 as const, style: "normal" as const }] : []),
    ...(body ? [{ name: "Archivo", data: body, weight: 500 as const, style: "normal" as const }] : []),
    ...(hand ? [{ name: "Marker", data: hand, weight: 400 as const, style: "normal" as const }] : []),
  ];

  const thumbs = await Promise.all(
    works.map(async (w) => {
      const b = await getBytes(`thumbs/${w.id}.jpg`).catch(() => null);
      return b ? `data:image/jpeg;base64,${b.toString("base64")}` : null;
    }),
  );
  const mounts = [0, 1, 2].map((i) => {
    const w = works[i];
    return {
      img: thumbs[i] ?? null,
      bg: FALLBACK[i],
      price: w ? `$${w.priceUsd.toFixed(2)}` : ["$0.25", "$1.00", "$0.50"][i],
    };
  });
  const pos = [
    { left: 0, top: 70, rot: -5 },
    { left: 200, top: 150, rot: 3 },
    { left: 40, top: 300, rot: 2 },
  ];

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#e4eaee", fontFamily: "Archivo", color: "#1f2529", position: "relative" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 0 56px 72px", width: 640 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 34, fontWeight: 800 }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 14px rgba(31,37,41,.25)" }}>
              <div style={{ width: 22, height: 15, background: "#1f2529", borderRadius: 2, display: "flex" }} />
            </div>
            Stockroom
          </div>
          <div style={{ display: "flex", flexDirection: "column", fontSize: 66, lineHeight: 1.02, letterSpacing: -2, fontWeight: 800 }}>
            <span>{HEAD}</span>
            <span style={{ color: "#56626b" }}>{SUB}</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 500, color: "#56626b", lineHeight: 1.35, maxWidth: 560, display: "flex" }}>{FOOT}</div>
        </div>
        <div style={{ position: "relative", display: "flex", width: 560, height: 630 }}>
          {mounts.map((m, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: pos[i].left,
                top: pos[i].top,
                width: 300,
                padding: "26px 20px 14px",
                background: "#fff",
                borderRadius: 10,
                transform: `rotate(${pos[i].rot}deg)`,
                boxShadow: "0 18px 34px -12px rgba(31,37,41,.45)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {m.img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.img} width={260} height={173} style={{ objectFit: "cover", borderRadius: 2 }} alt="" />
              ) : (
                <div style={{ width: 260, height: 173, background: m.bg, borderRadius: 2, display: "flex" }} />
              )}
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10, fontFamily: "Marker", fontSize: 24, color: "#d9232a" }}>{m.price}</div>
            </div>
          ))}
          <svg width="420" height="320" viewBox="0 0 400 300" style={{ position: "absolute", left: 150, top: 110 }}>
            <path d="M210 18 C 320 10, 392 70, 384 150 C 376 236, 290 286, 196 282 C 96 278, 14 230, 16 148 C 18 70, 96 22, 214 26 C 250 28, 282 36, 300 46" fill="none" stroke="#d9232a" strokeWidth="6" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
