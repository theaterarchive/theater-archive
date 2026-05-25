"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import Link from "next/link";
import BottomNav from "./components/BottomNav";

export default function Home() {
  const [records, setRecords] = useState([]);

  // 🎬 공연 상태
  const [titleOpen, setTitleOpen] = useState(false);
  const [titleSearch, setTitleSearch] = useState("");
  const [selectedTitle, setSelectedTitle] = useState("all");

  // 🎭 배우 상태
  const [actorOpen, setActorOpen] = useState(false);
  const [actorSearch, setActorSearch] = useState("");
  const [selectedActors, setSelectedActors] = useState([]);
  const [actorMode, setActorMode] = useState("OR");

  const titleRef = useRef(null);
  const actorRef = useRef(null);

  // 💾 로컬 저장 불러오기
  useEffect(() => {
    const saved = localStorage.getItem("records");
    if (saved) {
      setRecords(JSON.parse(saved));
    }
  }, []);

  const saveToLocal = (data) => {
    localStorage.setItem("records", JSON.stringify(data));
    setRecords(data);
  };

  // 📂 CSV 업로드
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      skipEmptyLines: true,

      complete: (results) => {
        const parsed = results.data.slice(1).map((cols) => ({
          id: cols[0],
          title: cols[1],
          dateKey: cols[2],
          time: cols[3],
          theater: cols[4],
          seat: cols[5],

          cast: cols[6]
            ? String(cols[6])
                .replace(/"/g, "")
                .split(",")
                .map((x) => x.trim())
                .filter(Boolean)
            : [],
        }));

        saveToLocal(parsed);
      },
    });
  };

  // 🎭 배우 필터
  const actorFilteredRecords = useMemo(() => {
    if (selectedActors.length === 0) return records;

    return records.filter((r) => {
      if (actorMode === "OR") {
        return r.cast.some((a) => selectedActors.includes(a));
      }

      if (actorMode === "AND") {
        return selectedActors.every((a) =>
          r.cast.includes(a)
        );
      }

      return true;
    });
  }, [records, selectedActors, actorMode]);

  // 🎬 공연 dropdown base
  const titleBase = actorFilteredRecords;

  const searchedTitles = useMemo(() => {
    return Array.from(
      new Set(
        titleBase
          .filter((r) =>
            r.title.includes(titleSearch)
          )
          .map((r) => r.title)
      )
    ).sort((a, b) => a.localeCompare(b));
  }, [titleBase, titleSearch]);

  const actorFilteredTitles = useMemo(() => {
    return Array.from(
      new Set(titleBase.map((r) => r.title))
    ).sort((a, b) => a.localeCompare(b));
  }, [titleBase]);

  // 🎭 배우 base
  const baseByTitle = useMemo(() => {
    if (selectedTitle === "all") return records;

    return records.filter(
      (r) => r.title === selectedTitle
    );
  }, [records, selectedTitle]);

  const allActors = useMemo(() => {
    return Array.from(
      new Set(
        baseByTitle.flatMap((r) => r.cast)
      )
    ).sort((a, b) => a.localeCompare(b));
  }, [baseByTitle]);

  const topActors = useMemo(() => {
    const count = {};

    baseByTitle.forEach((r) => {
      r.cast.forEach((a) => {
        count[a] = (count[a] || 0) + 1;
      });
    });

    const limit =
      selectedTitle === "all" ? 20 : 5;

    return Object.entries(count)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([name]) => name);
  }, [baseByTitle, selectedTitle]);

  const filteredActors = allActors.filter((a) =>
    a.includes(actorSearch)
  );

  // ➕ 배우 선택
  const addActor = (name) => {
    if (!selectedActors.includes(name)) {
      setSelectedActors([
        ...selectedActors,
        name,
      ]);
    }

    setActorSearch("");
    setActorOpen(false);
  };

  const removeActor = (name) => {
    setSelectedActors(
      selectedActors.filter((a) => a !== name)
    );
  };

  // 🎯 최종 필터
  const filteredRecords = useMemo(() => {
    let base = actorFilteredRecords;

    if (selectedTitle !== "all") {
      base = base.filter(
        (r) => r.title === selectedTitle
      );
    }

    return base;
  }, [actorFilteredRecords, selectedTitle]);

  // 🖱️ 외부 클릭 닫기
  useEffect(() => {
    const handler = (e) => {
      if (
        titleRef.current &&
        !titleRef.current.contains(e.target)
      ) {
        setTitleOpen(false);
      }

      if (
        actorRef.current &&
        !actorRef.current.contains(e.target)
      ) {
        setActorOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handler
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handler
      );
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#f5f1ea] text-black p-6 pb-24">

      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">

        <h1 className="text-3xl font-bold tracking-tight">
          Theater Archive
        </h1>

        <Link
          href="/settings"
          className="text-2xl"
        >
          ⚙️
        </Link>

      </div>

      {/* CSV */}
      <div className="mb-6">
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="text-sm"
        />
      </div>

      {/* 🎬 공연 */}
      <div
        ref={titleRef}
        className="relative mb-6"
      >

        <input
          value={titleSearch}
          placeholder="공연 검색"
          onFocus={() => setTitleOpen(true)}
          onChange={(e) => {
            setTitleSearch(e.target.value);
            setTitleOpen(true);
          }}
          className="w-full p-3 rounded-xl bg-white border border-zinc-300 outline-none"
        />

        {titleOpen && (
          <div className="absolute w-full bg-white border border-zinc-300 mt-1 rounded-xl max-h-60 overflow-auto shadow-lg z-50">

            {/* 전체 공연 */}
            <div
              className="p-3 hover:bg-zinc-100 cursor-pointer text-zinc-500"
              onClick={() => {
                setSelectedTitle("all");
                setTitleSearch("");
                setTitleOpen(false);
              }}
            >
              전체 공연
            </div>

            {/* 검색 결과 */}
            {searchedTitles.map((t) => (
              <div
                key={t}
                onClick={() => {
                  setSelectedTitle(t);
                  setTitleSearch(t);
                  setTitleOpen(false);
                }}
                className="p-3 hover:bg-zinc-100 cursor-pointer"
              >
                {t}
              </div>
            ))}

            {/* 배우 기반 공연 */}
            {selectedActors.length > 0 && (
              <>
                <div className="border-t border-zinc-200" />

                <div className="text-xs text-zinc-400 p-3">
                  해당 배우 출연 공연
                </div>

                {actorFilteredTitles.map((t) => (
                  <div
                    key={t}
                    onClick={() => {
                      setSelectedTitle(t);
                      setTitleSearch(t);
                      setTitleOpen(false);
                    }}
                    className="p-3 hover:bg-zinc-100 cursor-pointer"
                  >
                    {t}
                  </div>
                ))}
              </>
            )}

          </div>
        )}
      </div>

      {/* 🎭 배우 */}
      <div
        ref={actorRef}
        className="mb-6"
      >

        {/* AND OR */}
        <div className="flex gap-2 mb-3">

          <button
            onClick={() =>
              setActorMode("OR")
            }
            className={`px-4 py-2 rounded-xl text-sm ${
              actorMode === "OR"
                ? "bg-black text-white"
                : "bg-white border border-zinc-300"
            }`}
          >
            OR
          </button>

          <button
            onClick={() =>
              setActorMode("AND")
            }
            className={`px-4 py-2 rounded-xl text-sm ${
              actorMode === "AND"
                ? "bg-black text-white"
                : "bg-white border border-zinc-300"
            }`}
          >
            AND
          </button>

        </div>

        <input
          value={actorSearch}
          placeholder="배우 검색"
          onFocus={() => setActorOpen(true)}
          onChange={(e) => {
            setActorSearch(e.target.value);
            setActorOpen(true);
          }}
          className="w-full p-3 rounded-xl bg-white border border-zinc-300 outline-none"
        />

        {actorOpen && (
          <div className="bg-white border border-zinc-300 mt-1 rounded-xl max-h-60 overflow-auto shadow-lg">

            <div className="text-xs text-zinc-400 p-3">
              TOP {selectedTitle === "all" ? 20 : 5}
            </div>

            {topActors.map((a) => (
              <div
                key={a}
                onClick={() => addActor(a)}
                className="p-3 hover:bg-zinc-100 cursor-pointer"
              >
                {a}
              </div>
            ))}

            <div className="border-t border-zinc-200" />

            <div className="text-xs text-zinc-400 p-3">
              전체 배우
            </div>

            {filteredActors.map((a) => (
              <div
                key={a}
                onClick={() => addActor(a)}
                className="p-3 hover:bg-zinc-100 cursor-pointer"
              >
                {a}
              </div>
            ))}

          </div>
        )}

        {/* 태그 */}
        <div className="flex flex-wrap gap-2 mt-4">

          {selectedActors.map((a) => (
            <span
              key={a}
              onClick={() => removeActor(a)}
              className="bg-black text-white px-3 py-1 rounded-full text-xs cursor-pointer"
            >
              {a} ✕
            </span>
          ))}

        </div>

      </div>

      {/* 🎫 카드 */}
      <div className="space-y-3">

        {filteredRecords.map((r) => (
          <div
            key={r.id}
            className="bg-white rounded-2xl p-4 shadow-sm border border-zinc-200"
          >

            <div className="font-semibold mb-1">
              {r.title}
            </div>

            <div className="text-sm text-zinc-500 mb-2">
              {r.dateKey} · {r.time}
            </div>

            <div className="text-sm text-zinc-500 mb-2">
              {r.theater} · {r.seat}
            </div>

            <div className="text-sm text-zinc-700">
              {r.cast.join(", ")}
            </div>

          </div>
        ))}

      </div>

      <BottomNav />

    </main>
  );
}