import { NextRequest, NextResponse } from "next/server";

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

export async function POST(req: NextRequest) {
  /* ── Parse body ── */
  let rawUrl: string;
  try {
    const body = await req.json();
    rawUrl = (body.url ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!rawUrl) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  /* ── Normalize URL ── */
  const url = rawUrl.startsWith("http://") || rawUrl.startsWith("https://")
    ? rawUrl
    : `https://${rawUrl}`;

  // Validate URL shape
  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
  }

  console.log(`[fetch-site] Fetching: ${url}`);

  /* ── Fetch the website ── */
  let html = "";
  let finalStatus = 0;

  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 14000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": BROWSER_UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache",
      },
      redirect: "follow",
    });

    clearTimeout(tid);
    finalStatus = response.status;
    console.log(`[fetch-site] Status ${finalStatus} for ${url}`);

    // Accept any response that has a body — even 4xx can have useful text
    // Only hard-fail on network errors (caught below)
    html = await response.text();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[fetch-site] Fetch error for ${url}:`, msg);

    if (msg.includes("abort") || msg.includes("timeout") || msg.includes("signal")) {
      return NextResponse.json(
        { error: "Request timed out. The website took too long to respond." },
        { status: 408 }
      );
    }

    // DNS failure, connection refused, etc. → URL doesn't exist
    return NextResponse.json(
      { error: "Could not reach this website. Please check the URL and try again." },
      { status: 422 }
    );
  }

  /* ── Reject if we got nothing useful ── */
  if (!html || html.trim().length < 50) {
    console.warn(`[fetch-site] Empty or too-short response (status ${finalStatus}) for ${url}`);
    return NextResponse.json(
      { error: `Website returned an empty response (status ${finalStatus}). It may be blocking automated access.` },
      { status: 422 }
    );
  }

  /* ── Extract text + metadata ── */
  const extracted = extractFromHtml(html);
  console.log(`[fetch-site] OK — site_name="${extracted.site_name}", text_len=${extracted.text.length}`);

  return NextResponse.json({ ok: true, ...extracted });
}

function extractFromHtml(html: string): { text: string; site_name: string } {
  /* site name: og:site_name → <title> first segment → first <h1> */
  const ogSite =
    html.match(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']{1,120})/i)?.[1] ??
    html.match(/<meta[^>]+content=["']([^"']{1,120})["'][^>]+property=["']og:site_name["']/i)?.[1] ??
    "";

  const rawTitle = html.match(/<title[^>]*>([^<]{1,200})<\/title>/i)?.[1]?.trim() ?? "";
  const titleFirst = rawTitle.split(/[|\-–—]/)[0]?.trim() ?? "";

  const h1 = html.match(/<h1[^>]*>([^<]{1,120})<\/h1>/i)?.[1]?.trim() ?? "";

  const site_name = (ogSite || titleFirst || h1).replace(/\s+/g, " ").trim();

  /* body text: remove scripts/styles/tags, collapse whitespace */
  const stripped = html
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Take up to 4 000 chars — enough for Claude to understand the business
  const text = stripped.slice(0, 4000);

  return { text, site_name };
}
