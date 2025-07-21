"use client";

import { Dashboard } from "@/components/dashboard";
import { Toaster } from "@/components/ui/toaster";

export default function Home() {
  return (
    <>
      <Dashboard />
      <Toaster />
    </>
  );
}
