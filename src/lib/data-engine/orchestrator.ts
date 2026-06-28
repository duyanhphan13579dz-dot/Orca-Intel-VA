import { fetchLiveNews } from "../realtime-engine";
import { fetchLiveMacro } from "../realtime-engine";
import { getIndicesLive, getStocksLive } from "../vndirect";
import { getForexLive, getCryptoLive } from "../market-live";

// ====================================================================
// HIGH PERFORMANCE DATA ENGINE - ORCHESTRATOR
// --------------------------------------------------------------------
// Hoạt động theo kiến trúc bất đồng bộ, thực hiện song song tất cả các 
// engine thành phần. Áp dụng cơ chế Parallel Fetch & Multi-stage Validation.
// ====================================================================

export interface EngineTaskResult<T> {
  engine: string;
  duration: number;
  success: boolean;
  data: T | null;
  error?: string;
  source: string;
  qualityScore: number;
}

export class DataOrchestrator {
  private static instance: DataOrchestrator;
  private lastScan: Date | null = null;

  private constructor() {}

  public static getInstance(): DataOrchestrator {
    if (!DataOrchestrator.instance) {
      DataOrchestrator.instance = new DataOrchestrator();
    }
    return DataOrchestrator.instance;
  }

  /**
   * Thực thi song song tất cả các Data Workers
   */
  public async syncAll(): Promise<EngineTaskResult<any>[]> {
    const t0 = Date.now();
    
    // Khởi chạy song song tất cả engine (Parallel Execution)
    // Một engine lỗi không ảnh hưởng đến các engine khác
    const results = await Promise.allSettled([
      this.runWorker("News", fetchLiveNews, "CafeF, Vietstock, Reuters"),
      this.runWorker("Macro", fetchLiveMacro, "GSO, FED, SBV"),
      this.runWorker("MarketIndices", getIndicesLive, "VNDirect"),
      this.runWorker("Stocks", getStocksLive, "VNStock"),
      this.runWorker("Forex", getForexLive, "Frankfurter"),
      this.runWorker("Crypto", getCryptoLive, "CoinGecko"),
    ]);

    this.lastScan = new Date();
    
    const processedResults = results.map((res, i) => {
      if (res.status === "fulfilled") return res.value;
      return {
        engine: "Unknown",
        duration: 0,
        success: false,
        data: null,
        error: "System error",
        source: "N/A",
        qualityScore: 0
      };
    });

    console.info(`[Orchestrator] Đồng bộ hoàn tất sau ${Date.now() - t0}ms`);
    return processedResults;
  }

  /**
   * Worker wrapper với cơ chế đo lường hiệu năng và chấm điểm chất lượng
   */
  private async runWorker<T>(
    name: string, 
    fetcher: () => Promise<T>, 
    source: string
  ): Promise<EngineTaskResult<T>> {
    const start = Date.now();
    try {
      // Fetch
      const data = await fetcher();
      
      // Normalize & Validate (Giả lập bước trung gian)
      const qualityScore = this.calculateQualityScore(data);
      
      return {
        engine: name,
        duration: Date.now() - start,
        success: true,
        data: data,
        source: source,
        qualityScore: qualityScore
      };
    } catch (e) {
      console.error(`[Worker Error] ${name}:`, e);
      return {
        engine: name,
        duration: Date.now() - start,
        success: false,
        data: null,
        error: e instanceof Error ? e.message : "Unknown error",
        source: source,
        qualityScore: 0
      };
    }
  }

  /**
   * Hệ thống chấm điểm chất lượng dữ liệu (Data Quality Score)
   */
  private calculateQualityScore(data: any): number {
    if (!data) return 0;
    let score = 70; // Base score cho dữ liệu từ nguồn tin cậy
    
    // Kiểm tra tính đầy đủ metadata
    if (Array.isArray(data)) {
      if (data.length > 0) score += 10;
      // Kiểm tra tính mới (publishedAt) nếu có
      if (data[0]?.publishedAt) {
        const ageHours = (Date.now() - new Date(data[0].publishedAt).getTime()) / 3600000;
        if (ageHours < 24) score += 20;
      }
    }
    
    return Math.min(100, score);
  }

  public getStatus() {
    return {
      lastScan: this.lastScan,
      nextScan: this.lastScan ? new Date(this.lastScan.getTime() + 900000) : null,
      status: "🟢 Hoạt động"
    };
  }
}
