"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Papa from "papaparse";

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
    if (saved) setRecords(JSON.parse(saved));
  }, []);

  const saveToLocal = (data: any) => {
    localStorage.setItem("records", JSON.stringify(data));
    setRecords(data);
  };

  // 📂 CSV 업로드
  const handleFileUpload = (e: any) => {
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

  // 🎭 배우 필터 (AND / OR 핵심 로직)
  const actorFilteredRecords = useMemo(() => {
    if (selectedActors.length === 0) return records;

    return records.filter((r) => {
      if (actorMode === "OR") {
        return r.cast.some((a) => selectedActors.includes(a));
      }

      if (actorMode === "AND") {
        return selectedActors.every((a) => r.cast.includes(a));
      }

      return true;
    });
  }, [records, selectedActors, actorMode]);

  // 🎬 공연 dropdown base (배우 필터 적용)
  const titleBase = actorFilteredRecords;

  const searchedTitles = useMemo(() => {
    return Array.from(
      new Set(
        titleBase
          .filter((r) => r.title.includes(titleSearch))
          .map((r) => r.title)
      )
    ).sort((a, b) => a.localeCompare(b));
  }, [titleBase, titleSearch]);

  const actorFilteredTitles = useMemo(() => {
    return Array.from(
      new Set(titleBase.map((r) => r.title))
    ).sort((a, b) => a.localeCompare(b));
  }, [titleBase]);

  // 🎭 배우 base (공연 기준)
  const baseByTitle = useMemo(() => {
    if (selectedTitle === "all") return records;
    return records.filter((r) => r.title === selectedTitle);
  }, [records, selectedTitle]);

  const allActors = useMemo(() => {
    return Array.from(
      new Set(baseByTitle.flatMap((r) => r.cast))
    ).sort((a, b) => a.localeCompare(b));
  }, [baseByTitle]);

  const topActors = useMemo(() => {
    const count = {};

    baseByTitle.forEach((r) => {
      r.cast.forEach((a) => {
        count[a] = (count[a] || 0) + 1;
      });
    });

    const limit = selectedTitle === "all" ? 20 : 5;

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
      setSelectedActors([...selectedActors, name]);
    }
    setActorSearch("");
    setActorOpen(false);
  };

  const removeActor = (name) => {
    setSelectedActors(selectedActors.filter((a) => a !== name));
  };

  // 🎯 최종 필터 결과
  const filteredRecords = useMemo(() => {
    let base = actorFilteredRecords;

    if (selectedTitle !== "all") {
      base = base.filter((r) => r.title === selectedTitle);
    }

    return base;
  }, [actorFilteredRecords, selectedTitle]);

  // 🖱️ 외부 클릭 닫기
  useEffect(() => {
    const handler = (e) => {
      if (titleRef.current && !titleRef.current.contains(e.target)) {
        setTitleOpen(false);
      }
      if (actorRef.current && !actorRef.current.contains(e.target)) {
        setActorOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <main className="min-h-screen bg-black text-white p-6">

      <h1 className="text-3xl font-bold mb-4">
        Theater Archive
      </h1>

      <input
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        className="mb-6"
      />

      {/* 🎬 공연 */}
      <div ref={titleRef} className="relative mb-6">

        <input
          value={titleSearch}
          placeholder="공연 검색"
          onFocus={() => setTitleOpen(true)}
          onChange={(e) => {
            setTitleSearch(e.target.value);
            setTitleOpen(true);
          }}
          className="w-full p-2 bg-zinc-900 rounded"
        />

        {titleOpen && (
          <div className="absolute w-full bg-zinc-800 mt-1 rounded max-h-60 overflow-auto z-50">

            {/* ✅ 항상 고정 */}
            <div
              className="p-2 hover:bg-zinc-700 cursor-pointer text-zinc-300"
              onClick={() => {
                setSelectedTitle("all");
                setTitleSearch("");
                setTitleOpen(false);
              }}
            >
              전체 공연
            </div>

            {/* 🔍 검색 결과 */}
            {searchedTitles.map((t) => (
              <div
                key={t}
                onClick={() => {
                  setSelectedTitle(t);
                  setTitleSearch(t);
                  setTitleOpen(false);
                }}
                className="p-2 hover:bg-zinc-700 cursor-pointer"
              >
                {t}
              </div>
            ))}

            {/* 🎭 배우 기반 공연 */}
            {selectedActors.length > 0 && (
              <>
                <div className="border-t border-zinc-700 my-1" />

                <div className="text-xs text-zinc-400 p-2">
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
                    className="p-2 hover:bg-zinc-700 cursor-pointer"
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
      <div ref={actorRef} className="mb-6">

        {/* OR / AND */}
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => setActorMode("OR")}
            className={`px-3 py-1 rounded ${
              actorMode === "OR"
                ? "bg-white text-black"
                : "bg-zinc-800"
            }`}
          >
            OR
          </button>

          <button
            onClick={() => setActorMode("AND")}
            className={`px-3 py-1 rounded ${
              actorMode === "AND"
                ? "bg-white text-black"
                : "bg-zinc-800"
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
          className="w-full p-2 bg-zinc-900 rounded"
        />

        {actorOpen && (
          <div className="bg-zinc-800 mt-1 rounded max-h-60 overflow-auto">

            <div className="text-xs text-zinc-400 p-2">
              TOP {selectedTitle === "all" ? 20 : 5}
            </div>

            {topActors.map((a) => (
              <div
                key={a}
                onClick={() => addActor(a)}
                className="p-2 hover:bg-zinc-700 cursor-pointer"
              >
                {a}
              </div>
            ))}

            <div className="border-t border-zinc-700" />

            <div className="text-xs text-zinc-400 p-2">
              전체 배우
            </div>

            {filteredActors.map((a) => (
              <div
                key={a}
                onClick={() => addActor(a)}
                className="p-2 hover:bg-zinc-700 cursor-pointer"
              >
                {a}
              </div>
            ))}
          </div>
        )}

        {/* 태그 */}
        <div className="flex flex-wrap gap-2 mt-3">
          {selectedActors.map((a) => (
            <span
              key={a}
              onClick={() => removeActor(a)}
              className="bg-white text-black px-2 py-1 rounded text-xs cursor-pointer"
            >
              {a} ✕
            </span>
          ))}
        </div>
      </div>

      {/* 🎫 카드 */}
      <div className="space-y-2">
        {filteredRecords.map((r) => (
          <div key={r.id} className="bg-zinc-900 p-4 rounded-xl">
            <div>
              {r.title} {r.dateKey} {r.time}
            </div>

            <div className="text-xs text-zinc-400">
              {r.theater} · {r.seat}
            </div>

            <div className="text-xs text-zinc-300">
              {r.cast.join(", ")}
            </div>
          </div>
        ))}
      </div>

    </main>
  );
}