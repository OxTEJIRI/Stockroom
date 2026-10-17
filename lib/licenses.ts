import { randomBytes } from "crypto";
import { getJson, putJson } from "./storage";
import { EXPLORER_TX, NETWORK, siteUrl } from "./config";
import { TERMS_SUMMARY, TERMS_VERSION } from "./terms";
import { newId, type Work } from "./works";

export type License = {
  id: string;
  workId: string;
  workTitle: string;
  creatorName: string;
  payer: string;
  payTo: string;
  amountUsd: number;
  network: string;
  txHash: string;
  nonce: string;
  project: string;
  termsVersion: string;
  downloadToken: string;
  createdAt: string;
};

export async function getLicense(id: string): Promise<License | null> {
  if (!/^[A-Za-z0-9]{4,40}$/.test(id)) return null;
  return getJson<License>(`licenses/${id}.json`);
}

export async function findLicenseByNonce(nonce: string): Promise<License | null> {
  if (!/^0x[0-9a-fA-F]{1,64}$/.test(nonce)) return null;
  const ref = await getJson<{ id: string }>(`nonces/${nonce.toLowerCase()}.json`);
  return ref ? getLicense(ref.id) : null;
}

export async function createLicense(args: {
  work: Work;
  payer: string;
  txHash: string;
  nonce: string;
  project: string;
}): Promise<License> {
  const license: License = {
    id: `L${newId(8)}`,
    workId: args.work.id,
    workTitle: args.work.title,
    creatorName: args.work.creatorName,
    payer: args.payer,
    payTo: args.work.payTo,
    amountUsd: args.work.priceUsd,
    network: NETWORK,
    txHash: args.txHash,
    nonce: args.nonce.toLowerCase(),
    project: args.project.slice(0, 200),
    termsVersion: TERMS_VERSION,
    downloadToken: randomBytes(18).toString("base64url"),
    createdAt: new Date().toISOString(),
  };
  await putJson(`licenses/${license.id}.json`, license);
  if (license.nonce) await putJson(`nonces/${license.nonce}.json`, { id: license.id });
  return license;
}

/** What the buyer (agent) gets back after paying. Includes the private download link. */
export function licenseDelivery(l: License) {
  const base = siteUrl();
  return {
    status: "licensed",
    license_id: l.id,
    work_id: l.workId,
    title: l.workTitle,
    creator: l.creatorName,
    amount_usd: l.amountUsd,
    paid_to: l.payTo,
    payer: l.payer,
    transaction: l.txHash,
    transaction_url: l.txHash ? `${EXPLORER_TX}${l.txHash}` : null,
    download_url: `${base}/api/download/${l.id}?t=${l.downloadToken}`,
    receipt_url: `${base}/l/${l.id}`,
    terms: TERMS_SUMMARY,
    terms_version: l.termsVersion,
    project: l.project,
  };
}

/** Public view, safe to show anyone (no download token). */
export function licensePublic(l: License) {
  const { downloadToken: _t, nonce: _n, ...rest } = l;
  return {
    ...rest,
    valid: true,
    transaction_url: l.txHash ? `${EXPLORER_TX}${l.txHash}` : null,
    receipt_url: `${siteUrl()}/l/${l.id}`,
    terms: TERMS_SUMMARY,
  };
}
