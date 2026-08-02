"use client";

import { useEffect } from "react";

export function ReferralCapture() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const referralCode = params.get("ref") || params.get("affiliate") || params.get("via");

    if (referralCode) {
      window.localStorage.setItem("powernow_referral", referralCode.slice(0, 80));
      window.localStorage.setItem("powernow_referral_captured_at", new Date().toISOString());
    }
  }, []);

  return null;
}
