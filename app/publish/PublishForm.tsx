"use client";

import Link from "next/link";
import { useRef, useState } from "react";

type Published = { id: string; title: string; url: string };

export default function PublishForm({ inviteOnly }: { inviteOnly: boolean }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Published | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function onFile(f: File | undefined) {
    setError(null);
    if (!f) return setPreview(null);
    if (f.size > 4 * 1024 * 1024) {
      setError("Image must be 4 MB or smaller.");
      return setPreview(null);
    }
    setPreview(URL.createObjectURL(f));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/works", { method: "POST", body: new FormData(form) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Upload failed.");
      setDone({ id: data.work.id, title: data.work.title, url: data.work.url });
      form.reset();
      setPreview(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      {done && (
        <div className="alert success">
          Listed: <Link href={`/w/${done.id}`}>{done.title}</Link>. Agents can find it now. Work id{" "}
          <span className="mono">{done.id}</span>.
        </div>
      )}
      {error && <div className="alert">{error}</div>}

      <div className={`drop ${preview ? "has" : ""}`} onClick={() => fileRef.current?.click()}>
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Selected image" />
        ) : (
          <>
            <strong>Choose an image</strong>
            <div className="hint">JPG, PNG or WebP · at least 400×400 · up to 4 MB</div>
          </>
        )}
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

      <div className="field">
        <label htmlFor="title">Title</label>
        <input className="input" id="title" name="title" required minLength={3} maxLength={90} placeholder="Morning pour" />
      </div>
      <div className="field">
        <label htmlFor="description">Description</label>
        <textarea className="input" id="description" name="description" maxLength={600} placeholder="What's in the picture, the light, the mood. Agents search this." />
      </div>
      <div className="field">
        <label htmlFor="tags">Tags</label>
        <input className="input" id="tags" name="tags" placeholder="coffee, cafe, lagos, warm light" />
        <span className="hint">Comma separated. These are what agents match on.</span>
      </div>
      <div className="two">
        <div className="field">
          <label htmlFor="creatorName">Your name</label>
          <input className="input" id="creatorName" name="creatorName" maxLength={60} placeholder="Shown on every licence" />
        </div>
        <div className="field">
          <label htmlFor="price">Price (USDC)</label>
          <input className="input" id="price" name="price" type="number" min="0.01" max="100" step="0.01" defaultValue="0.25" required />
        </div>
      </div>
      <div className="field">
        <label htmlFor="payTo">Your Base wallet address</label>
        <input className="input mono" id="payTo" name="payTo" required pattern="^0x[a-fA-F0-9]{40}$" placeholder="0x…" />
        <span className="hint">Payments go here directly. Stockroom never holds your money.</span>
      </div>
      {inviteOnly && (
        <div className="field">
          <label htmlFor="code">Invite code</label>
          <input className="input" id="code" name="code" required />
        </div>
      )}
      <p className="hint muted" style={{ margin: 0, fontSize: 13 }}>
        Only list work you made or have the rights to sell. By publishing you agree buyers get the Stockroom standard licence.
      </p>
      <div>
        <button className="btn" type="submit" disabled={busy}>
          {busy ? "Publishing…" : "Publish to Stockroom"}
        </button>
      </div>
    </form>
  );
}
