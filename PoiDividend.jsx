import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  Bell,
  PieChart as PieChartIcon,
  Trophy,
  Plus,
  ChevronRight,
  Wallet,
  Sparkles,
  Coins,
  AlertTriangle,
  X,
  Eye,
  EyeOff,
  Trash2,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// ---- データ（企画書の数値をそのまま反映） ----

const POINT_BRAND_COLORS = {
  楽天ポイント: "#BF0000",
  dポイント: "#CC0033",
  vポイント: "#FF6600",
  PayPayポイント: "#FF0033",
};

const DEFAULT_POINTS = [
  {
    id: "rakuten",
    name: "楽天ポイント",
    color: POINT_BRAND_COLORS["楽天ポイント"],
    regular: 8420,
    limited: [
      { id: "rk-1", amount: 1500, expires: "2026-07-05" },
      { id: "rk-2", amount: 300, expires: "2026-08-20" },
    ],
  },
  {
    id: "d",
    name: "dポイント",
    color: POINT_BRAND_COLORS["dポイント"],
    regular: 3200,
    limited: [{ id: "d-1", amount: 800, expires: "2026-06-30" }],
  },
  {
    id: "v",
    name: "vポイント",
    color: POINT_BRAND_COLORS["vポイント"],
    regular: 1150,
    limited: [],
  },
  {
    id: "paypay",
    name: "PayPayポイント",
    color: POINT_BRAND_COLORS["PayPayポイント"],
    regular: 2780,
    limited: [{ id: "pp-1", amount: 500, expires: "2026-06-25" }],
  },
];

const MONTHLY_TREND = [
  { month: "1月", value: 5000 },
  { month: "2月", value: 8000 },
  { month: "3月", value: 12000 },
  { month: "4月", value: 10000 },
  { month: "5月", value: 15000 },
  { month: "6月", value: 18000 },
];

const CATEGORY_DATA = [
  { name: "ポイ活", value: 12000, color: "#5EEAD4" },
  { name: "TikTok", value: 3500, color: "#60A5FA" },
  { name: "YouTube", value: 1200, color: "#F472B6" },
  { name: "アフィリエイト", value: 2000, color: "#FBBF24" },
];

const PENDING_PROJECTS = [
  {
    id: 1,
    name: "楽天カード",
    site: "モッピー",
    category: "クレジットカード",
    reward: 10000,
    applied: "2026/06/01",
    expected: "2026/08/01",
    status: "承認待ち",
    daysLeft: 7,
  },
  {
    id: 2,
    name: "SBI証券 口座開設",
    site: "ハピタス",
    category: "証券",
    reward: 12000,
    applied: "2026/05/20",
    expected: "2026/07/15",
    status: "承認待ち",
    daysLeft: 24,
  },
  {
    id: 3,
    name: "FX口座開設+取引",
    site: "ポイントインカム",
    category: "FX",
    reward: 15000,
    applied: "2026/05/28",
    expected: "2026/07/20",
    status: "承認待ち",
    daysLeft: 29,
  },
  {
    id: 4,
    name: "TikTok Lite 招待",
    site: "TikTok",
    category: "アプリ",
    reward: 800,
    applied: "2026/06/10",
    expected: "2026/06/24",
    status: "申請済",
    daysLeft: 3,
  },
];

const SITE_RANKING = [
  { name: "モッピー", value: 85000 },
  { name: "ハピタス", value: 55000 },
  { name: "ポイントインカム", value: 38000 },
];

const PROJECT_RANKING = [
  { name: "楽天カード", value: 15000 },
  { name: "SBI証券", value: 12000 },
  { name: "FX口座開設", value: 10000 },
];

const FUTURE_CALENDAR = [
  { month: "7月", value: 18000 },
  { month: "8月", value: 22000 },
  { month: "9月", value: 11000 },
];

const STATUS_STYLE = {
  承認待ち: { dot: "bg-amber-400", text: "text-amber-300", bg: "bg-amber-400/10" },
  申請済: { dot: "bg-sky-400", text: "text-sky-300", bg: "bg-sky-400/10" },
  承認: { dot: "bg-emerald-400", text: "text-emerald-300", bg: "bg-emerald-400/10" },
  非承認: { dot: "bg-rose-400", text: "text-rose-300", bg: "bg-rose-400/10" },
};

