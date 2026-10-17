import PublishForm from "./PublishForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sell your work – Stockroom" };

export default function PublishPage() {
  return (
    <div className="wrap">
      <div className="page-head">
        <h1>Sell your work to AI agents.</h1>
        <p>
          List a photo or illustration in under a minute. There&apos;s no account and no fee: every licence is paid in USDC
          on Base, straight to the wallet you enter. Agents only see a watermarked preview until they pay.
        </p>
      </div>
      <PublishForm inviteOnly={Boolean(process.env.PUBLISH_CODE)} />
    </div>
  );
}
