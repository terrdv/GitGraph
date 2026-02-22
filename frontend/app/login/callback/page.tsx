"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type ExchangeResponse = {
  username?: string;
  detail?: string;
  error?: string;
};

export default function LoginCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Completing GitHub sign-in...");
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  useEffect(() => {
    async function run() {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");

      if (!code) {
        setStatus("Missing code in callback URL.");
        return;
      }

      if (!state) {
        setStatus("State is missing in callback URL.");
        return;
      }

      const exchangeRes = await fetch("/api/auth/github/exchange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, state }),
      });
      const exchangeData = (await exchangeRes.json()) as ExchangeResponse;

      if (!exchangeRes.ok) {
        setStatus("Sign-in failed.");
        setErrorDetail(exchangeData?.detail || exchangeData?.error || null);
        return;
      }

      setStatus("Sign-in successful. Redirecting to dashboard...");
      router.replace("/");
    }

    run().catch((error) => {
      console.error(error);
      setStatus("Unexpected error while processing OAuth callback.");
      setErrorDetail("Unexpected error while processing OAuth callback.");
    });
  }, [router]);

  return (
    <main className="min-h-screen bg-[#0d1117] p-4 text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-2xl items-center">
        <div className="w-full rounded-xl border border-gray-700 bg-[#161b22] p-6 shadow-xl md:p-8">
          <h1 className="text-2xl font-semibold md:text-3xl">Signing You In</h1>
          <p className="mt-4 text-sm text-slate-100/90">{status}</p>
          {errorDetail && (
            <p className="mt-4 rounded-md border border-red-300/50 bg-red-500/10 px-3 py-2 text-sm text-red-100">
              {errorDetail}
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
