import { DataOrchestrator } from "@/lib/data-engine/orchestrator";
import { PageHeader, Card, SectionTitle, Badge } from "@/components/ui";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Activity, Clock, Zap, ShieldCheck, AlertCircle, BarChart } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DataEngineAdminPage() {
  const orchestrator = DataOrchestrator.getInstance();
  const results = await orchestrator.syncAll();
  const status = orchestrator.getStatus();

  const totalDuration = results.reduce((acc, r) => acc + r.duration, 0);
  const avgQuality = results.reduce((acc, r) => acc + r.qualityScore, 0) / results.length;

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Hệ thống" }, { label: "Data Engine" }]} />
      
      <PageHeader 
        title="Quản trị Data Engine" 
        subtitle="Giám sát hiệu năng quét dữ liệu song song, xác minh chất lượng và trạng thái đồng bộ thời gian thực."
      />

      {/* Observability Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="flex items-center gap-4 border-emerald-500/20 bg-emerald-500/5">
          <div className="rounded-full bg-emerald-500/10 p-3 text-emerald-400">
            <Activity size={24} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-emerald-400/70 uppercase">Trạng thái quét</div>
            <div className="text-xl font-black">{status.status}</div>
          </div>
        </Card>
        
        <Card className="flex items-center gap-4 border-gold/20 bg-gold/5">
          <div className="rounded-full bg-gold/10 p-3 text-gold">
            <Zap size={24} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-gold/70 uppercase">Tốc độ trung bình</div>
            <div className="text-xl font-black">{(totalDuration / results.length).toFixed(0)} ms / engine</div>
          </div>
        </Card>

        <Card className="flex items-center gap-4 border-royal/20 bg-royal/5">
          <div className="rounded-full bg-royal/10 p-3 text-blue-400">
            <ShieldCheck size={24} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-blue-400/70 uppercase">Điểm chất lượng dữ liệu</div>
            <div className="text-xl font-black">{avgQuality.toFixed(1)}%</div>
          </div>
        </Card>
      </div>

      {/* Parallel Workers Monitor */}
      <Card>
        <SectionTitle>Parallel Workers Monitor</SectionTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left text-xs text-muted">
                <th className="pb-3">Worker Name</th>
                <th className="pb-3">Data Source</th>
                <th className="pb-3">Duration</th>
                <th className="pb-3">Quality Score</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {results.map((res) => (
                <tr key={res.engine} className="border-b border-white/5 last:border-0">
                  <td className="py-4 font-bold text-white/90">{res.engine} Worker</td>
                  <td className="py-4 text-xs text-muted">{res.source}</td>
                  <td className="py-4 font-mono text-gold">{res.duration}ms</td>
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/10">
                        <div 
                          className="h-full bg-gold transition-all" 
                          style={{ width: `${res.qualityScore}%` }} 
                        />
                      </div>
                      <span className="text-[10px] font-bold">{res.qualityScore}%</span>
                    </div>
                  </td>
                  <td className="py-4">
                    {res.success ? (
                      <Badge tone="success">XÁC MINH XONG</Badge>
                    ) : (
                      <Badge tone="danger">LỖI NGUỒN</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <SectionTitle>Lịch trình quét kế tiếp</SectionTitle>
          <div className="flex items-center gap-3 text-sm">
            <Clock size={16} className="text-gold" />
            <span>Thời điểm quét cuối: <strong>{status.lastScan?.toLocaleTimeString("vi-VN")}</strong></span>
          </div>
          <div className="mt-2 flex items-center gap-3 text-sm">
            <Activity size={16} className="text-emerald-400" />
            <span>Thời điểm quét tiếp theo: <strong>{status.nextScan?.toLocaleTimeString("vi-VN")}</strong></span>
          </div>
        </Card>
        
        <Card>
          <SectionTitle>Data Quality Policy</SectionTitle>
          <ul className="space-y-2 text-xs text-muted">
            <li className="flex items-center gap-2"><CheckCircle size={12} className="text-emerald-400" /> Chỉ hiển thị dữ liệu có nguồn gốc xác thực</li>
            <li className="flex items-center gap-2"><CheckCircle size={12} className="text-emerald-400" /> Tự động loại bỏ dữ liệu trùng lặp (Deduplication)</li>
            <li className="flex items-center gap-2"><CheckCircle size={12} className="text-emerald-400" /> Ngưỡng hiển thị tối thiểu: 60% chất lượng</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

function CheckCircle({ size, className }: { size: number, className: string }) {
  return <ShieldCheck size={size} className={className} />;
}
