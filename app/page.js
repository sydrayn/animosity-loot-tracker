"use client";

import React, { useEffect, useState, useMemo } from "react";
import Papa from "papaparse";
import { Search, ShieldAlert, Award, Layers, Users, RefreshCw } from "lucide-react";

const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQbKghpj4nzVDnAhYK2modLHnvAIUR1Vtf-u1uaIuj2sBrkGy4JZzn9FTODcUfotPxfiJ28PWIKT7uG/pub?output=csv";

const CLASS_COLORS = {
  HUNTER: "text-[#AAD372]",
  PALADIN: "text-[#F48CBA]",
  SHAMAN: "text-[#0070DD]",
  WARLOCK: "text-[#8788EE]",
  DEATHKNIGHT: "text-[#C41E3A]",
  DRUID: "text-[#FF7C0A]",
  MONK: "text-[#00FF98]",
  WARRIOR: "text-[#C69B6D]",
  PRIEST: "text-[#FFFFFF]",
  ROGUE: "text-[#FFF468]",
  MAGE: "text-[#3FC7EB]",
  DEMONHUNTER: "text-[#A330C9]",
  EVOKER: "text-[#33937F]"
};

const RESPONSE_STYLES = {
  "BiS/Tier": "bg-purple-950/80 text-purple-300 border border-purple-700/60",
  "Major Upgrade": "bg-blue-950/80 text-blue-300 border border-blue-700/60",
  "Minor Upgrade": "bg-emerald-950/80 text-emerald-300 border border-emerald-700/60",
  "Off Spec": "bg-amber-950/80 text-amber-300 border border-amber-700/60",
  "Tmog": "bg-pink-950/80 text-pink-300 border border-pink-700/60",
  "Personal Loot - Non tradeable": "bg-gray-800 text-gray-400 border border-gray-700",
  "Bonus Loot": "bg-indigo-950/80 text-indigo-300 border border-indigo-700/60"
};

