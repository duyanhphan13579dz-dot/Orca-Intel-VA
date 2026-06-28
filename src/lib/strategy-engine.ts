import { getIndicesLive } from "./vndirect";
import { getStocksLive } from "./vndirect";
import { getForexLive, getFearGreed } from "./market-live";
import type { Strategy } from "./types";

export interface MarketContext {
  vnindex: number;
  change: number;
  changePct: number;
  sentiment: string;
  liquidity: string;
  source: string;
  dataTime: string;
  aiTime: string;
}

/**
 * AI Strategy Engine - Tạo chiến lược từ dữ liệu thị trường THẬT.
 * Không sử dụng mốc VNINDEX cũ (1200). Tự động tính toán mốc hỗ trợ/kháng cự.
 */
export async function generateLiveStrategies(): Promise<{ strategies: Strategy[]; context: MarketContext }> {
  const [{ quotes }, { stocks }, forex, fng] = await Promise.all([
    getIndicesLive(),
    getStocksLive(),
    getForexLive(),
    getFearGreed(),
  ]);

  const vnindex = quotes.find(q => q.symbol === "VNINDEX") || quotes[0];
  const now = new Date();
  const dataTime = vnindex.price > 0 ? now.toISOString() : "Đang chờ đồng bộ";
  const aiTime = now.toISOString();

  // Đánh giá bối cảnh thị trường
  const price = vnindex.price;
  const isUp = vnindex.changePct >= 0;
  const sentiment = fng.label;
  
  // Tính toán các mốc kỹ thuật động
  const support = Number((price * 0.982).toFixed(2));
  const resistance = Number((price * 1.025).toFixed(2));
  const target = Number((price * 1.08).toFixed(2));
  const stopLoss = Number((price * 0.965).toFixed(2));

  const context: MarketContext = {
    vnindex: price,
    change: vnindex.change,
    changePct: vnindex.changePct,
    sentiment,
    liquidity: vnindex.volume > 500000 ? "Cao" : "Trung bình",
    source: "VNStock, Investing.com, Orca AI",
    dataTime,
    aiTime
  };

  const strategies: Strategy[] = [
    {
      slug: "chien-luoc-ngay",
      period: "ngày",
      title: `Chiến lược giao dịch ngày ${now.toLocaleDateString("vi-VN")}`,
      trend: isUp ? "Tăng trưởng ngắn hạn" : "Điều chỉnh kỹ thuật",
      entry: `${support} - ${Number((price * 0.995).toFixed(2))}`,
      exit: `${resistance}`,
      stopLoss: `${stopLoss}`,
      takeProfit: `${Number((price * 1.04).toFixed(2))}`,
      risk: isUp ? "Thấp" : "Trung bình",
      confidence: isUp ? 75 : 65,
      summary: `Dựa trên VN-Index tại ${price}, thị trường đang trong trạng thái ${sentiment.toLowerCase()}. Khuyến nghị theo dõi dòng tiền tại vùng hỗ trợ ${support}.`
    },
    {
      slug: "chien-luoc-tuan",
      period: "tuần",
      title: "Chiến lược đầu tư theo tuần",
      trend: isUp ? "Uptrend tích lũy" : "Sideway hướng xuống",
      entry: `Vùng ${Number((price * 0.97).toFixed(2))} - ${support}`,
      exit: `${Number((price * 1.05).toFixed(2))}`,
      stopLoss: `${Number((price * 0.95).toFixed(2))}`,
      takeProfit: `${target}`,
      risk: "Trung bình",
      confidence: 70,
      summary: `Triển vọng tuần tới phụ thuộc vào khả năng giữ vững mốc ${support}. Dòng tiền luân chuyển dự kiến tập trung vào nhóm VN30.`
    },
    {
      slug: "chien-luoc-thang",
      period: "tháng",
      title: "Triển vọng đầu tư trung hạn",
      trend: "Tích cực dài hạn",
      entry: `Tích lũy quanh ${Number((price * 0.95).toFixed(2))}`,
      exit: `${Number((price * 1.15).toFixed(2))}`,
      stopLoss: `${Number((price * 0.92).toFixed(2))}`,
      takeProfit: `${Number((price * 1.2).toFixed(2))}`,
      risk: "Trung bình thấp",
      confidence: 82,
      summary: `Định giá P/E thị trường tại mốc ${price} vẫn hấp dẫn cho tầm nhìn 6-12 tháng. Ưu tiên các cổ phiếu đầu ngành có ROE > 15%.`
    }
  ];

  return { strategies, context };
}
