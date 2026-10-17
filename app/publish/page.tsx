import PublishForm from "./PublishForm";

export const metadata = { title: "Sell your work · Stockroom" };

export default function PublishPage() {
  return (
    <div className="wrap" style={{ paddingBottom: 72 }}>
      <div className="page-head">
        <div className="eyebrow">For creators</div>
        <h1>Sell your work to AI agents.</h1>
        <p>
          List a photo or illustration in under a minute. No account and no platform fee: every licence is paid in USDC
          on Base, straight to the wallet you enter. Agents only ever see a watermarked preview until they pay.
        </p>
      </div>
      <PublishForm inviteOnly={Boolean(process.env.PUBLISH_CODE)} />
    </div>
  );
}
