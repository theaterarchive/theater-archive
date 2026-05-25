"use client";

import Link from "next/link";

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 w-full h-16 bg-white border-t border-zinc-300 flex items-center justify-around z-50">

      <Link
        href="/"
        className="text-sm font-medium text-zinc-700"
      >
        홈
      </Link>

      <Link
        href="/settings"
        className="text-sm font-medium text-zinc-700"
      >
        설정
      </Link>

    </nav>
  );
}