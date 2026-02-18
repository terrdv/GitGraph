"use client";

import { useEffect, useState } from "react";

type ExchangeResponse = {
  access_token?: string;
  token_type?: string;
  scope?: string;
  detail?: string;
  error?: string;
};

export default function OAuthCallbackPage() {
  const [status, setStatus] = useState("Processing callback...");
  const [exchange, setExchange] = useState<ExchangeResponse | null>(null);
  const [reposCount, setReposCount] = useState<number | null>(null);

  useEffect(() => {
    async function run() {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      const savedState = sessionStorage.getItem("github_oauth_state");

      if (!code) {
        setStatus("Missing code in callback URL.");
        return;
      }

      if (savedState && state !== savedState) {
        setStatus("State mismatch. OAuth callback was rejected.");
        return;
      }

      setStatus("Exchanging GitHub code...");

      const exchangeRes = await fetch("/api/auth/github/exchange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const exchangeData = (await exchangeRes.json()) as ExchangeResponse;
      setExchange(exchangeData);

      if (!exchangeRes.ok || !exchangeData.access_token) {
        setStatus("Code exchange failed.");
        return;
      }

      setStatus("Token received. Testing /api/repo...");

      const reposRes = await fetch("/api/repo", {
        headers: {
          Authorization: `Bearer ${exchangeData.access_token}`,
        },
      });
      const reposData = await reposRes.json();

      if (!reposRes.ok || !Array.isArray(reposData)) {
        setStatus("Token exchange worked, but repo fetch failed.");
        return;
      }

      setReposCount(reposData.length);
      setStatus("OAuth test succeeded.");
    }

    run().catch((error) => {
      console.error(error);
      setStatus("Unexpected error while processing OAuth callback.");
    });
  }, []);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-start justify-center gap-4 px-6 py-10">
      <h1 className="text-3xl font-semibold">GitHub OAuth Callback</h1>
      <p className="text-sm text-zinc-600">{status}</p>

      {exchange && (
        <pre className="w-full overflow-auto rounded-md bg-zinc-950 p-4 text-xs text-zinc-100">
          {JSON.stringify(
            {
              token_type: exchange.token_type,
              scope: exchange.scope,
              access_token_preview: exchange.access_token
                ? `${exchange.access_token.slice(0, 8)}...`
                : undefined,
              detail: exchange.detail,
              error: exchange.error,
            },
            null,
            2,
          )}
        </pre>
      )}

      {reposCount !== null && (
        <p className="text-sm text-green-700">Repository fetch successful. Found {reposCount} repositories.</p>
      )}
    </main>
  );
}
