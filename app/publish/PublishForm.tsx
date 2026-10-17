"use client";

import Link from "next/link";
import { useRef, useState } from "react";

type Published = { id: string; title: string };

export default function PublishForm({ inviteOnly }: { inviteOnly: boolean }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("0.25");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Published | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function onFile(f: File | undefined) {
    setError(null);
    if (!f) return setPreview(null);
    if (f.size > 4 * 1024 * 1024) {
      setError("That image is over 4 MB. Export a smaller JPG and try again.");
      return setPreview(null);
    }
    setPreview(URL.createObjectURL(f));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setBusy(true);
    setError(null);
    setDone(null);
    try {
      const res = await fetch("/api/works", { method: "POST", body: new FormData(form) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Publishing failed. Check the fields and try again.");
      setDone({ id: data.work.id, title: data.work.title });
      form.reset();
      setPreview(null);
      setTitle("");
      setPrice("0.25");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publishing failed.");
    } finally {
      setBusy(false);
    }
  }

  const priceLabel = Number(price) > 0 ? `$${Number(price).toFixed(2)}` : "";

  return (
    <form className="publish" onSubmit={onSubmit}>
      <div
        className={`dropmount ${preview ? "has" : ""}`}
        role="button"
        tabIndex={0}
        aria-label="Choose an image"
        onClick={() => fileRef.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && fileRef.current?.click()}
      >
        <div className="win">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Your selected image" />
          ) : (
            <div>
              <strong style={{ color: "var(--ink)" }}>Choose an image</strong>
              <div className="hint">JPG, PNG or WebP, at least 400×400, up to 4 MB</div>
            </div>
          )}
        </div>
        <div className="note">
          <span>{title || "Untitled"}</span>
          <em>{priceLabel}</em>
        </div>
        <input
          ref={fileRef}
          type="file"
          name="file"
          accept="image/jpeg,image/png,image/webp"
          required
          hidden
          onChange={(e) => onFile(e.target.files?.[0])}
        />
      </div>

      <div className="form">
        {done && (
          <div className="alert success">
            Published. <Link href={`/w/${done.id}`}>{done.title}</Link> is in the catalogue and agents can find it now.
          </div>
        )}
        {error && <div className="alert">{error}</div>}

        <div className="field">
          <label htmlFor="title">Title</label>
          <input className="input" id="title" name="title" required minLength={3} maxLength={90} placeholder="Morning pour" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="description">Description</label>
          <textarea className="input" id="description" name="description" maxLength={600} placeholder="What's in the picture, the light, the mood. Agents search this text." />
        </div>
        <div className="field">
          <label htmlFor="tags">Tags</label>
          <input className="input" id="tags" name="tags" placeholder="coffee, cafe, lagos, warm light" />
          <span className="hint">Separate with commas. Agents match on these.</span>
        </div>
        <div className="two">
          <div className="field">
            <label htmlFor="creatorName">Your name</label>
            <input className="input" id="creatorName" name="creatorName" maxLength={60} placeholder="Shown on every licence" />
          </div>
          <div className="field">
            <label htmlFor="price">Price per licence (USDC)</label>
            <input className="input" id="price" name="price" type="number" min="0.01" max="100" step="0.01" required value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="payTo">Your Base wallet address</label>
          <input className="input mono" id="payTo" name="payTo" required pattern="^0x[a-fA-F0-9]{40}$" placeholder="0x…" />
          <span className="hint">Payments land here directly. Stockroom never holds your money.</span>
        </div>
        {inviteOnly && (
          <div className="field">
            <label htmlFor="code">Invite code</label>
            <input className="input" id="code" name="code" required />
          </div>
        )}
        <p className="hint" style={{ margin: 0 }}>
          Only list work you made or have the right to sell. Buyers get the Stockroom standard licence.
        </p>
        <div>
          <button className="btn" type="submit" disabled={busy}>
            {busy ? "Publishing…" : "Publish"}
          </button>
        </div>
      </div>
    </form>
  );
}
