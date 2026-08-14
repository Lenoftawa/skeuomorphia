/**
 * End-to-end FDC compliance-gated mint flow on Coston2.
 *
 * 1. Prepare a Web2Json attestation request for the compliance endpoint
 * 2. Submit it to FdcHub (pay fee)
 * 3. Wait for the voting round to finalize
 * 4. Retrieve the proof from the DA layer
 * 5. Call mintNoteAttested on BearerNoteEscrow with the proof
 *
 * Run: npx hardhat run scripts/fdc-mint-flow.ts --network coston2
 */
import hre from "hardhat";

const FDC_VERIFIER_URL = "https://fdc-verifiers-testnet.flare.network";
const FDC_VERIFIER_API_KEY = "00000000-0000-0000-0000-000000000000";
const COSTON2_DA_LAYER_URL = "https://ctn2-data-availability.flare.network";
const FLARE_CONTRACT_REGISTRY = "0xaD67FE66660Fb8dFE9d6b1b4240d8650e30F6019";
const COMPLIANCE_URL = "https://cdn.jsdelivr.net/gh/EcosystemNetwork/FlareTerminal@flare-terminal-v2/compliance.json";

const COMPLIANCE_JQ_FILTER = "{subject: .address, verdict: .verdict, timestamp: .timestamp}";
const COMPLIANCE_ABI_SIGNATURE =
  '{"components":[{"internalType":"address","name":"subject","type":"address"},{"internalType":"uint8","name":"verdict","type":"uint8"},{"internalType":"uint256","name":"timestamp","type":"uint256"}],"name":"verdict","type":"tuple"}';

const WEB2JSON_RESPONSE_PARAM =
  "tuple(tuple(bytes32 attestationType,bytes32 sourceId,bytes32 messageIntegrityCode,tuple(string url,string httpMethod,string headers,string queryParams,string body,string postProcessJq,string abiSignature) requestBody) request,tuple(bytes abiEncodedData) responseBody)";

