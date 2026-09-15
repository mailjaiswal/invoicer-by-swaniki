"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/providers";
import { SplashScreen } from "@/components/splash/splash-screen";
import { SetupCard } from "@/components/splash/setup-card";

export default function GatePage() {
  const { business, hydrated } = useApp();
  const router = useRouter();
  const [leavingSplash, setLeavingSplash] = useState(false);

  const hasBusiness = Boolean(business?.name);

  useEffect(() => {
    if (hydrated && hasBusiness) {
      const t = setTimeout(() => router.replace("/home"), 900);
      return () => clearTimeout(t);
    }
  }, [hydrated, hasBusiness, router]);

  if (!hydrated) {
    return <SplashScreen redirecting />;
  }

  if (hasBusiness) {
    return <SplashScreen redirecting />;
  }

  if (!leavingSplash) {
    return <SplashScreen onDone={() => setLeavingSplash(true)} />;
  }

  return <SetupCard />;
}