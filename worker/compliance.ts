// Compliance endpoint for FDC Web2Json attestation.
// Deployed on Deno Deploy — stable URL, free, no card.
// Returns: { address, verdict, timestamp }
//   verdict: 1=CLEAR, 2=REVIEW, 3=BLOCKED

const BLOCKLIST = new Set([
  "0x0000000000000000000000000000000000000d3a",
  "0x000000000000000000000000000000000000dead",
]);
const REVIEW_PATTERNS = [/^0x0{6,}/i];

Deno.serve((req: Request) => {
  const url = new URL(req.url);
  const address = (url.searchParams.get("address") || "").trim();
  const isValid = /^0x[a-fA-F0-9]{40}$/.test(address);

  if (!address || !isValid) {
    return new Response(
      JSON.stringify({
        address: address || "0x0000000000000000000000000000000000000000",
        verdict: 3,
        timestamp: 0,
        reason: "invalid address",
      }),
      { headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } }
    );
  }

  const lower = address.toLowerCase();
  let verdict = 1;
  if (BLOCKLIST.has(lower)) verdict = 3;
  else if (REVIEW_PATTERNS.some((re) => re.test(address))) verdict = 2;

  return new Response(
    JSON.stringify({ address, verdict, timestamp: Math.floor(Date.now() / 1000) }),
    {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
});