function yen(n) {
  return `¥${n.toLocaleString("ja-JP")}`;
}

function pt(n) {
  return `${n.toLocaleString("ja-JP")}pt`;
}

function daysUntil(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
}

function formatExpiry(dateStr) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

// ---- ポイントデータ永続化フック ----

const POINTS_STORAGE_KEY = "poidividend:points-v1";

function usePointsStore() {
  const [points, setPoints] = useState(DEFAULT_POINTS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await window.storage.get(POINTS_STORAGE_KEY);
        if (!cancelled && result?.value) {
          setPoints(JSON.parse(result.value));
        }
      } catch (e) {
        // キー未保存 = 初回起動。デフォルト値のまま進める。
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback(async (next) => {
    setPoints(next);
    try {
      await window.storage.set(POINTS_STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.error("ポイントの保存に失敗しました", e);
    }
  }, []);

  return { points, setPoints: persist, loaded };
}

// ---- 共通UI ----

function GlowCard({ children, className = "" }) {
  return (
    <div
      className={`relative rounded-2xl border border-white/[0.06] bg-[#10151a] p-5 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset] ${className}`}
    >
      {children}
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div className="mb-3 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-white/40">
      {children}
    </div>
  );
}

function TabButton({ active, onClick, children, icon: Icon }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 py-2 px-1 flex-1 transition-colors ${
        active ? "text-emerald-300" : "text-white/35"
      }`}
    >
      <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
      <span className="text-[10px] font-medium tracking-tight">{children}</span>
    </button>
  );
}

// ---- ポイント集計ヘルパー ----

function summarizePoints(points) {
  let regularTotal = 0;
  let limitedTotal = 0;
  let nearestExpiry = null; // { brand, amount, days, date }

  for (const brand of points) {
    regularTotal += brand.regular;
    for (const lim of brand.limited) {
      limitedTotal += lim.amount;
      const days = daysUntil(lim.expires);
      if (nearestExpiry === null || days < nearestExpiry.days) {
        nearestExpiry = { brand: brand.name, amount: lim.amount, days, date: lim.expires };
      }
    }
  }
  return { regularTotal, limitedTotal, total: regularTotal + limitedTotal, nearestExpiry };
}

// ---- ポイント追加モーダル ----

function AddPointModal({ open, onClose, onAdd }) {
  const [brandName, setBrandName] = useState("");
  const [kind, setKind] = useState("regular"); // regular | limited
  const [amount, setAmount] = useState("");
  const [expires, setExpires] = useState("");

  if (!open) return null;

  const canSubmit =
    brandName.trim() !== "" &&
    amount !== "" &&
    Number(amount) > 0 &&
    (kind === "regular" || expires !== "");

  const handleSubmit = () => {
    if (!canSubmit) return;
    onAdd({
      brandName: brandName.trim(),
      kind,
      amount: Number(amount),
      expires: kind === "limited" ? expires : null,
    });
    setBrandName("");
    setAmount("");
    setExpires("");
    setKind("regular");
    onClose();
  };

  return (
    <div className="absolute inset-0 z-20 flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-[420px] rounded-t-3xl border-t border-white/[0.08] bg-[#10151a] p-5 pb-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">ポイントを追加</h3>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.06] text-white/50"
          >
            <X size={14} />
          </button>
        </div>

        <div className="space-y-3.5">
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-white/40">
              ポイント名（例：au PAY ポイント、Pontaポイント）
            </label>
            <input
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="ポイント名を入力"
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 text-[14px] text-white placeholder:text-white/25 outline-none focus:border-emerald-400/40"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-white/40">種別</label>
            <div className="flex gap-2">
              <button
                onClick={() => setKind("regular")}
                className={`flex-1 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors ${
                  kind === "regular"
                    ? "bg-emerald-400/15 text-emerald-300 border border-emerald-400/30"
                    : "bg-white/[0.03] text-white/40 border border-white/[0.06]"
                }`}
              >
                通常ポイント
              </button>
              <button
                onClick={() => setKind("limited")}
                className={`flex-1 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors ${
                  kind === "limited"
                    ? "bg-amber-400/15 text-amber-300 border border-amber-400/30"
                    : "bg-white/[0.03] text-white/40 border border-white/[0.06]"
                }`}
              >
                期間限定ポイント
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-white/40">
              ポイント数
            </label>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
              inputMode="numeric"
              placeholder="0"
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 text-[14px] tabular-nums text-white placeholder:text-white/25 outline-none focus:border-emerald-400/40"
            />
          </div>

          {kind === "limited" && (
            <div>
              <label className="mb-1.5 block text-[11px] font-medium text-white/40">
                失効日
              </label>
              <input
                type="date"
                value={expires}
                onChange={(e) => setExpires(e.target.value)}
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 text-[14px] text-white outline-none focus:border-emerald-400/40 [color-scheme:dark]"
              />
            </div>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="mt-5 w-full rounded-xl bg-gradient-to-r from-emerald-400 to-teal-300 py-3 text-[14px] font-semibold text-[#0a0f0d] transition-opacity disabled:opacity-30"
        >
          追加する
        </button>
      </div>
    </div>
  );
}

// ---- ポイントカード（ホーム画面） ----

function PointsCard({ points, onAddClick, onDeleteLimited, onDeleteBrand }) {
  const [expanded, setExpanded] = useState(false);
  const { regularTotal, limitedTotal, total } = summarizePoints(points);

  // 失効が近い順にすべての期間限定ポイントを並べる
  const allLimited = points
    .flatMap((b) => b.limited.map((l) => ({ ...l, brand: b.name, color: b.color })))
    .map((l) => ({ ...l, days: daysUntil(l.expires) }))
    .sort((a, b) => a.days - b.days);

  const urgentCount = allLimited.filter((l) => l.days <= 7).length;

  return (
    <GlowCard>
      <div className="flex items-center justify-between">
        <SectionLabel>
          <Coins size={12} className="text-amber-300" />
          保有ポイント
        </SectionLabel>
        <button
          onClick={onAddClick}
          className="flex items-center gap-1 rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] font-medium text-white/60"
        >
          <Plus size={12} />
          追加
        </button>
      </div>

      <div className="flex items-end justify-between">
        <div className="text-2xl font-semibold tabular-nums text-white">{pt(total)}</div>
        {urgentCount > 0 && (
          <div className="flex items-center gap-1 rounded-full bg-rose-400/10 px-2 py-0.5 text-[10px] font-medium text-rose-300">
            <AlertTriangle size={10} />
            期限間近 {urgentCount}件
          </div>
        )}
      </div>

      <div className="mt-3 flex gap-3 text-[12px]">
        <div className="flex items-center gap-1.5 text-white/45">
          <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
          通常 {pt(regularTotal)}
        </div>
        <div className="flex items-center gap-1.5 text-amber-300/80">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          期間限定 {pt(limitedTotal)}
        </div>
      </div>

      {/* ブランド別バー */}
      <div className="mt-4 space-y-2.5">
        {points.map((b) => {
          const brandTotal = b.regular + b.limited.reduce((s, l) => s + l.amount, 0);
          if (brandTotal === 0) return null;
          return (
            <div key={b.id} className="flex items-center gap-3">
              <div className="w-[88px] shrink-0 truncate text-[12px] text-white/50">
                {b.name}
              </div>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min((brandTotal / Math.max(total, 1)) * 100, 100)}%`,
                    background: b.color,
                  }}
                />
              </div>
              <div className="w-16 shrink-0 text-right text-[12px] tabular-nums text-white/70">
                {pt(brandTotal)}
              </div>
            </div>
          );
        })}
      </div>

      {/* 期限が近い期間限定ポイント */}
      {allLimited.length > 0 && (
        <div className="mt-4 border-t border-white/[0.05] pt-3">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex w-full items-center justify-between text-[11px] font-medium text-white/40"
          >
            <span>期間限定ポイントの内訳（{allLimited.length}件）</span>
            <ChevronRight
              size={13}
              className={`transition-transform ${expanded ? "rotate-90" : ""}`}
            />
          </button>
          {expanded && (
            <div className="mt-2.5 space-y-2">
              {allLimited.map((l) => {
                const urgent = l.days <= 7;
                const soon = l.days > 7 && l.days <= 14;
                return (
                  <div
                    key={l.id}
                    className={`flex items-center justify-between rounded-lg px-2.5 py-2 ${
                      urgent ? "bg-rose-400/[0.07]" : "bg-white/[0.02]"
                    }`}
                  >
                    <div>
                      <div className="text-[12px] text-white/70">{l.brand}</div>
                      <div
                        className={`text-[10px] ${
                          urgent
                            ? "text-rose-300"
                            : soon
                            ? "text-amber-300/80"
                            : "text-white/35"
                        }`}
                      >
                        {l.days < 0
                          ? "期限切れ"
                          : l.days === 0
                          ? "本日失効"
                          : `あと${l.days}日（${formatExpiry(l.expires)}まで）`}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-[13px] font-medium tabular-nums text-white/85">
                        {pt(l.amount)}
                      </div>
                      <button
                        onClick={() => onDeleteLimited(l.brand, l.id)}
                        className="text-white/25"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </GlowCard>
  );
}

// ---- ホーム画面 ----

function HomeScreen({ points, onAddPointClick, onDeleteLimited, includePoints, onToggleIncludePoints }) {
  const confirmed = 186500;
  const pending = 42000;
  const cashTotal = confirmed + pending;
  const thisMonth = [12000, 3500, 1200, 2000];
  const thisMonthLabels = ["ポイ活", "TikTok", "YouTube", "アフィリエイト"];
  const thisMonthTotal = thisMonth.reduce((a, b) => a + b, 0);
  const yearGoal = 200000;
  const yearTotal = 142000;
  const pct = Math.round((yearTotal / yearGoal) * 100);

  const { regularTotal, limitedTotal, total: pointsTotal } = summarizePoints(points);
  const grandTotal = cashTotal + (includePoints ? pointsTotal : 0);

  return (
    <div className="space-y-5">
      {/* 総資産 ヒーロー */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-400/[0.12] bg-gradient-to-b from-[#0e1a16] to-[#0a0f0d] p-6">
        <div className="absolute -right-10 -top-16 h-48 w-48 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-emerald-300/70">
              <Sparkles size={12} />
              総副業資産{includePoints ? "（ポイント込み）" : ""}
            </div>
            <button
              onClick={onToggleIncludePoints}
              className="flex items-center gap-1 rounded-full bg-white/[0.05] px-2.5 py-1 text-[10px] font-medium text-white/50"
            >
              {includePoints ? <Eye size={11} /> : <EyeOff size={11} />}
              ポイントを{includePoints ? "含める" : "含めない"}
            </button>
          </div>
          <div className="mt-2 text-4xl font-semibold tracking-tight text-white tabular-nums">
            {yen(grandTotal)}
          </div>

          <div className="mt-4 flex gap-3">
            <div className="flex-1 rounded-xl bg-white/[0.03] p-3">
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-300/80">
                <CheckCircle2 size={12} />
                確定済み
              </div>
              <div className="mt-1 text-lg font-semibold text-white tabular-nums">
                {yen(confirmed)}
              </div>
            </div>
            <div className="flex-1 rounded-xl bg-white/[0.03] p-3">
              <div className="flex items-center gap-1.5 text-[11px] text-amber-300/80">
                <Clock size={12} />
                承認待ち
              </div>
              <div className="mt-1 text-lg font-semibold text-white tabular-nums">
                {yen(pending)}
              </div>
            </div>
          </div>

          {/* ポイント内訳の小計（現金とポイントの境界を明示） */}
          <div className="mt-3 flex gap-3">
            <div className="flex-1 rounded-xl bg-white/[0.03] p-3">
              <div className="flex items-center gap-1.5 text-[11px] text-white/45">
                <Coins size={12} />
                通常ポイント
              </div>
              <div className="mt-1 text-lg font-semibold text-white/80 tabular-nums">
                {pt(regularTotal)}
              </div>
            </div>
            <div className="flex-1 rounded-xl bg-white/[0.03] p-3">
              <div className="flex items-center gap-1.5 text-[11px] text-amber-300/70">
                <AlertTriangle size={12} />
                期間限定
              </div>
              <div className="mt-1 text-lg font-semibold text-white/80 tabular-nums">
                {pt(limitedTotal)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ポイントカード */}
      <PointsCard
        points={points}
        onAddClick={onAddPointClick}
        onDeleteLimited={onDeleteLimited}
      />

      {/* 今月の収益 */}
      <GlowCard>
        <SectionLabel>今月の収益</SectionLabel>
        <div className="flex items-end justify-between">
          <div className="text-2xl font-semibold text-white tabular-nums">
            {yen(thisMonthTotal)}
          </div>
          <div className="text-[11px] text-emerald-300/80">合計</div>
        </div>
        <div className="mt-4 space-y-2.5">
          {thisMonthLabels.map((label, i) => (
            <div key={label} className="flex items-center gap-3">
              <div className="w-20 shrink-0 text-[12px] text-white/50">{label}</div>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-300"
                  style={{ width: `${(thisMonth[i] / thisMonthTotal) * 100}%` }}
                />
              </div>
              <div className="w-16 shrink-0 text-right text-[12px] tabular-nums text-white/70">
                {yen(thisMonth[i])}
              </div>
            </div>
          ))}
        </div>
      </GlowCard>

      {/* 年間収益 */}
      <GlowCard>
        <SectionLabel>2026年 年間収益</SectionLabel>
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-2xl font-semibold text-white tabular-nums">
              {yen(yearTotal)}
            </div>
            <div className="text-[11px] text-white/40">目標 {yen(yearGoal)}</div>
          </div>
          <div className="text-right">
            <div className="text-xl font-semibold text-emerald-300 tabular-nums">{pct}%</div>
            <div className="text-[11px] text-white/40">達成率</div>
          </div>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-teal-400 to-emerald-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </GlowCard>

      {/* 月別推移グラフ */}
      <GlowCard>
        <SectionLabel>月別収益推移</SectionLabel>
        <div className="h-40 -ml-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={MONTHLY_TREND} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5EEAD4" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#5EEAD4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }}
              />
              <YAxis hide domain={[0, "dataMax + 3000"]} />
              <Tooltip
                contentStyle={{
                  background: "#161d22",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 10,
                  fontSize: 12,
                }}
                labelStyle={{ color: "rgba(255,255,255,0.6)" }}
                itemStyle={{ color: "#5EEAD4" }}
                formatter={(v) => [yen(v), "収益"]}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#5EEAD4"
                strokeWidth={2.5}
                fill="url(#trendFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlowCard>
    </div>
  );
}

// ---- 案件管理画面 ----

function ProjectsScreen() {
  const [filter, setFilter] = useState("すべて");
  const statuses = ["すべて", "申請済", "承認待ち", "承認", "非承認"];

  const filtered = useMemo(() => {
    if (filter === "すべて") return PENDING_PROJECTS;
    return PENDING_PROJECTS.filter((p) => p.status === filter);
  }, [filter]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">案件管理</h2>
        <button className="flex items-center gap-1 rounded-full bg-emerald-400/10 px-3 py-1.5 text-[12px] font-medium text-emerald-300">
          <Plus size={14} />
          新規登録
        </button>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${
              filter === s
                ? "bg-white text-[#0a0f0d]"
                : "bg-white/[0.05] text-white/50"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="space-y-2.5">
        {filtered.map((p) => {
          const style = STATUS_STYLE[p.status];
          return (
            <GlowCard key={p.id} className="!p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium text-white">{p.name}</div>
                  <div className="mt-0.5 text-[12px] text-white/40">
                    {p.site} ・ {p.category}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-emerald-300 tabular-nums">
                    {yen(p.reward)}
                  </div>
                  <div
                    className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${style.bg} ${style.text}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                    {p.status}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-white/[0.05] pt-3 text-[11px] text-white/35">
                <span>申請日 {p.applied}</span>
                <span>承認予定 {p.expected}</span>
              </div>
              {p.daysLeft <= 7 && (
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-amber-300/90">
                  <Bell size={11} />
                  判定予定日まであと{p.daysLeft}日
                </div>
              )}
            </GlowCard>
          );
        })}
      </div>
    </div>
  );
}

// ---- ポートフォリオ画面 ----

function PortfolioScreen() {
  const pendingTotal = PENDING_PROJECTS.filter((p) => p.status === "承認待ち").reduce(
    (sum, p) => sum + p.reward,
    0
  );

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold text-white">ポートフォリオ</h2>

      {/* 承認待ち資産 - 主力機能 */}
      <GlowCard className="border-amber-400/[0.15] bg-gradient-to-b from-[#1a1610] to-[#10151a]">
        <SectionLabel>
          <Clock size={12} className="text-amber-300" />
          承認待ち資産
        </SectionLabel>
        <div className="text-3xl font-semibold tabular-nums text-white">
          {yen(pendingTotal)}
        </div>
        <div className="mt-3 space-y-2">
          {PENDING_PROJECTS.filter((p) => p.status === "承認待ち").map((p) => (
            <div key={p.id} className="flex items-center justify-between text-[13px]">
              <span className="text-white/55">{p.name}</span>
              <span className="tabular-nums text-amber-200/90">{yen(p.reward)}</span>
            </div>
          ))}
        </div>
      </GlowCard>

      {/* カテゴリ別円グラフ */}
      <GlowCard>
        <SectionLabel>
          <PieChartIcon size={12} />
          カテゴリ別収益
        </SectionLabel>
        <div className="flex items-center gap-4">
          <div className="h-36 w-36 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={CATEGORY_DATA}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={38}
                  outerRadius={62}
                  paddingAngle={3}
                  stroke="none"
                >
                  {CATEGORY_DATA.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-2">
            {CATEGORY_DATA.map((c) => (
              <div key={c.name} className="flex items-center justify-between text-[12px]">
                <div className="flex items-center gap-1.5 text-white/60">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: c.color }}
                  />
                  {c.name}
                </div>
                <span className="tabular-nums text-white/80">{yen(c.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </GlowCard>

      {/* 未来収益カレンダー */}
      <GlowCard>
        <SectionLabel>
          <Calendar size={12} />
          未来収益カレンダー
        </SectionLabel>
        <div className="grid grid-cols-3 gap-2.5">
          {FUTURE_CALENDAR.map((m) => (
            <div
              key={m.month}
              className="rounded-xl bg-white/[0.03] p-3 text-center"
            >
              <div className="text-[11px] text-white/40">{m.month}予定</div>
              <div className="mt-1 text-sm font-semibold tabular-nums text-emerald-300">
                {yen(m.value)}
              </div>
            </div>
          ))}
        </div>
      </GlowCard>

      {/* 生涯実績 */}
      <GlowCard>
        <SectionLabel>生涯実績</SectionLabel>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-[11px] text-white/40">累計収益</div>
            <div className="text-lg font-semibold tabular-nums text-white">{yen(305000)}</div>
          </div>
          <div>
            <div className="text-[11px] text-white/40">累計案件</div>
            <div className="text-lg font-semibold tabular-nums text-white">185件</div>
          </div>
          <div>
            <div className="text-[11px] text-white/40">承認率</div>
            <div className="text-lg font-semibold tabular-nums text-emerald-300">92%</div>
          </div>
          <div>
            <div className="text-[11px] text-white/40">非承認件数</div>
            <div className="text-lg font-semibold tabular-nums text-white/70">8件</div>
          </div>
        </div>
      </GlowCard>

      {/* ランキング */}
      <GlowCard>
        <SectionLabel>
          <Trophy size={12} />
          サイト別収益ランキング
        </SectionLabel>
        <div className="space-y-2.5">
          {SITE_RANKING.map((s, i) => (
            <div key={s.name} className="flex items-center gap-3">
              <div
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                  i === 0
                    ? "bg-amber-400/20 text-amber-300"
                    : "bg-white/[0.06] text-white/50"
                }`}
              >
                {i + 1}
              </div>
              <div className="flex-1 text-[13px] text-white/70">{s.name}</div>
              <div className="text-[13px] font-medium tabular-nums text-white">
                {yen(s.value)}
              </div>
            </div>
          ))}
        </div>
      </GlowCard>
    </div>
  );
}

// ---- メインアプリ ----

export default function App() {
  const [tab, setTab] = useState("home");
  const { points, setPoints, loaded } = usePointsStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [includePoints, setIncludePoints] = useState(true);

  const handleAddPoint = useCallback(
    ({ brandName, kind, amount, expires }) => {
      const next = [...points];
      let brand = next.find((b) => b.name === brandName);

      if (!brand) {
        // 新規ブランド。決め打ちのブランドカラーがあれば使用、なければ汎用パレットから割り当て
        const fallbackColors = ["#5EEAD4", "#A78BFA", "#FB923C", "#38BDF8", "#F472B6"];
        const color =
          POINT_BRAND_COLORS[brandName] ||
          fallbackColors[next.length % fallbackColors.length];
        brand = { id: `custom-${Date.now()}`, name: brandName, color, regular: 0, limited: [] };
        next.push(brand);
      }

      const brandIndex = next.findIndex((b) => b.id === brand.id);
      const updatedBrand = { ...next[brandIndex] };

      if (kind === "regular") {
        updatedBrand.regular = updatedBrand.regular + amount;
      } else {
        updatedBrand.limited = [
          ...updatedBrand.limited,
          { id: `lim-${Date.now()}`, amount, expires },
        ];
      }

      next[brandIndex] = updatedBrand;
      setPoints(next);
    },
    [points, setPoints]
  );

  const handleDeleteLimited = useCallback(
    (brandName, limitedId) => {
      const next = points.map((b) =>
        b.name === brandName
          ? { ...b, limited: b.limited.filter((l) => l.id !== limitedId) }
          : b
      );
      setPoints(next);
    },
    [points, setPoints]
  );

  return (
    <div className="relative mx-auto flex h-[800px] w-full max-w-[420px] flex-col overflow-hidden rounded-[2rem] bg-[#0a0f0d] font-sans text-white">
      {/* ステータスバー風ヘッダー */}
      <div className="flex items-center justify-between px-5 pb-2 pt-5">
        <div className="flex items-center gap-1.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-400/15">
            <Wallet size={13} className="text-emerald-300" />
          </div>
          <span className="text-[14px] font-semibold tracking-tight">PoiDividend</span>
        </div>
        <button className="relative flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.05]">
          <Bell size={13} className="text-white/60" />
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-rose-400" />
        </button>
      </div>

      {/* コンテンツ */}
      <div className="flex-1 overflow-y-auto px-5 pb-4 pt-2 [scrollbar-width:none]">
        {!loaded ? (
          <div className="flex h-40 items-center justify-center text-[12px] text-white/30">
            読み込み中…
          </div>
        ) : (
          <>
            {tab === "home" && (
              <HomeScreen
                points={points}
                onAddPointClick={() => setModalOpen(true)}
                onDeleteLimited={handleDeleteLimited}
                includePoints={includePoints}
                onToggleIncludePoints={() => setIncludePoints((v) => !v)}
              />
            )}
            {tab === "projects" && <ProjectsScreen />}
            {tab === "portfolio" && <PortfolioScreen />}
          </>
        )}
      </div>

      {/* タブバー */}
      <div className="flex border-t border-white/[0.06] bg-[#0a0f0d]/95 px-2 pb-2 pt-1 backdrop-blur">
        <TabButton active={tab === "home"} onClick={() => setTab("home")} icon={TrendingUp}>
          ホーム
        </TabButton>
        <TabButton
          active={tab === "projects"}
          onClick={() => setTab("projects")}
          icon={CheckCircle2}
        >
          案件管理
        </TabButton>
        <TabButton
          active={tab === "portfolio"}
          onClick={() => setTab("portfolio")}
          icon={PieChartIcon}
        >
          ポートフォリオ
        </TabButton>
      </div>

      <AddPointModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={handleAddPoint}
      />
    </div>
  );
}
