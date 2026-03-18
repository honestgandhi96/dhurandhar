import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const body = await request.json();
    const { agent_name, recruited_by } = body;

    if (!agent_name || typeof agent_name !== "string") {
      return NextResponse.json(
        { error: "Missing agent_name" },
        { status: 400 }
      );
    }

    const sanitizedName = agent_name.trim().substring(0, 20).toUpperCase();
    const referral_code = generateReferralCode();

    const { data, error } = await supabase
      .from("agents")
      .insert({
        agent_name: sanitizedName,
        referral_code,
        recruited_by: recruited_by || null,
      })
      .select("referral_code, agent_name")
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to create agent" },
        { status: 500 }
      );
    }

    // Increment recruiter's count if recruited_by is provided
    if (recruited_by) {
      const { data: recruiter } = await supabase
        .from("agents")
        .select("recruits_count")
        .eq("referral_code", recruited_by)
        .single();

      if (recruiter) {
        await supabase
          .from("agents")
          .update({ recruits_count: (recruiter.recruits_count || 0) + 1 })
          .eq("referral_code", recruited_by);
      }
    }

    return NextResponse.json({
      referral_code: data.referral_code,
      agent_name: data.agent_name,
    });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
