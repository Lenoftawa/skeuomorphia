import { NextRequest, NextResponse } from "next/server";

/**
 * Compliance source-of-record endpoint.
 *
 * This is the Web2 URL that the Flare Data Connector (FDC) data providers fetch
 * and attest via a Web2Json attestation. The BearerNoteEscrow contract pins the
 * URL prefix to this endpoint and only accepts FDC proofs whose request URL
 * starts with it, so a malicious source cannot forge a verdict.
 *
 * Verdicts:
 *   1 = CLEAR   (minting allowed)
 *   2 = REVIEW  (fail-closed hold — not accepted on-chain)
 *   3 = BLOCKED (sanctioned / denied)
 *
 * Bounty 1: screening runs here on the server (basic blocklist + zero-address
 *           + checksum rules). Deterministic JSON so FDC consensus is reached.
 * Bounty 2: the same verdict is computed inside a Flare Confidential Compute
 *           (FCC) TEE extension; the URL prefix is then pointed at the enclave's
 *           attested endpoint instead of this route.
 *
 * Response shape is consumed by the FDC jq filter:
 *   {subject: .address, verdict: .verdict, timestamp: .timestamp}
 * matching abiSignature tuple (address subject, uint8 verdict, uint256 timestamp).
 */

export const dynamic = "force-dynamic";
export const revalidate = 0;

// A small, public, static deny-list for demonstration. In production this is
// fed by OFAC SDN / FBI Lazarus / NBCTF feeds inside the TEE (Bounty 2).
const BLOCKLIST = new Set<string>([
  "0x0000000000000000000000000000000000000d3a", // demo sanctioned address
  "0x000000000000000000000000000000000000dead",
]);

const REVIEW_PATTERNS = [/^0x0{6,}/i]; // suspicious low-entropy prefixes

function isChecksumValid(addr: string): boolean {
  // Accept any valid 0x + 40 hex (Flare/EVM). ethers would do EIP-55 but the
  // FDC providers re-fetch the URL, so we only need a structural check here.
  return /^0x[a-fA-F0-9]{40}$/.test(addr);
}

export async function GET(req: NextRequest) {
  const address = (req.nextUrl.searchParams.get("address") || "").trim();

  if (!address || !isChecksumValid(address)) {
    return NextResponse.json(
      { address: address || "0x0000000000000000000000000000000000000000", verdict: 3, timestamp: 0, reason: "invalid address" },
      { status: 200 }
    );
  }

  const lower = address.toLowerCase();
  let verdict = 1;

  if (BLOCKLIST.has(lower)) {
    verdict = 3;
  } else if (REVIEW_PATTERNS.some((re) => re.test(address))) {
    verdict = 2;
  }

  const body = {
    address,
    verdict,
    timestamp: Math.floor(Date.now() / 1000),
  };

  // Cache-bust: FDC providers must always see fresh verdicts.
  return NextResponse.json(body, {
    status: 200,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "Content-Type": "application/json",
    },
  });
}