function toUtf8HexString(data: string): string {
  let result = "";
  for (let i = 0; i < data.length; i++) {
    result += data.charCodeAt(i).toString(16);
  }
  return "0x" + result.padEnd(64, "0");
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const ethers = hre.ethers;
  const [deployer] = await ethers.getSigners();
  const provider = ethers.provider;
  console.log("=== FDC Compliance-Gated Mint Flow ===");
  console.log("Issuer:", deployer.address);

  const escrowAddr = "0x01f7f551DA833b52271C6f21A81e81Edfa54C43A";
  const stableCoinAddr = process.env.NEXT_PUBLIC_STABLECOIN_ADDRESS!;

  // --- Step 1: Prepare the attestation request ---
  console.log("\n--- Step 1: Prepare attestation request ---");
  const complianceUrl = COMPLIANCE_URL;
  console.log("Compliance URL:", complianceUrl);

  const attestationType = toUtf8HexString("Web2Json");
  const sourceId = toUtf8HexString("PublicWeb2");
  const requestBody = {
    url: complianceUrl,
    httpMethod: "GET",
    headers: "{}",
    queryParams: "{}",
    body: "{}",
    postProcessJq: COMPLIANCE_JQ_FILTER,
    abiSignature: COMPLIANCE_ABI_SIGNATURE,
  };
  const verifierUrl = `${FDC_VERIFIER_URL}/verifier/web2/Web2Json/prepareRequest`;
  console.log("Calling verifier...");
  const vRes = await fetch(verifierUrl, {
    method: "POST",
    headers: { "X-API-KEY": FDC_VERIFIER_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ attestationType, sourceId, requestBody }),
  });
  if (!vRes.ok) throw new Error(`Verifier failed: ${vRes.status} ${await vRes.text()}`);
  const vData = await vRes.json() as { status: string; abiEncodedRequest: string };
  if (vData.status !== "VALID") throw new Error(`Verifier rejected: ${JSON.stringify(vData)}`);
  console.log("Verifier status: VALID");
  const abiEncodedRequest = vData.abiEncodedRequest;

  // --- Step 2: Submit to FdcHub ---
  console.log("\n--- Step 2: Submit attestation to FdcHub ---");
  const registry = new ethers.Contract(FLARE_CONTRACT_REGISTRY, [
    "function getContractAddressByName(string) view returns (address)",
  ], provider);
  const fdcHubAddr = await registry.getContractAddressByName("FdcHub");
  const feeCfgAddr = await registry.getContractAddressByName("FdcRequestFeeConfigurations");
  const fdcHub = new ethers.Contract(fdcHubAddr, ["function requestAttestation(bytes) payable returns (uint256)"], deployer);
  const feeCfg = new ethers.Contract(feeCfgAddr, ["function getRequestFee(bytes) view returns (uint256)"], provider);
  const fee = await feeCfg.getRequestFee(abiEncodedRequest);
  console.log("FDC fee:", ethers.formatEther(fee), "C2FLR");

  const submitTx = await fdcHub.requestAttestation(abiEncodedRequest, { value: fee });
  const submitReceipt = await submitTx.wait();
  console.log("Submitted! tx:", submitTx.hash);

  // --- Step 3: Calculate round ID ---
  console.log("\n--- Step 3: Calculate voting round ID ---");
  const block = await provider.getBlock(submitReceipt!.blockNumber);
  const fsmAddr = await registry.getContractAddressByName("FlareSystemsManager");
  const fsm = new ethers.Contract(fsmAddr, [
    "function firstVotingRoundStartTs() view returns (uint256)",
    "function votingEpochDurationSeconds() view returns (uint256)",
  ], provider);
  const firstTs = BigInt(await fsm.firstVotingRoundStartTs());
  const duration = BigInt(await fsm.votingEpochDurationSeconds());
  const roundId = Number((BigInt(block!.timestamp) - firstTs) / duration);
  console.log("Voting round ID:", roundId);
  console.log("Track at: https://coston2-systems-explorer.flare.network/voting-round/" + roundId + "?tab=fdc");

  // --- Step 4: Wait for finalization + retrieve proof ---
  console.log("\n--- Step 4: Wait for round finalization ---");
  const relayAddr = await registry.getContractAddressByName("Relay");
  const fdcVerAddr = await registry.getContractAddressByName("FdcVerification");
  const relay = new ethers.Contract(relayAddr, ["function isFinalized(uint256,uint256) view returns (bool)"], provider);
  const fdcVer = new ethers.Contract(fdcVerAddr, ["function fdcProtocolId() view returns (uint256)"], provider);
  const protocolId = BigInt(await fdcVer.fdcProtocolId());

  console.log("Polling Relay for finalization (every 30s)...");
  for (;;) {
    if (await relay.isFinalized(protocolId, roundId)) {
      console.log("Round finalized!");
      break;
    }
    process.stdout.write(".");
    await sleep(30000);
  }
  console.log("");
  await sleep(10000);

  // Poll DA layer for proof
  console.log("Polling DA layer for proof...");
  const daUrl = `${COSTON2_DA_LAYER_URL}/api/v1/fdc/proof-by-request-round-raw`;
  const daBody = { votingRoundId: roundId, requestBytes: abiEncodedRequest };
  let proof: { response_hex: string; proof: string[] } | undefined;
  for (;;) {
    const res = await fetch(daUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(daBody),
    });
    const json = await res.json() as any;
    if (json.response_hex !== undefined && json.proof !== undefined) {
      proof = json;
      console.log("Proof retrieved!");
      break;
    }
    process.stdout.write(".");
    await sleep(10000);
  }
  console.log("");

  // --- Step 5: Decode proof + call mintNoteAttested ---
  console.log("\n--- Step 5: Decode proof + mint attested note ---");
  const coder = new ethers.AbiCoder();

  // The response_hex is the ABI-encoded IWeb2Json.Response struct (flattened):
  //   bytes32 attestationType, bytes32 sourceId, uint64 votingRound,
  //   uint64 lowestUsedTimestamp, RequestBody requestBody, ResponseBody responseBody
  const responseHex = proof!.response_hex;
  const merkleProof = proof!.proof;
  const hex = responseHex.slice(2);

  const readWord = (offset: number): string => "0x" + hex.slice(offset * 64, (offset + 1) * 64);
  const readString = (baseOffset: number, stringIdx: number): string => {
    const relOffset = parseInt(readWord(baseOffset + stringIdx), 16);
    const absOffset = baseOffset + stringIdx + (relOffset / 32);
    const len = parseInt(readWord(absOffset), 16);
    const strHex = hex.slice((absOffset + 1) * 64, (absOffset + 1) * 64 + len * 2);
    return Buffer.from(strHex, "hex").toString();
  };

  // Word 0 = 0x20 (outer offset). Response data starts at word 1.
  const respBase = 1;
  const respAttestationType = readWord(respBase + 0);
  const respSourceId = readWord(respBase + 1);
  const respVotingRound = BigInt(readWord(respBase + 2));
  const respLowestUsedTimestamp = BigInt(readWord(respBase + 3));
  // Word 5 = offset to RequestBody (relative to respBase)
  const requestBodyOffset = parseInt(readWord(respBase + 4), 16) / 32;
  const requestBodyBase = respBase + requestBodyOffset;
  // Word 6 = offset to ResponseBody (relative to respBase)
  const responseBodyOffset = parseInt(readWord(respBase + 5), 16) / 32;
  const responseBodyBase = respBase + responseBodyOffset;

  const url = readString(requestBodyBase, 0);
  const httpMethod = readString(requestBodyBase, 1);
  const headers = readString(requestBodyBase, 2);
  const queryParams = readString(requestBodyBase, 3);
  const body = readString(requestBodyBase, 4);
  const postProcessJq = readString(requestBodyBase, 5);
  const abiSignature = readString(requestBodyBase, 6);

  console.log("Proof URL:", url);
  console.log("Voting round:", respVotingRound.toString());

  // ResponseBody = tuple(bytes abiEncodedData)
  // At responseBodyBase: [offset_to_data, length, data...]
  // Actually for a single dynamic field: [offset, length, data]
  // But the offset is relative to responseBodyBase
  const respBodyDataOffset = parseInt(readWord(responseBodyBase), 16) / 32;
  const abiEncodedDataLen = parseInt(readWord(responseBodyBase + respBodyDataOffset), 16);
  const abiEncodedDataStart = (responseBodyBase + respBodyDataOffset + 1) * 64;
  const abiEncodedData = "0x" + hex.slice(abiEncodedDataStart, abiEncodedDataStart + abiEncodedDataLen * 2);
  console.log("abiEncodedData length:", abiEncodedDataLen, "bytes");

  // Decode the verdict from abiEncodedData
  const [verdict] = coder.decode(
    ["tuple(address subject, uint8 verdict, uint256 timestamp)"],
    abiEncodedData
  ) as any[];
  console.log("Attested verdict:", {
    subject: verdict[0],
    verdict: verdict[1],
    timestamp: verdict[2].toString(),
  });

  // Construct the calldata manually, embedding the raw response_hex bytes
  // so the on-chain verifier sees the exact same encoding the FDC used.
  //
  // Function: mintNoteAttested(Proof, address, uint256, bytes32, uint64)
  // Proof = (bytes32[] merkleProof, Response data) — both dynamic
  // Response data = response_hex WITHOUT the leading 0x20 offset word

  // 1. Encode merkleProof as bytes32[]
  const merkleProofEncoded = coder.encode(["bytes32[]"], [merkleProof]);

  // 2. Response data = response_hex without the leading 0x20 word
  const responseDataBytes = "0x" + hex.slice(64); // skip word 0 (0x20 offset)

  // 3. Construct Proof struct encoding:
  //    [offset_to_merkleProof, offset_to_Response, merkleProof_data, Response_data]
  const proofOffsetMerkle = 0x40; // 2 words
  const proofOffsetResponse = proofOffsetMerkle + (merkleProofEncoded.length - 2) / 2; // bytes, minus 0x
  const proofEncoded = ethers.concat([
    ethers.zeroPadValue(proofOffsetMerkle, 32),
    ethers.zeroPadValue(proofOffsetResponse, 32),
    merkleProofEncoded,
    responseDataBytes,
  ]);

  // 4. Function selector
  const funcSig = "mintNoteAttested(((bytes32[],(bytes32,bytes32,uint64,uint64,(string,string,string,string,string,string,string),(bytes)))),address,uint256,bytes32,uint64)";
  const selector = ethers.id(funcSig).slice(0, 10);

  // 5. Full calldata: [selector, offset_to_proof, asset, faceValue, secretHash, expiresAt, proof_data]
  const faceValue = ethers.parseUnits("10", 6);
  const secret = ethers.randomBytes(32);
  const secretHash = ethers.keccak256(ethers.solidityPacked(["bytes32"], [ethers.hexlify(secret)]));
  console.log("Secret hash:", secretHash);

  const calldata = ethers.concat([
    selector,
    ethers.zeroPadValue(0xa0, 32), // offset to proof = 5 * 32 = 160
    ethers.zeroPadValue(stableCoinAddr, 32),
    ethers.zeroPadValue(faceValue, 32),
    secretHash,
    ethers.zeroPadValue(0, 32), // expiresAt = 0
    proofEncoded,
  ]);

  // Use the TypeChain-generated contract for read-only calls
  const BearerNoteEscrowFactory = await hre.ethers.getContractFactory("BearerNoteEscrow");
  const escrow = BearerNoteEscrowFactory.attach(escrowAddr) as any;

  // First approve the escrow to spend FLRD
  const stableCoin = new ethers.Contract(stableCoinAddr, [
    "function approve(address,uint256) returns (bool)",
    "function balanceOf(address) view returns (uint256)",
  ], deployer);
  console.log("Approving FLRD...");
  await (await stableCoin.approve(escrowAddr, faceValue)).wait();

  console.log("Calling mintNoteAttested (raw calldata)...");
  const mintTx = await deployer.sendTransaction({ to: escrowAddr, data: calldata });
  const mintReceipt = await mintTx.wait();
  console.log("MINTED! tx:", mintTx.hash);

  // Verify
  const count = await escrow.fdcAttestedMintCount();
  console.log("fdcAttestedMintCount:", count.toString());

  // Get the note ID from the event
  const iface = new ethers.Interface([
    "event NoteMinted(uint256 indexed noteId, address indexed asset, address indexed issuer, uint256 faceValue, uint64 expiresAt, bool fdcAttested)",
  ]);
  for (const log of mintReceipt!.logs) {
    try {
      const parsed = iface.parseLog(log);
      if (parsed) {
        console.log("NoteMinted event:", {
          noteId: parsed.args.noteId.toString(),
          fdcAttested: parsed.args.fdcAttested,
        });
      }
    } catch {}
  }

  console.log("\n=== FDC MINT FLOW COMPLETE ===");
  console.log("Submit tx:", submitTx.hash);
  console.log("Mint tx:", mintTx.hash);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
