"use client";

import { useEffect } from "react";

type ReferralRecord = {
  code: string;
  expiresAt: number;
};

export function ReferralCapture({
  enabled,
  cookieDays
}: {
  enabled: boolean;
  cookieDays: number;
}) {
  useEffect(() => {
    if (!enabled) return;
    const params = new URLSearchParams(window.location.search);
    const raw =
      params.get("ref") ??
      params.get("affiliate") ??
      params.get("via") ??
      "";
    const code = raw
      .replace(/[^a-zA-Z0-9_.-]/g, "")
      .slice(0, 80);
    if (!code) return;

    const record: ReferralRecord = {
      code,
      expiresAt:
        Date.now() + cookieDays * 24 * 60 * 60 * 1000
    };
    window.localStorage.setItem(
      "powernow_referral",
      JSON.stringify(record)
    );
  }, [enabled, cookieDays]);

  return null;
}
