import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

type SwipeWhichCard = {
  id: string;
  name: string;
  issuer: string;
  program: string;
  baseReturn?: number;
  bonusRates?: Record<string, number>;
  constraints?: any[];
};

type SwipeWhichData = {
  dataVersion?: string;
  scenarios: string[];
  scenarioLabels?: Record<string, string>;
  cards: SwipeWhichCard[];
};

const CreditCard2SwipeWhich: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<SwipeWhichData | null>(null);
  const [scenario, setScenario] = useState<string>('onlineHKD');

  useEffect(() => {
    fetch('./data/swipewhich_rewards_v1_5.json')
      .then((r) => r.json())
      .then((j) => {
        setData(j);
        if (j?.scenarios?.length) {
          setScenario((prev: string) => (j.scenarios.includes(prev) ? prev : j.scenarios[0]));
        }
      })
      .catch(() => setData(null));
  }, []);

  const rows = useMemo(() => {
    if (!data) return [];
    const list = (data.cards || []).map((c) => {
      const r = typeof c.bonusRates?.[scenario] === 'number' ? c.bonusRates?.[scenario] : (typeof c.baseReturn === 'number' ? c.baseReturn : null);
      return { ...c, rate: r };
    });

    // Sort by rate desc, null last
    list.sort((a: any, b: any) => {
      const ra = typeof a.rate === 'number' ? a.rate : -1;
      const rb = typeof b.rate === 'number' ? b.rate : -1;
      return rb - ra;
    });
    return list;
  }, [data, scenario]);

  return (
    <div className="min-h-screen bg-background pt-safe-top pb-24">
      <div className="px-4 py-3 flex justify-between items-center sf-topbar sticky top-0 z-50">
        <button onClick={() => navigate(-1)} className="flex items-center text-primary">
          <ChevronLeft size={24} />
          <span>信用卡2</span>
        </button>
        <h2 className="text-lg font-semibold">A：場景比較</h2>
        <div className="w-16" />
      </div>

      <div className="p-4 space-y-3">
        <div className="sf-panel rounded-xl p-3 space-y-2">
          <div className="text-xs text-gray-500">選擇場景</div>
          <select
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            className="w-full sf-control rounded-xl px-3 py-2 text-gray-200"
          >
            {(data?.scenarios || []).map((s) => (
              <option key={s} value={s}>
                {data?.scenarioLabels?.[s] || s}
              </option>
            ))}
          </select>
          <div className="text-[11px] text-gray-500">
            資料：SwipeWhich（本機快照 v1.5）
          </div>
        </div>

        <div className="space-y-2">
          {rows.map((c: any) => (
            <div key={c.id} className="sf-panel rounded-xl p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-gray-100 font-semibold truncate">{c.name}</div>
                  <div className="text-xs text-gray-500 truncate">{c.issuer} · {c.program}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm text-gray-100">
                    {typeof c.rate === 'number' ? `${(c.rate * 100).toFixed(2)}%` : '—'}
                  </div>
                  <div className="text-[11px] text-gray-500">(base/bonus)</div>
                </div>
              </div>
            </div>
          ))}

          {!data && (
            <div className="text-sm text-gray-500">載入資料失敗。</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreditCard2SwipeWhich;
