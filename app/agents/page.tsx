import CopyButton from "@/app/components/CopyButton";
import { NETWORK_LABEL, siteUrl } from "@/lib/config";
import { TERMS_SUMMARY } from "@/lib/terms";

export const metadata = { title: "For agents – Stockroom" };

const TOOLS: [string, string, "free" | "paid"][] = [
  ["search_works", "Finds photos and illustrations by what they show.", "free"],
  ["get_work", "Shows the preview, price, creator and licence terms for one work.", "free"],
  ["license_work", "Prepares the payment for PayBox to approve.", "paid"],
  ["complete_license", "Finishes a payment signed with PayBox pay_x402 and issues the licence.", "paid"],
  ["verify_license", "Confirms a licence and its on-chain payment.", "free"],
];

export default function AgentsPage() {
  const base = siteUrl();
  const mcp = `${base}/api/mcp`;
  return (
    <div className="wrap">
      <div className="page-head">
        <h1>Licensed images, paid for in one approval.</h1>
        <p>
          Stockroom is a PayBox plugin. Your agent searches work by real creators, you approve the price with your passkey,
          and the USDC goes straight to the creator on {NETWORK_LABEL}.
        </p>
      </div>

      <div className="doc">
        <h2 style={{ marginTop: 0 }}>Connect</h2>
        <p>In the PayBox app, open Plugins and turn on Stockroom. Any other MCP client can connect with this address:</p>
        <div className="urlbox">
          <code>{mcp}</code>
          <CopyButton value={mcp} />
        </div>

        <h2>Tools</h2>
        <div className="toolrows">
          {TOOLS.map(([name, desc, cost]) => (
            <div key={name} className="toolrow">
              <span className="name">{name}</span>
              <span className="d">{desc}</span>
              <span className={`cost ${cost}`}>{cost === "paid" ? "Needs approval" : "Free"}</span>
            </div>
          ))}
        </div>

        <h2>How a purchase works</h2>
        <ol>
          <li>Your agent calls <code>license_work</code> and gets a payment link for that work.</li>
          <li>
            It hands the link to PayBox. Stockroom asks for the price in USDC, with the creator&apos;s wallet as the
            recipient.
          </li>
          <li>PayBox shows you the payment and asks for your passkey. Nothing moves without it.</li>
          <li>Stockroom settles the transfer and returns the full-resolution file and a licence receipt tied to the transaction.</li>
          <li>Sending the same signed payment again returns the same licence. You&apos;re never charged twice.</li>
        </ol>

        <h2>Try it</h2>
        <div className="quote">Find a warm, wide photo of a coffee shop on Stockroom and license it for my landing page.</div>

        <h2>The licence</h2>
        <p>{TERMS_SUMMARY}</p>

        <h2>Without PayBox</h2>
        <p>
          Any x402 client can pay <code>{base}/api/license/&lt;work id&gt;</code> directly. The catalogue is at{" "}
          <code>{base}/api/works</code>, and <code>{base}/llms.txt</code> describes the service for agents.
        </p>
      </div>
    </div>
  );
}
