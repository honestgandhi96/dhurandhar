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
    // recruited_by comes as the recruiter's agent_name from the ?from= URL param
    if (recruited_by) {
      const recruiterName = recruited_by.trim().toUpperCase();
      const { data: recruiter } = await supabase
        .from("agents")
        .select("referral_code, recruits_count")
        .eq("agent_name", recruiterName)
        .order("created_at", { ascending: true })
        .limit(1)
        .single();

      if (recruiter) {
        // Update the recruited_by field to store the actual referral_code
        await supabase
          .from("agents")
          .update({ recruited_by: recruiter.referral_code })
          .eq("referral_code", referral_code);

        await supabase
          .from("agents")
          .update({ recruits_count: (recruiter.recruits_count || 0) + 1 })
          .eq("referral_code", recruiter.referral_code);
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
