import { NextRequest, NextResponse } from "next/server";

const DA_BASE_URL = "https://ctn2-data-availability.flare.network/api/v0";

// Proxy for Flare Data Availability API to avoid CORS restrictions.
// Browser-side fetches to the DA API are blocked because it doesn't
// set Access-Control-Allow-Origin headers.

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path");

  if (!path) {
    return NextResponse.json({ error: "Missing 'path' parameter" }, { status: 400 });
  }

  // Only allow paths under the DA API to prevent SSRF.
  const allowedPrefixes = ["/fsp/status", "/ftso/"];
  if (!allowedPrefixes.some((prefix) => path.startsWith(prefix))) {
    return NextResponse.json({ error: "Path not allowed" }, { status: 403 });
  }

  try {
    const url = `${DA_BASE_URL}${path}`;
    const response = await fetch(url, {
      headers: { "Content-Type": "application/json" },
    });
    const data = await response.text();
    return new NextResponse(data, {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Proxy request failed" },
      { status: 502 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path");

  if (!path) {
    return NextResponse.json({ error: "Missing 'path' parameter" }, { status: 400 });
  }

  const allowedPrefixes = ["/ftso/"];
  if (!allowedPrefixes.some((prefix) => path.startsWith(prefix))) {
    return NextResponse.json({ error: "Path not allowed" }, { status: 403 });
  }

  try {
    const body = await request.text();
    const url = `${DA_BASE_URL}${path}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    const data = await response.text();
    return new NextResponse(data, {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Proxy request failed" },
      { status: 502 }
    );
  }
}
