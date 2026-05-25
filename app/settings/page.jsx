"use client";

import Link from "next/link";
import BottomNav from "../components/BottomNav";

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-[#f5f1ea] text-black p-6 pb-24">

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">
          설정
        </h1>

        <Link href="/">
          홈으로
        </Link>
      </div>

      <div className="space-y-4">

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="font-semibold mb-2">
            데이터 관리
          </div>

          <div className="text-sm text-zinc-600">
            추후 CSV 불러오기 / 내보내기 기능 예정
          </div>
        </div>

      </div>

      <BottomNav />
    </main>
  );
}