export default function LootDashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedResponse, setSelectedResponse] = useState("");
  const [selectedBoss, setSelectedBoss] = useState("");
  const [lastRefreshed, setLastRefreshed] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${CSV_URL}&t=${Date.now()}`);
      const csvText = await res.text();

      Papa.parse(csvText, {
        header: false,
        skipEmptyLines: true,
        complete: (results) => {
          const rows = results.data;
          if (!rows || rows.length === 0) {
            setLoading(false);
            return;
          }

          // Locate the header row dynamically
          let headerIdx = rows.findIndex((r) =>
            r.some((cell) => cell && cell.toString().toLowerCase().includes("name") || cell.toString().toLowerCase().includes("itemid"))
          );

          if (headerIdx === -1) headerIdx = 0;

          const headers = rows[headerIdx].map((h) =>
            h ? h.toString().toLowerCase().trim() : ""
          );

          // Find exact column indexes
          const idxName = headers.indexOf("name");
          const idxPlayer = headers.indexOf("player");
          const idxDate = headers.indexOf("date");
          const idxTime = headers.indexOf("time");
          const idxItem = headers.indexOf("item");
          const idxItemID = headers.indexOf("itemid");
          const idxResponse = headers.indexOf("response");
          const idxVotes = headers.indexOf("votes");
          const idxClass = headers.indexOf("class");
          const idxInstance = headers.indexOf("instance");
          const idxBoss = headers.indexOf("boss");
          const idxGear1 = headers.indexOf("gear1");

          const parsedItems = [];

          for (let i = headerIdx + 1; i < rows.length; i++) {
            const r = rows[i];
            if (!r || r.length <= 1) continue;

            let name = idxName !== -1 ? r[idxName] : "";
            if (!name && idxPlayer !== -1 && r[idxPlayer]) {
              name = r[idxPlayer].split("-")[0];
            }

            const item = idxItem !== -1 ? r[idxItem] : "";
            const itemID = idxItemID !== -1 ? r[idxItemID] : "";
            const date = idxDate !== -1 ? r[idxDate] : "";
            const time = idxTime !== -1 ? r[idxTime] : "";
            const charClass = idxClass !== -1 ? (r[idxClass] || "").toUpperCase().trim() : "";
            const response = idxResponse !== -1 ? r[idxResponse] || "Awarded" : "Awarded";
            const votes = idxVotes !== -1 ? r[idxVotes] : "";
            const boss = idxBoss !== -1 ? r[idxBoss] : "";
            const instance = idxInstance !== -1 ? r[idxInstance] : "";
            const gear1 = idxGear1 !== -1 ? r[idxGear1] : "";

            if (name || item) {
              parsedItems.push({
                name: (name || "").trim(),
                item: (item || "").trim(),
                itemID: (itemID || "").toString().trim(),
                date: (date || "").trim(),
                time: (time || "").trim(),
                class: charClass,
                response: (response || "Awarded").trim(),
                votes: (votes || "").toString().trim(),
                boss: (boss || "").trim(),
                instance: (instance || "").trim(),
                gear1: (gear1 || "").trim(),
              });
            }
          }

          setData(parsedItems);
          setLoading(false);
          setLastRefreshed(new Date().toLocaleTimeString());

          setTimeout(() => {
            if (typeof window !== "undefined" && window.$WowheadPower) {
              window.$WowheadPower.refreshLinks();
            }
          }, 150);
        },
      });
    } catch (err) {
      console.error("Failed to fetch/parse sheet data", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filterOptions = useMemo(() => {
    const classes = [...new Set(data.map((d) => d.class).filter(Boolean))].sort();
    const responses = [...new Set(data.map((d) => d.response).filter(Boolean))].sort();
    const bosses = [...new Set(data.map((d) => d.boss).filter(Boolean))].sort();
    return { classes, responses, bosses };
  }, [data]);

  const filteredData = useMemo(() => {
    const q = search.toLowerCase();
    return data.filter((row) => {
      const matchSearch =
        !q ||
        (row.name && row.name.toLowerCase().includes(q)) ||
        (row.item && row.item.toLowerCase().includes(q));
      const matchClass = !selectedClass || row.class === selectedClass;
      const matchResp = !selectedResponse || row.response === selectedResponse;
      const matchBoss = !selectedBoss || row.boss === selectedBoss;
      return matchSearch && matchClass && matchResp && matchBoss;
    });
  }, [data, search, selectedClass, selectedResponse, selectedBoss]);

  const stats = useMemo(() => {
    const total = data.length;
    const bisCount = data.filter((d) => d.response === "BiS/Tier").length;
    const tokens = data.filter((d) =>
      /Icon|Curio|Remnant|Relic/i.test(d.item || "")
    ).length;

    const playerCounts = {};
    data.forEach((d) => {
      if (d.name) {
        playerCounts[d.name] = (playerCounts[d.name] || 0) + 1;
      }
    });

    const sortedPlayers = Object.entries(playerCounts).sort((a, b) => b[1] - a[1]);
    const maxPlayerItems = sortedPlayers[0]?.[1] || 1;

    return { total, bisCount, tokens, sortedPlayers, maxPlayerItems };
  }, [data]);

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center pb-5 border-b border-gray-800 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <span>Animosity</span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-indigo-900/50 text-indigo-300 border border-indigo-700/50 uppercase tracking-widest">
              Loot Council
            </span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Real-time Raid Progression & Gear Distribution
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastRefreshed && (
            <span className="text-xs text-gray-500 font-mono">
              Synced: {lastRefreshed}
            </span>
          )}
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-900 border border-gray-700 text-gray-300 hover:bg-gray-800 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-900/90 border border-gray-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-gray-400 text-xs font-semibold uppercase">
            <span>Total Awarded</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-1">{stats.total}</div>
        </div>

        <div className="bg-gray-900/90 border border-gray-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-gray-400 text-xs font-semibold uppercase">
            <span>Unique Raiders</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            {stats.sortedPlayers.length}
          </div>
        </div>

        <div className="bg-gray-900/90 border border-gray-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-gray-400 text-xs font-semibold uppercase">
            <span>BiS / Tier Pieces</span>
            <Award className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-400 mt-1">
            {stats.bisCount}
          </div>
        </div>

        <div className="bg-gray-900/90 border border-gray-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-gray-400 text-xs font-semibold uppercase">
            <span>Tier / Curio Tokens</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-1">
            {stats.tokens}
          </div>
        </div>
      </div>

      {/* Analytics: Top Raiders Breakdown */}
      <div className="bg-gray-900/70 border border-gray-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-300 mb-3">
          Raider Loot Totals
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-48 overflow-y-auto pr-2">
          {stats.sortedPlayers.map(([playerName, count]) => {
            const playerSample = data.find((d) => d.name === playerName);
            const classColor = CLASS_COLORS[playerSample?.class] || "text-white";
            const percent = Math.round((count / stats.maxPlayerItems) * 100);

            return (
              <div
                key={playerName}
                onClick={() => setSearch(playerName)}
                className="cursor-pointer bg-gray-950/70 border border-gray-800/80 hover:border-gray-600 p-2.5 rounded-lg transition"
              >
                <div className="flex justify-between items-center text-xs font-medium mb-1.5">
                  <span className={`font-semibold ${classColor}`}>{playerName}</span>
                  <span className="text-gray-400 font-mono">{count} items</span>
                </div>
                <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full rounded-full transition-all"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-gray-900/90 border border-gray-800 p-4 rounded-xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
        <div className="relative">
          <label className="block text-xs font-medium text-gray-400 mb-1">Search</label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Player or item..."
              className="w-full pl-9 pr-3 py-1.5 bg-gray-950 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">Class</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full py-1.5 px-2.5 bg-gray-950 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Classes</option>
            {filterOptions.classes.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">Response</label>
          <select
            value={selectedResponse}
            onChange={(e) => setSelectedResponse(e.target.value)}
            className="w-full py-1.5 px-2.5 bg-gray-950 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Responses</option>
            {filterOptions.responses.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">Boss</label>
          <select
            value={selectedBoss}
            onChange={(e) => setSelectedBoss(e.target.value)}
            className="w-full py-1.5 px-2.5 bg-gray-950 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Bosses</option>
            {filterOptions.bosses.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={() => {
              setSearch("");
              setSelectedClass("");
              setSelectedResponse("");
              setSelectedBoss("");
            }}
            className="w-full py-1.5 px-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-sm font-medium rounded-lg text-gray-200 transition"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Main Loot Table */}
      <div className="bg-gray-900/90 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-950/80 text-gray-400 border-b border-gray-800 text-xs uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-3.5">Date / Time</th>
                <th className="p-3.5">Raider</th>
                <th className="p-3.5">Item Awarded</th>
                <th className="p-3.5">Response</th>
                <th className="p-3.5">Votes</th>
                <th className="p-3.5">Boss / Instance</th>
                <th className="p-3.5">Replaced</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    No matching records found.
                  </td>
                </tr>
              ) : (
                filteredData.map((row, idx) => {
                  const classColor = CLASS_COLORS[row.class] || "text-white";
                  const badge = RESPONSE_STYLES[row.response] || "bg-gray-800 text-gray-300";
                  const cleanItem = row.item ? row.item.replace(/^\[|\]$/g, "") : "Unknown Item";

                  return (
                    <tr key={idx} className="hover:bg-gray-800/40 transition">
                      <td className="p-3.5 text-xs text-gray-400 font-mono whitespace-nowrap">
                        {row.date}
                        <div className="text-[11px] text-gray-500">{row.time}</div>
                      </td>
                      <td className={`p-3.5 font-semibold ${classColor} whitespace-nowrap`}>
                        {row.name}
                      </td>
                      <td className="p-3.5 font-medium whitespace-nowrap">
                        {row.itemID ? (
                          <a
                            href={`https://www.wowhead.com/item=${row.itemID}`}
                            data-wowhead={`item=${row.itemID}`}
                            className="hover:underline text-white font-medium"
                            target="_blank"
                            rel="noreferrer"
                          >
                            {cleanItem}
                          </a>
                        ) : (
                          <span className="text-white font-medium">{cleanItem}</span>
                        )}
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded text-xs font-semibold ${badge}`}>
                          {row.response || "Awarded"}
                        </span>
                      </td>
                      <td className="p-3.5 text-xs font-semibold text-gray-300">
                        {row.votes && row.votes !== "nil" ? `${row.votes} votes` : "—"}
                      </td>
                      <td className="p-3.5 text-xs text-gray-300">
                        <div className="font-medium text-white">{row.boss || "—"}</div>
                        <div className="text-[11px] text-gray-500">{row.instance}</div>
                      </td>
                      <td className="p-3.5 text-xs text-gray-400 max-w-xs truncate">
                        {row.gear1 ? row.gear1.replace(/^\[|\]$/g, "") : "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}