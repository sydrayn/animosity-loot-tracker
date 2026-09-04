"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import Papa from "papaparse";
import { 
  Search, 
  ShieldAlert, 
  Award, 
  Layers, 
  Users, 
  RefreshCw, 
  BarChart3, 
  List, 
  Grid, 
  PieChart, 
  ShieldCheck,
  ChevronDown,
  X
} from "lucide-react";

const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQbKghpj4nzVDnAhYK2modLHnvAIUR1Vtf-u1uaIuj2sBrkGy4JZzn9FTODcUfotPxfiJ28PWIKT7uG/pub?output=csv";

const CLASS_COLORS = {
  HUNTER: "#AAD372",
  PALADIN: "#F48CBA",
  SHAMAN: "#0070DD",
  WARLOCK: "#8788EE",
  DEATHKNIGHT: "#C41E3A",
  DRUID: "#FF7C0A",
  MONK: "#00FF98",
  WARRIOR: "#C69B6D",
  PRIEST: "#FFFFFF",
  ROGUE: "#FFF468",
  MAGE: "#3FC7EB",
  DEMONHUNTER: "#A330C9",
  EVOKER: "#33937F"
};

const CLASS_TEXT_CLASSES = {
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

const CLASS_BG_CLASSES = {
  HUNTER: "bg-[#AAD372]/15 border-[#AAD372]/30",
  PALADIN: "bg-[#F48CBA]/15 border-[#F48CBA]/30",
  SHAMAN: "bg-[#0070DD]/15 border-[#0070DD]/30",
  WARLOCK: "bg-[#8788EE]/15 border-[#8788EE]/30",
  DEATHKNIGHT: "bg-[#C41E3A]/15 border-[#C41E3A]/30",
  DRUID: "bg-[#FF7C0A]/15 border-[#FF7C0A]/30",
  MONK: "bg-[#00FF98]/15 border-[#00FF98]/30",
  WARRIOR: "bg-[#C69B6D]/15 border-[#C69B6D]/30",
  PRIEST: "bg-white/10 border-white/20",
  ROGUE: "bg-[#FFF468]/15 border-[#FFF468]/30",
  MAGE: "bg-[#3FC7EB]/15 border-[#3FC7EB]/30",
  DEMONHUNTER: "bg-[#A330C9]/15 border-[#A330C9]/30",
  EVOKER: "bg-[#33937F]/15 border-[#33937F]/30"
};

const RESPONSE_STYLES = {
  "BiS/Tier": "bg-purple-950/80 text-purple-300 border border-purple-700/60",
  "Major Upgrade": "bg-blue-950/80 text-blue-300 border border-blue-700/60",
  "Minor Upgrade": "bg-emerald-950/80 text-emerald-300 border border-emerald-700/60",
  "Off Spec": "bg-amber-950/80 text-amber-300 border border-amber-700/60",
  "Tmog": "bg-pink-950/80 text-pink-300 border border-pink-700/60",
  "Bonus Loot": "bg-indigo-950/80 text-indigo-300 border border-indigo-700/60"
};

function categorizeItemType(itemTitle = "", subType = "", equipLoc = "") {
  const t = itemTitle.toLowerCase();
  const el = equipLoc.toLowerCase();
  const st = subType.toLowerCase();

  if (t.includes("icon") || t.includes("curio") || t.includes("remnant") || t.includes("relic") || t.includes("token")) {
    return "Token";
  }
  if (el.includes("trinket")) return "Trinket";
  if (el.includes("finger") || el.includes("neck")) return "Jewelry";
  if (
    el.includes("one-hand") ||
    el.includes("two-hand") ||
    el.includes("main hand") ||
    el.includes("off hand") ||
    el.includes("ranged") ||
    st.includes("sword") ||
    st.includes("mace") ||
    st.includes("axe") ||
    st.includes("dagger") ||
    st.includes("staff") ||
    st.includes("staves") ||
    st.includes("bow") ||
    st.includes("shield")
  ) {
    return "Weapon/Shield";
  }
  if (
    st.includes("cloth") ||
    st.includes("leather") ||
    st.includes("mail") ||
    st.includes("plate") ||
    el.includes("head") ||
    el.includes("shoulder") ||
    el.includes("chest") ||
    el.includes("waist") ||
    el.includes("legs") ||
    el.includes("feet") ||
    el.includes("wrist") ||
    el.includes("hands") ||
    el.includes("back")
  ) {
    return "Armor";
  }
  return "Other";
}

function MultiSelectDropdown({ label, options, selected, onChange, colorMap = null }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (opt) => {
    if (selected.includes(opt)) {
      onChange(selected.filter((item) => item !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };

  const selectAll = () => onChange([...options]);
  const clearAll = () => onChange([]);

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-xs font-medium text-gray-400 mb-1">{label}</label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-1.5 px-3 bg-gray-950 border border-gray-700 rounded-lg text-sm text-left text-white hover:border-gray-500 transition"
      >
        <span className="truncate">
          {selected.length === 0
            ? `All ${label}s`
            : selected.length === 1
            ? selected[0]
            : `${selected.length} Selected`}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-1.5 flex-shrink-0" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-56 bg-gray-950 border border-gray-700 rounded-xl shadow-2xl p-2 space-y-1">
          <div className="flex justify-between items-center px-2 py-1 border-b border-gray-800 text-[11px]">
            <button onClick={selectAll} className="text-indigo-400 hover:underline">Select All</button>
            <button onClick={clearAll} className="text-gray-400 hover:underline">Clear</button>
          </div>
          <div className="max-h-56 overflow-y-auto space-y-1 pt-1">
            {options.map((opt) => {
              const isChecked = selected.includes(opt);
              const customColor = colorMap?.[opt];
              return (
                <label
                  key={opt}
                  className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-800/70 cursor-pointer text-xs"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleOption(opt)}
                    className="rounded border-gray-700 bg-gray-900 text-indigo-600 focus:ring-0"
                  />
                  <span
                    className="truncate font-medium"
                    style={customColor ? { color: customColor } : { color: "#e2e8f0" }}
                  >
                    {opt}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function LootDashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("table");
  const [raiderDisplayMode, setRaiderDisplayMode] = useState("bars");
  
  const [search, setSearch] = useState("");
  const [selectedDifficulties, setSelectedDifficulties] = useState([]);
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [selectedResponses, setSelectedResponses] = useState([]);
  const [selectedBosses, setSelectedBosses] = useState([]);
  const [selectedItemTypes, setSelectedItemTypes] = useState([]);
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

          let headerIdx = rows.findIndex((r) =>
            r.some((cell) => cell && (cell.toString().toLowerCase().includes("name") || cell.toString().toLowerCase().includes("itemid")))
          );
          if (headerIdx === -1) headerIdx = 0;

          const headers = rows[headerIdx].map((h) =>
            h ? h.toString().toLowerCase().trim() : ""
          );

          const idxName = headers.indexOf("name");
          const idxPlayer = headers.indexOf("player");
          const idxDate = headers.indexOf("date");
          const idxTime = headers.indexOf("time");
          const idxItem = headers.indexOf("item");
          const idxItemID = headers.indexOf("itemid");
          const idxResponse = headers.indexOf("response");
          const idxClass = headers.indexOf("class");
          const idxInstance = headers.indexOf("instance");
          const idxBoss = headers.indexOf("boss");
          const idxGear1 = headers.indexOf("gear1");
          const idxSubType = headers.indexOf("subtype");
          const idxEquipLoc = headers.indexOf("equiploc");

          const parsedItems = [];

          for (let i = headerIdx + 1; i < rows.length; i++) {
            const r = rows[i];
            if (!r || r.length <= 1) continue;

            const respRaw = idxResponse !== -1 ? (r[idxResponse] || "Awarded").trim() : "Awarded";

            // Omit Personal Loot - Non tradeable
            if (
              respRaw.toLowerCase().includes("personal loot") ||
              respRaw.toLowerCase().includes("non tradeable") ||
              respRaw.toLowerCase() === "pl"
            ) {
              continue;
            }

            let name = idxName !== -1 ? r[idxName] : "";
            if (!name && idxPlayer !== -1 && r[idxPlayer]) {
              name = r[idxPlayer].split("-")[0];
            }

            const rawInstance = idxInstance !== -1 ? (r[idxInstance] || "") : "";
            let instanceName = rawInstance;
            let difficulty = "Normal";

            if (rawInstance.toLowerCase().includes("heroic")) {
              difficulty = "Heroic";
              instanceName = rawInstance.replace(/-heroic/i, "").trim();
            } else if (rawInstance.toLowerCase().includes("mythic")) {
              difficulty = "Mythic";
              instanceName = rawInstance.replace(/-mythic/i, "").trim();
            } else if (rawInstance.toLowerCase().includes("normal")) {
              difficulty = "Normal";
              instanceName = rawInstance.replace(/-normal/i, "").trim();
            }

            const item = idxItem !== -1 ? r[idxItem] : "";
            const itemID = idxItemID !== -1 ? r[idxItemID] : "";
            const subType = idxSubType !== -1 ? (r[idxSubType] || "").trim() : "";
            const equipLoc = idxEquipLoc !== -1 ? (r[idxEquipLoc] || "").trim() : "";
            const itemType = categorizeItemType(item, subType, equipLoc);

            if (name || item) {
              parsedItems.push({
                name: (name || "").trim(),
                item: (item || "").trim(),
                itemID: (itemID || "").toString().trim(),
                date: (idxDate !== -1 ? r[idxDate] : "").trim(),
                time: (idxTime !== -1 ? r[idxTime] : "").trim(),
                class: idxClass !== -1 ? (r[idxClass] || "").toUpperCase().trim() : "",
                response: respRaw,
                boss: (idxBoss !== -1 ? r[idxBoss] : "").trim(),
                instance: instanceName,
                difficulty,
                gear1: (idxGear1 !== -1 ? r[idxGear1] : "").trim(),
                subType,
                equipLoc,
                itemType
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
    const difficulties = [...new Set(data.map((d) => d.difficulty).filter(Boolean))].sort();
    const itemTypes = ["Armor", "Weapon/Shield", "Trinket", "Token", "Jewelry", "Other"];
    return { classes, responses, bosses, difficulties, itemTypes };
  }, [data]);

  const filteredData = useMemo(() => {
    const q = search.toLowerCase();
    return data.filter((row) => {
      const matchSearch =
        !q ||
        (row.name && row.name.toLowerCase().includes(q)) ||
        (row.item && row.item.toLowerCase().includes(q));
      const matchDiff = selectedDifficulties.length === 0 || selectedDifficulties.includes(row.difficulty);
      const matchClass = selectedClasses.length === 0 || selectedClasses.includes(row.class);
      const matchResp = selectedResponses.length === 0 || selectedResponses.includes(row.response);
      const matchBoss = selectedBosses.length === 0 || selectedBosses.includes(row.boss);
      const matchType = selectedItemTypes.length === 0 || selectedItemTypes.includes(row.itemType);
      return matchSearch && matchDiff && matchClass && matchResp && matchBoss && matchType;
    });
  }, [data, search, selectedDifficulties, selectedClasses, selectedResponses, selectedBosses, selectedItemTypes]);

  const stats = useMemo(() => {
    const total = filteredData.length;
    const bisCount = filteredData.filter((d) => d.response === "BiS/Tier").length;
    const tokens = filteredData.filter((d) => d.itemType === "Token").length;

    const playerCounts = {};
    const playerClassMap = {};
    filteredData.forEach((d) => {
      if (d.name) {
        playerCounts[d.name] = (playerCounts[d.name] || 0) + 1;
        if (d.class) playerClassMap[d.name] = d.class;
      }
    });

    const alphaPlayers = Object.entries(playerCounts).sort((a, b) => a[0].localeCompare(b[0]));
    const sortedByCount = Object.entries(playerCounts).sort((a, b) => b[1] - a[1]);
    const maxCount = sortedByCount[0]?.[1] || 1;

    return { total, bisCount, tokens, alphaPlayers, sortedByCount, maxCount, playerClassMap };
  }, [filteredData]);

  const analytics = useMemo(() => {
    const armorCounts = { Cloth: 0, Leather: 0, Mail: 0, Plate: 0, Miscellaneous: 0, Other: 0 };
    const classCounts = {};
    const bossCounts = {};

    filteredData.forEach((d) => {
      const st = d.subType.toLowerCase();
      if (st.includes("cloth")) armorCounts.Cloth++;
      else if (st.includes("leather")) armorCounts.Leather++;
      else if (st.includes("mail")) armorCounts.Mail++;
      else if (st.includes("plate")) armorCounts.Plate++;
      else if (st.includes("miscellaneous")) armorCounts.Miscellaneous++;
      else armorCounts.Other++;

      if (d.class) classCounts[d.class] = (classCounts[d.class] || 0) + 1;
      if (d.boss) bossCounts[d.boss] = (bossCounts[d.boss] || 0) + 1;
    });

    return {
      armor: Object.entries(armorCounts).sort((a, b) => b[1] - a[1]),
      classes: Object.entries(classCounts).sort((a, b) => b[1] - a[1]),
      bosses: Object.entries(bossCounts).sort((a, b) => b[1] - a[1]),
    };
  }, [filteredData]);

  const hasActiveFilters = 
    search ||
    selectedDifficulties.length > 0 ||
    selectedClasses.length > 0 ||
    selectedResponses.length > 0 ||
    selectedBosses.length > 0 ||
    selectedItemTypes.length > 0;

  const resetAllFilters = () => {
    setSearch("");
    setSelectedDifficulties([]);
    setSelectedClasses([]);
    setSelectedResponses([]);
    setSelectedBosses([]);
    setSelectedItemTypes([]);
  };

  const chartHeight = 220;
  const yAxisMax = Math.max(8, Math.ceil(stats.maxCount * 1.15));
  const yTicks = [0, Math.round(yAxisMax * 0.25), Math.round(yAxisMax * 0.5), Math.round(yAxisMax * 0.75), yAxisMax];

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center pb-5 border-b border-gray-800 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <span>Animosity</span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-indigo-900/50 text-indigo-300 border border-indigo-700/50 uppercase tracking-widest">
              Loot Council
            </span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Season 2 Raid Progression & Loot Allocation Dashboard
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-gray-950 p-1 rounded-lg border border-gray-800">
            <button
              onClick={() => setActiveTab("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                activeTab === "table" ? "bg-indigo-600 text-white shadow-sm" : "text-gray-400 hover:text-white"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Loot Log
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                activeTab === "analytics" ? "bg-indigo-600 text-white shadow-sm" : "text-gray-400 hover:text-white"
              }`}
            >
              <PieChart className="w-3.5 h-3.5" />
              Loot Analytics
            </button>
          </div>

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
            <span>Tradeable Items</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-1">{stats.total}</div>
        </div>

        <div className="bg-gray-900/90 border border-gray-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-gray-400 text-xs font-semibold uppercase">
            <span>Raiders Geared</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{stats.sortedByCount.length}</div>
        </div>

        <div className="bg-gray-900/90 border border-gray-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-gray-400 text-xs font-semibold uppercase">
            <span>BiS / Tier Pieces</span>
            <Award className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-400 mt-1">{stats.bisCount}</div>
        </div>

        <div className="bg-gray-900/90 border border-gray-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-gray-400 text-xs font-semibold uppercase">
            <span>Tier / Curio Tokens</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-1">{stats.tokens}</div>
        </div>
      </div>

      {/* Multi-Select Filter Bar */}
      <div className="bg-gray-900/90 border border-gray-800 p-4 rounded-xl space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
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

          <MultiSelectDropdown
            label="Difficulty"
            options={filterOptions.difficulties}
            selected={selectedDifficulties}
            onChange={setSelectedDifficulties}
          />

          <MultiSelectDropdown
            label="Class"
            options={filterOptions.classes}
            selected={selectedClasses}
            onChange={setSelectedClasses}
            colorMap={CLASS_COLORS}
          />

          <MultiSelectDropdown
            label="Item Type"
            options={filterOptions.itemTypes}
            selected={selectedItemTypes}
            onChange={setSelectedItemTypes}
          />

          <MultiSelectDropdown
            label="Response"
            options={filterOptions.responses}
            selected={selectedResponses}
            onChange={setSelectedResponses}
          />

          <MultiSelectDropdown
            label="Boss"
            options={filterOptions.bosses}
            selected={selectedBosses}
            onChange={setSelectedBosses}
          />
        </div>

        {hasActiveFilters && (
          <div className="flex justify-end pt-1">
            <button
              onClick={resetAllFilters}
              className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
            >
              <X className="w-3.5 h-3.5" />
              Reset All Filters
            </button>
          </div>
        )}
      </div>

      {activeTab === "table" ? (
        <>
          {/* Raider Loot Presentation Box */}
          <div className="bg-gray-900/70 border border-gray-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-gray-800/80 pb-3">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-300">
                  Raider Loot Allocation
                </h2>
                <p className="text-xs text-gray-500">Click any raider bar or badge to isolate their drops</p>
              </div>

              {/* View Mode Toggles */}
              <div className="flex bg-gray-950 p-0.5 rounded-lg border border-gray-800 self-start">
                <button
                  onClick={() => setRaiderDisplayMode("bars")}
                  className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded ${
                    raiderDisplayMode === "bars" ? "bg-gray-800 text-white" : "text-gray-400 hover:text-white"
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  Bar Chart
                </button>
                <button
                  onClick={() => setRaiderDisplayMode("cards")}
                  className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded ${
                    raiderDisplayMode === "cards" ? "bg-gray-800 text-white" : "text-gray-400 hover:text-white"
                  }`}
                >
                  <Grid className="w-3.5 h-3.5" />
                  Badges
                </button>
                <button
                  onClick={() => setRaiderDisplayMode("grouped")}
                  className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded ${
                    raiderDisplayMode === "grouped" ? "bg-gray-800 text-white" : "text-gray-400 hover:text-white"
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  By Class
                </button>
              </div>
            </div>

            {/* Option 1: True Vertical Bar Chart */}
            {raiderDisplayMode === "bars" && (
              <div className="w-full overflow-x-auto pt-2 pb-6">
                <div className="min-w-[820px]">
                  <div className="relative flex">
                    <div className="flex flex-col justify-between text-[11px] font-mono text-gray-500 pr-3 select-none text-right w-8" style={{ height: `${chartHeight}px` }}>
                      {[...yTicks].reverse().map((val) => (
                        <span key={val}>{val}</span>
                      ))}
                    </div>

                    <div className="relative flex-1 border-l border-b border-gray-800" style={{ height: `${chartHeight}px` }}>
                      {yTicks.map((val) => {
                        const bottomPct = (val / yAxisMax) * 100;
                        return (
                          <div
                            key={val}
                            className="absolute left-0 right-0 border-b border-gray-800/60"
                            style={{ bottom: `${bottomPct}%` }}
                          />
                        );
                      })}

                      <div className="absolute inset-0 flex items-end justify-around px-2 gap-2">
                        {stats.alphaPlayers.map(([playerName, count]) => {
                          const pClass = stats.playerClassMap[playerName];
                          const barColor = "#3b82f6";
                          const heightPct = Math.max(4, (count / yAxisMax) * 100);

                          return (
                            <div
                              key={playerName}
                              onClick={() => setSearch(playerName)}
                              className="group relative flex-1 flex flex-col items-center justify-end h-full cursor-pointer max-w-[38px]"
                            >
                              <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition bg-gray-900 border border-gray-700 text-[11px] font-bold px-1.5 py-0.5 rounded pointer-events-none z-10 text-white whitespace-nowrap shadow-lg">
                                {count} {count === 1 ? "item" : "items"}
                              </div>

                              <div
                                className="w-full rounded-t transition-all group-hover:brightness-125"
                                style={{
                                  height: `${heightPct}%`,
                                  backgroundColor: barColor
                                }}
                              />

                              <div className="absolute top-[100%] pt-2 origin-top-left -rotate-45 whitespace-nowrap text-[11px] font-medium select-none pointer-events-none">
                                <span style={{ color: CLASS_COLORS[pClass] || "#94a3b8" }}>
                                  {playerName}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="h-14" />
                </div>
              </div>
            )}

            {/* Option 2: Compact Badge Grid */}
            {raiderDisplayMode === "cards" && (
              <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto pr-2">
                {stats.sortedByCount.map(([playerName, count]) => {
                  const pClass = stats.playerClassMap[playerName];
                  const textClass = CLASS_TEXT_CLASSES[pClass] || "text-white";
                  const bgClass = CLASS_BG_CLASSES[pClass] || "bg-gray-800 border-gray-700";

                  return (
                    <button
                      key={playerName}
                      onClick={() => setSearch(playerName)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition hover:scale-105 ${bgClass}`}
                    >
                      <span className={textClass}>{playerName}</span>
                      <span className="bg-gray-900/90 text-gray-200 px-1.5 py-0.5 rounded font-mono text-[11px]">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Option 3: Grouped by Class */}
            {raiderDisplayMode === "grouped" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-64 overflow-y-auto pr-2">
                {filterOptions.classes.map((cls) => {
                  const raidersInClass = stats.sortedByCount.filter(
                    ([p]) => stats.playerClassMap[p] === cls
                  );
                  if (raidersInClass.length === 0) return null;

                  return (
                    <div key={cls} className="bg-gray-950/60 p-3 rounded-lg border border-gray-800">
                      <div className={`text-xs font-bold uppercase tracking-wider mb-2 ${CLASS_TEXT_CLASSES[cls]}`}>
                        {cls}
                      </div>
                      <div className="space-y-1">
                        {raidersInClass.map(([p, cnt]) => (
                          <div
                            key={p}
                            onClick={() => setSearch(p)}
                            className="flex justify-between text-xs cursor-pointer hover:bg-gray-800/60 px-1.5 py-0.5 rounded"
                          >
                            <span className="text-gray-300">{p}</span>
                            <span className="font-mono text-gray-400 font-semibold">{cnt}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Loot Table */}
          <div className="bg-gray-900/90 border border-gray-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-950/80 text-gray-400 border-b border-gray-800 text-xs uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="p-3.5">Date / Time</th>
                    <th className="p-3.5">Raider</th>
                    <th className="p-3.5">Item Awarded</th>
                    <th className="p-3.5">Type</th>
                    <th className="p-3.5">Response</th>
                    <th className="p-3.5">Difficulty</th>
                    <th className="p-3.5">Boss / Instance</th>
                    <th className="p-3.5">Replaced</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-gray-500">
                        No matching records found.
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((row, idx) => {
                      const classColor = CLASS_TEXT_CLASSES[row.class] || "text-white";
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
                          <td className="p-3.5 whitespace-nowrap text-xs text-gray-400 font-mono">
                            {row.itemType}
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            <span className={`px-2.5 py-0.5 rounded text-xs font-semibold ${badge}`}>
                              {row.response}
                            </span>
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                              row.difficulty === "Heroic" 
                                ? "bg-amber-950/50 text-amber-300 border-amber-800" 
                                : row.difficulty === "Mythic"
                                ? "bg-red-950/50 text-red-300 border-red-800"
                                : "bg-gray-800 text-gray-300 border-gray-700"
                            }`}>
                              {row.difficulty}
                            </span>
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
        </>
      ) : (
        /* Analytics Deep-Dive Tab */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-900/90 border border-gray-800 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-sky-400" />
              Armor Type Breakdown
            </h3>
            <div className="space-y-2">
              {analytics.armor.map(([armor, count]) => {
                const pct = Math.round((count / (stats.total || 1)) * 100);
                return (
                  <div key={armor} className="bg-gray-950 p-2.5 rounded-lg border border-gray-800/80">
                    <div className="flex justify-between text-xs mb-1 font-medium">
                      <span className="text-gray-200">{armor}</span>
                      <span className="text-gray-400 font-mono">{count} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-sky-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-gray-900/90 border border-gray-800 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-300">
              Total Loot Awarded by Class
            </h3>
            <div className="space-y-2">
              {analytics.classes.map(([cls, count]) => {
                const maxClass = analytics.classes[0]?.[1] || 1;
                const pct = Math.round((count / maxClass) * 100);
                return (
                  <div key={cls} className="bg-gray-950 p-2.5 rounded-lg border border-gray-800/80">
                    <div className="flex justify-between text-xs mb-1 font-medium">
                      <span className={CLASS_TEXT_CLASSES[cls] || "text-white"}>{cls}</span>
                      <span className="text-gray-400 font-mono">{count} items</span>
                    </div>
                    <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-gray-900/90 border border-gray-800 rounded-xl p-5 space-y-3 md:col-span-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-300">
              Loot Drops per Encounter
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {analytics.bosses.map(([boss, count]) => {
                const maxBoss = analytics.bosses[0]?.[1] || 1;
                const pct = Math.round((count / maxBoss) * 100);
                return (
                  <div key={boss} className="bg-gray-950 p-2.5 rounded-lg border border-gray-800/80">
                    <div className="flex justify-between text-xs mb-1 font-medium">
                      <span className="text-gray-200 truncate">{boss}</span>
                      <span className="text-gray-400 font-mono">{count} drops</span>
                    </div>
                    <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}