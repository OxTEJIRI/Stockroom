import { NETWORK_LABEL, siteUrl } from "@/lib/config";
import { TERMS_SUMMARY } from "@/lib/terms";

export const metadata = { title: "For agents · Stockroom" };

const TOOLS = [
  ["search_works", "Find photos and illustrations by what they show.", "free"],
  ["get_work", "Preview, price, creator and licence terms for one work.", "free"],
  ["license_work", "Returns the paid x402 URL to settle through PayBox.", "paid"],
  ["complete_license", "Settles a payment signed by PayBox pay_x402 and issues the licence.", "paid"],
  ["verify_license", "Confirm a licence and its on-chain payment.", "free"],
];

export default function AgentsPage() {
  const base = siteUrl();
  return (
    <div className="wrap prose" style={{ paddingBottom: 72 }}>
      <div className="page-head">
        <div className="eyebrow">For agents and the people who run them</div>
        <h1>Licensed images, paid for in one approval.</h1>
        <p>
          Stockroom is a PayBox plugin. Your agent searches real creators&apos; work, you approve the price with your
          passkey, and the USDC goes straight to the creator on {NETWORK_LABEL}.
        </p>
      </div>

      <h2>Connect</h2>
      <p>In PayBox, open Plugins and enable Stockroom. Any other MCP client can connect directly:</p>
      <div className="code">{base}/api/mcp</div>

      <h2>Tools</h2>
      <div className="tools">
        {TOOLS.map(([name, desc, cost]) => (
          <div key={name}>
            <span className="mono">{name}</span>
            <span className="muted">{desc}</span>
            <span className="price">{cost}</span>
          </div>
        ))}
      </div>

      <h2>How a purchase works</h2>
      <ol>
        <li>The agent calls <span className="mono">license_work</span> and gets a pay URL.</li>
        <li>
          It calls PayBox <span className="mono">use_service</span> with that URL. Stockroom answers{" "}
          <span className="mono">402 Payment Required</span> with the price and the creator&apos;s wallet as the
          recipient.
        </li>
        <li>PayBox shows you the payment and asks for your passkey. Nothing moves without it.</li>
        <li>
          Stockroom verifies and settles the USDC transfer, then returns the full-resolution download link and a licence
          receipt tied to the transaction.
        </li>
        <li>Sending the same signed payment again returns the same licence. You are never charged twice.</li>
      </ol>

      <h2>Try it</h2>
      <div className="code">Find a warm, wide photo of a coffee shop on Stockroom and license it for my landing page.</div>

      <h2>Licence</h2>
      <p>{TERMS_SUMMARY}</p>

      <h2>Raw x402</h2>
      <p>
        No PayBox? Any x402 client can pay <span className="mono">{base}/api/license/&lt;work id&gt;</span> directly.
        Catalogue JSON: <span className="mono">{base}/api/works</span>.
      </p>
    </div>
  );
}
