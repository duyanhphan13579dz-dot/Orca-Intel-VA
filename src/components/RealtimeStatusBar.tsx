"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Loader2, Database, Info, Timer } from "lucide-react";

interface ProviderStatus {
  name: string;
  key: string;
  scope: string[];
  health: "ok" | "syncing" | "error";
  note?: string;
  lastSyncedAt: string;
}

interface SystemStatus {
  providers: ProviderStatus[];
  sync: { totalStocks: number; activeStocks: number; withPrice: number; lastSync: string | null } | null;
  refreshSeconds: number;
}

function msToNextQuarter(now = new Date()): number {
  const next = new Date(now);
  const nextMark = Math.floor(now.getMinutes() / 15) * 15 + 15;
  next.setMinutes(nextMark, 0, 0);
  return Math.max(1000, next.getTime() - now.getTime());
}

const STATUS_INDICATOR: Record<string, string> = {
  ok: "🟢",
  syncing: "🟡",
  error: "🔴",
};

export function RealtimeStatusBar() {
  const router = useRouter();
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [remaining, setRemaining] = useState(() => msToNextQuarter());
  const [spinning, setSpinning] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/system/status");
      const json = await res.json();
      if (json.ok) {
        setStatus(json);
        setUpdatedAt(new Date());
      }
    } catch { /* keep previous */ }
    setLoading(false);
  }, []);

  const refreshNow = useCallback(() => {
    setSpinning(true);
    router.refresh();
    load().finally(() => setTimeout(() => setSpinning(false), 800));
    setRemaining(msToNextQuarter());
  }, [router, load]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const tick = setInterval(() => {
      const r = msToNextQuarter();
      setRemaining(r);
      if (r <= 1100) refreshNow();
    }, 1000);
    return () => clearInterval(tick);
  }, [refreshNow]);

  const mm = String(Math.floor(remaining / 60000)).padStart(2, "0");
  const ss = String(Math.floor((remaining % 60000) / 1000)).padStart(2, "0");

  return (
    <div className="glass rounded-xl p-4 border border-gold/20">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-[13px]">
        <div className="flex items-center gap-2 font-bold text-gold">
          <ActivityIndicator />
          ORCA DATA ENGINE
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-muted">
            <Loader2 size={14} className="animate-spin" />
            Kiểm tra tính mới của dữ liệu...
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {status?.providers.map((p) => (
              <div key={p.key} className="flex items-center gap-1.5" title={`${p.scope.join(", ")} | Nguồn: ${p.name}`}>
                <span>{STATUS_INDICATOR[p.health]}</span>
                <span className="font-medium text-white/90">{p.name}</span>
                <span className="text-[10px] text-muted opacity-80 uppercase tracking-tighter">
                  {p.lastSyncedAt ? new Date(p.lastSyncedAt).toLocaleTimeString("vi-VN") : "Syncing"}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="ml-auto flex items-center gap-4">
          <div className="flex items-center gap-2 text-muted">
            <Timer size={14} className="text-gold/60" />
            Chu kỳ kế tiếp: <span className="font-mono font-bold text-gold">{mm}:{ss}</span>
          </div>
          <button 
            onClick={refreshNow}
            disabled={spinning}
            className="flex items-center gap-2 rounded-lg bg-gold/10 px-3 py-1.5 font-bold text-gold transition hover:bg-gold/20 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw size={14} className={spinning ? "animate-spin" : ""} />
            REFRESH NOW
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2 text-[11px] text-muted">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Database size={12} className="text-gold/40" />
            Master DB: <span className="text-white/80 font-semibold">{status?.sync?.totalStocks.toLocaleString("vi-VN")} mã</span>
          </div>
          <div className="flex items-center gap-1">
            <Info size={12} className="text-gold/40" />
            Đồng bộ cuối: <span className="text-white/80">{status?.sync?.lastSync ? new Date(status.sync.lastSync).toLocaleString("vi-VN") : "Đang xử lý..."}</span>
          </div>
        </div>
        <div className="italic">
          * Dữ liệu thời gian thực được xác thực đa nguồn và cập nhật tự động mỗi 15 phút.
        </div>
      </div>
    </div>
  );
}

function ActivityIndicator() {
  return (
    <span className="relative flex h-3 w-3">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold/40 opacity-75" />
      <span className="relative inline-flex h-3 w-3 rounded-full bg-gold shadow-[0_0_8px_rgba(245,197,66,0.6)]" />
    </span>
  );
}
