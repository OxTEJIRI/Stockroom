// Pay a Stockroom licence URL with a raw x402 client (no PayBox). Useful for testing.
//   node scripts/x402-probe.mjs <licence url>                -> signs with a throwaway key (expect "insufficient funds")
//   PRIVATE_KEY=0x... node scripts/x402-probe.mjs <url>      -> real payment from that wallet
import { x402Client } from "@x402/core/client";
import { x402HTTPClient } from "@x402/core/http";
import { ExactEvmScheme, toClientEvmSigner } from "@x402/evm";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

const url = process.argv[2];
if (!url) throw new Error("usage: node scripts/x402-probe.mjs <licence url>");
const account = privateKeyToAccount(process.env.PRIVATE_KEY || generatePrivateKey());
console.log("payer", account.address);

const client = new x402HTTPClient(new x402Client().register("eip155:*", new ExactEvmScheme(toClientEvmSigner(account))));

const first = await fetch(url);
console.log("probe", first.status);
if (first.status !== 402) process.exit(0);
const required = client.getPaymentRequiredResponse((n) => first.headers.get(n), await first.json());
console.log("accepts", JSON.stringify(required.accepts[0]));
const payload = await client.createPaymentPayload(required);
const paid = await fetch(url, { headers: client.encodePaymentSignatureHeader(payload) });
console.log("paid", paid.status);
console.log(JSON.stringify(await paid.json(), null, 2).slice(0, 1500));
