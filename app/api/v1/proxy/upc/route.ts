import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    // Basic auth check
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const upc = searchParams.get("upc")?.trim();

    if (!upc) {
      return NextResponse.json({ error: "UPC is required" }, { status: 400 });
    }

    // Call the external UPC API from the Node.js server to bypass browser CORS
    const res = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${encodeURIComponent(upc)}`, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "MobileShopApp/1.0"
      },
      next: { revalidate: 3600 } // Cache results for 1 hour to save API limits
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch from UPC API" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("UPC proxy error:", error);
    return NextResponse.json({ error: "Failed to proxy request" }, { status: 500 });
  }
}
