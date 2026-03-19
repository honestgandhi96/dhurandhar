"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const WHATSAPP_ICON = (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

function DebriefContent() {
  const searchParams = useSearchParams();
  const name = searchParams.get("name") || "AGENT";
  const code = searchParams.get("code") || "";
  const gameScore = searchParams.get("score");
  const [recruitsCount, setRecruitsCount] = useState(0);
  const [friendNames, setFriendNames] = useState(["", "", ""]);
  const [revealedText, setRevealedText] = useState("");
  const [copied, setCopied] = useState<number | null>(null);

  const decodedMessage = "MEET AT THE PORT";

  // Typewriter reveal of decoded message
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < decodedMessage.length) {
        setRevealedText(decodedMessage.substring(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 80);
    return () => clearInterval(interval);
  }, []);

  // Poll for recruits count every 30 seconds
  useEffect(() => {
    if (!code) return;

    const fetchCount = async () => {
      try {
        const res = await fetch(`/api/leaderboard`);
        const data = await res.json();
        const me = data.agents?.find(
          (a: { referral_code: string }) => a.referral_code === code
        );
        if (me) setRecruitsCount(me.recruits_count || 0);
      } catch {
        // Non-critical
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [code]);

  const getDomain = () =>
    typeof window !== "undefined" ? window.location.origin : "";

  const getShareLink = (friendName: string) => {
    const fn = friendName.trim() || "AGENT";
    return `${getDomain()}/?from=${encodeURIComponent(name)}&agent=${encodeURIComponent(fn)}`;
  };

  const getWhatsAppMessage = (friendName: string, link: string) => {
    const fn = friendName.trim().toUpperCase() || "AGENT";
    return encodeURIComponent(
      `🕵️ AGENT ${fn} — your cover is blown.\nIB needs you NOW. Decrypt this transmission before midnight or Hamza's mission fails.\n${link}\n#Dhurandhar2 #OperationDhurandhar`
    );
  };

  const handleCopy = (index: number) => {
    const link = getShareLink(friendNames[index]);
    navigator.clipboard.writeText(link);
    setCopied(index);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <main className="min-h-dvh bg-terminal-bg px-4 py-8">
      <div className="max-w-lg mx-auto space-y-8">
        {/* Top section — terminal style */}
        <div className="space-y-4 text-center">
          <p className="text-terminal-green text-xl font-heading font-bold">
            OPERATION COMPLETE, AGENT {name}.
          </p>
          {gameScore && (
            <div className="space-y-1">
              <p className="text-terminal-amber text-4xl font-mono font-bold">
                {gameScore}
              </p>
              <p className="text-terminal-dim text-xs">MISSION SCORE</p>
            </div>
          )}
          <p className="text-terminal-green text-2xl font-mono tracking-[0.2em]">
            {revealedText}
            {revealedText.length < decodedMessage.length && (
              <span className="typewriter-cursor" />
            )}
          </p>
          <p className="text-terminal-dim text-sm">
            Director Sanyal confirms: Hamza&apos;s location is secured.
          </p>
        </div>

        {/* Middle section — viral mechanic */}
        <div className="border border-terminal-border p-6 space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-terminal-amber text-xl font-heading font-bold">
              NOW RECRUIT 3 AGENTS BEFORE MIDNIGHT
            </h2>
            <p className="text-terminal-dim text-sm">
              The operation depends on it.
            </p>
          </div>

          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-2">
              <input
                type="text"
                placeholder={`Agent ${i + 1} name (optional)`}
                maxLength={20}
                value={friendNames[i]}
                onChange={(e) => {
                  const updated = [...friendNames];
                  updated[i] = e.target.value;
                  setFriendNames(updated);
                }}
                className="w-full bg-transparent border border-terminal-border text-terminal-green
                           px-3 py-2 font-mono text-sm placeholder:text-terminal-dim/50
                           focus:outline-none focus:border-terminal-green"
              />
              <div className="flex gap-2">
                <a
                  href={`https://wa.me/?text=${getWhatsAppMessage(
                    friendNames[i],
                    getShareLink(friendNames[i])
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-whatsapp flex-1 justify-center text-sm"
                >
                  {WHATSAPP_ICON}
                  SEND VIA WHATSAPP
                </a>
                <button
                  onClick={() => handleCopy(i)}
                  className="btn-secondary text-sm px-3"
                >
                  {copied === i ? "COPIED!" : "COPY"}
                </button>
              </div>
            </div>
          ))}

          <div className="text-center">
            <p className="text-terminal-green font-mono text-lg">
              AGENTS RECRUITED:{" "}
              <span className="text-terminal-amber font-bold">
                {recruitsCount}
              </span>
            </p>
          </div>
        </div>

        {/* Bottom section */}
        <div className="text-center space-y-4">
          <Link
            href="/leaderboard"
            className="text-terminal-dim hover:text-terminal-green text-sm underline"
          >
            View Leaderboard →
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function DebriefPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-dvh flex items-center justify-center bg-terminal-bg">
          <p className="text-terminal-green">Loading debrief...</p>
        </main>
      }
    >
      <DebriefContent />
    </Suspense>
  );
}
