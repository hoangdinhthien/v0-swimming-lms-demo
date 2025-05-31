import { NextResponse } from "next/server";
import config from "@/api/config.json";

export async function GET() {
  try {
    // This example shows how any API route can access tenant-specific data
    // The tenant ID will be automatically included in headers by the API utilities

    const response = await fetch(
      `${config.API}/v1/workflow-process/public/news`,
      {
        headers: {
          // Note: In a real implementation, this would get the tenant ID from the request headers
          // and use the API utilities that automatically include the x-tenant-id header
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch news: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching tenant-specific news:", error);
    return NextResponse.json(
      { error: "Failed to fetch news" },
      { status: 500 }
    );
  }
}
