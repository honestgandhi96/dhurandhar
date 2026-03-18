import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const body = await request.json();
    const { referral_code } = body;

    if (!referral_code || typeof referral_code !== "string") {
      return NextResponse.json(
        { error: "Missing referral_code" },
        { status: 400 }
      );
    }

    const { data: agent } = await supabase
      .from("agents")
      .select("recruits_count")
      .eq("referral_code", referral_code)
      .single();

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    await supabase
      .from("agents")
      .update({ recruits_count: (agent.recruits_count || 0) + 1 })
      .eq("referral_code", referral_code);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
