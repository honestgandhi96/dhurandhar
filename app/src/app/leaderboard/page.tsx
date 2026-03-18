"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Agent {
  agent_name: string;
  referral_code: string;
  recruits_count: number;
}

function getRankTitle(count: number): string {
  if (count >= 50) return "SHADOW DIRECTOR";
  if (count >= 25) return "MASTER SPY";
  if (count >= 10) return "FIELD OPERATIVE";
  if (count >= 1) return "RECRUIT";
  return "UNACTIVATED";
}

export default function LeaderboardPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [myCode, setMyCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMyCode(sessionStorage.getItem("referral_code"));

    const fetchLeaderboard = async () => {
      try {
        const res = await fetch("/api/leaderboard");
        const data = await res.json();
        setAgents(data.agents || []);
      } catch {
        // Non-critical
      }
    };

    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 30000);
    return () => clearInterval(interval);
  }, []);

  const myAgent = agents.find((a) => a.referral_code === myCode);

  const handleShareRank = () => {
    if (!myAgent) return;
    const title = getRankTitle(myAgent.recruits_count);
    const domain = window.location.origin;
    const text = `🕵️ I've recruited ${myAgent.recruits_count} agents into Operation Dhurandhar.\nRank: ${title}. Can you beat me?\n${domain}/?from=${myAgent.agent_name}\n#Dhurandhar2`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="min-h-dvh bg-terminal-bg px-4 py-8">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-terminal-green text-2xl font-heading font-bold">
            OPERATION DHURANDHAR
          </h1>
          <p className="text-terminal-dim text-sm">TOP FIELD AGENTS</p>
        </div>

        <div className="border border-terminal-border">
          {agents.length === 0 ? (
            <p className="text-terminal-dim text-center py-8 font-mono text-sm">
              No agents recruited yet. Be the first.
            </p>
          ) : (
            agents.map((agent, i) => {
              const isMe = agent.referral_code === myCode;
              const title = getRankTitle(agent.recruits_count);
              return (
                <div
                  key={agent.referral_code}
                  className={`flex items-center justify-between px-4 py-3 border-b border-terminal-border last:border-b-0 font-mono text-sm ${
                    isMe
                      ? "bg-terminal-green/10 text-terminal-green"
                      : "text-terminal-dim"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-terminal-amber w-6">
                      #{i + 1}
                    </span>
                    <span
                      className={
                        isMe ? "text-terminal-green font-bold" : ""
                      }
                    >
                      {agent.agent_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <span>
                      {agent.recruits_count} recruited
                    </span>
                    <span className="text-terminal-amber text-xs">
                      [{title}]
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {myAgent && (
          <div className="text-center">
            <button
              onClick={handleShareRank}
              className="btn-primary"
            >
              {copied ? "COPIED!" : "SHARE YOUR RANK"}
            </button>
          </div>
        )}

        <div className="text-center space-y-2">
          <Link
            href="/mission"
            className="text-terminal-dim hover:text-terminal-green text-sm underline block"
          >
            ← Back to Mission
          </Link>
          <Link
            href="/game"
            className="text-terminal-dim hover:text-terminal-green text-sm underline block"
          >
            Play the full cipher game →
          </Link>
        </div>
      </div>
    </main>
  );
}
