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
  Sword, 
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

// Reusable Multi-Select Dropdown Component
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
  
  // Filters
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

            // Omit Personal Loot - Non tradeable entirely
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

  // Filter options
  const filterOptions = useMemo(() => {
    const classes = [...new Set(data.map((d) => d.class).filter(Boolean))].sort();
    const responses = [...new Set(data.map((d) => d.response).filter(Boolean))].sort();
    const bosses = [...new Set(data.map((d) => d.boss).filter(Boolean))].sort();
    const difficulties = [...new Set(data.map((d) => d.difficulty).filter(Boolean))].sort();
    const itemTypes = ["Armor", "Weapon/Shield", "Trinket", "Token", "Jewelry", "Other"];
    return { classes, responses, bosses, difficulties, itemTypes };
  }, [data]);

  // Multi-facet filtered dataset
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

  // KPIs & Counts
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

    // Alphabetical sort for consistent chart axis layout
    const alphaPlayers = Object.entries(playerCounts).sort((a, b) => a[0].localeCompare(b[0]));
    const sortedByCount = Object.entries(playerCounts).sort((a, b) => b[1] - a[1]);
    const maxCount = sortedByCount[0]?.[1] || 1;

    return { total, bisCount, tokens, alphaPlayers, sortedByCount, maxCount, playerClassMap };
  }, [filteredData]);

  // Analytics tab calculations
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

  // SVG Chart Height and Axis bounds
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