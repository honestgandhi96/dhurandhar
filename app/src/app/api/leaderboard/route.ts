import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("agents")
      .select("agent_name, referral_code, recruits_count")
      .order("recruits_count", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Leaderboard error:", error);
      return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
    }

    return NextResponse.json({ agents: data || [] });
  } catch {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}
