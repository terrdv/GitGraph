"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type ExchangeResponse = {
  access_token?: string;
  token_type?: string;
  scope?: string;
  detail?: string;
  error?: string;
};

export default function OAuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Processing callback...");
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

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

      if (!exchangeRes.ok || !exchangeData.access_token) {
        setStatus("Code exchange failed.");
        setErrorDetail(exchangeData?.detail || exchangeData?.error || null);
        return;
      }

      setStatus("Sign-in successful. Redirecting...");
      router.replace("/");
    }

    run().catch((error) => {
      console.error(error);
      setStatus("Unexpected error while processing OAuth callback.");
      setErrorDetail("Unexpected error while processing OAuth callback.");
    });
  }, [router]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-start justify-center gap-4 px-6 py-10">
      <h1 className="text-3xl font-semibold">GitHub OAuth Callback</h1>
      <p className="text-sm text-zinc-600">{status}</p>
      {errorDetail && <p className="text-sm text-red-600">{errorDetail}</p>}
    </main>
  );
}
