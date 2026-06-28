import Link from "next/link";
import { generateLiveStrategies } from "@/lib/strategy-engine";
import { PageHeader, Card, Badge } from "@/components/ui";
import { LiveBadge } from "@/components/LiveBadge";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ArrowRight, Clock, Database, BrainCircuit, Activity } from "lucide-react";
import { formatNumber, formatPercent } from "@/lib/format";

export const metadata = { title: "Chiến lược đầu tư" };
export const revalidate = 900; // 15 phút

export default async function StrategyPage() {
  const { strategies, context } = await generateLiveStrategies();
  const isUp = context.changePct >= 0;

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Chiến lược đầu tư" }]} />
      
      <PageHeader
        title="Chiến lược đầu tư AI"
        subtitle="Khuyến nghị được AI tự động cập nhật 15 phút/lần dựa trên dữ liệu thị trường VN-Index và dòng tiền thực tế."
        action={<LiveBadge live={true} />}
      />

      {/* Market Context Banner */}
      <Card className="border-gold/30 bg-gold/5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/10 text-gold">
              <Activity size={24} />
            </div>
            <div>
              <div className="text-[11px] font-bold text-gold uppercase tracking-widest">Bối cảnh VN-Index</div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black">{formatNumber(context.vnindex)}</span>
                <span className={isUp ? "text-emerald-400" : "text-rose-400"}>
                  {isUp ? "▲" : "▼"} {formatPercent(context.changePct)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 md:grid-cols-4">
            <InfoItem label="Tâm lý" value={context.sentiment} highlight />
            <InfoItem label="Thanh khoản" value={context.liquidity} />
            <InfoItem label="Dữ liệu lúc" value={new Date(context.dataTime).toLocaleTimeString("vi-VN")} />
            <InfoItem label="AI cập nhật" value={new Date(context.aiTime).toLocaleTimeString("vi-VN")} />
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {strategies.map((s) => (
          <Link key={s.slug} href={`/chien-luoc/${s.slug}`} className="glass group relative flex flex-col overflow-hidden rounded-xl p-6 transition hover:border-gold/50">
            <div className="absolute -right-4 -top-4 opacity-5 transition group-hover:opacity-10">
              <BrainCircuit size={120} className="text-gold" />
            </div>
            
            <div className="mb-4">
              <Badge tone="gold">Theo {s.period}</Badge>
            </div>
            
            <h3 className="mb-2 text-lg font-black leading-tight group-hover:text-gold">{s.title}</h3>
            <p className="mb-6 line-clamp-2 text-xs leading-relaxed text-muted/80">{s.summary}</p>
            
            <div className="mt-auto space-y-3 border-t border-white/5 pt-4">
              <Row label="Xu hướng" value={s.trend} highlight />
              <Row label="Vùng mua" value={s.entry} />
              <Row label="Mục tiêu" value={s.takeProfit} success />
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-bold text-muted uppercase tracking-tighter">Độ tin cậy: {s.confidence}%</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-gold uppercase">
                  Chi tiết <ArrowRight size={12} />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-white/5 bg-white/[0.02] p-4 text-[10px] text-muted uppercase tracking-widest">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5"><Database size={12} className="text-gold/40" /> Nguồn: {context.source}</span>
          <span className="flex items-center gap-1.5"><Clock size={12} className="text-gold/40" /> Làm mới: 15 phút/lần</span>
        </div>
        <div className="italic">* Chiến lược AI được tạo dựa trên phân tích dòng tiền thực tế</div>
      </div>
    </div>
  );
}

function InfoItem({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <div className="text-[9px] font-bold text-muted/60 uppercase tracking-tighter">{label}</div>
      <div className={`text-xs font-bold ${highlight ? "text-gold" : "text-white/90"}`}>{value}</div>
    </div>
  );
}

function Row({ label, value, highlight, success }: { label: string; value: string; highlight?: boolean; success?: boolean }) {
  return (
    <div className="flex items-center justify-between text-[11px]">
      <span className="text-muted/70">{label}</span>
      <span className={`font-bold ${highlight ? "text-gold" : success ? "text-emerald-400" : "text-white/90"}`}>{value}</span>
    </div>
  );
}
