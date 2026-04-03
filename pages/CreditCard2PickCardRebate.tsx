import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Search } from 'lucide-react';

type PCRRule = {
  description?: string;
  matchType?: string;
  matchValue?: string[];
  percentage?: number;
  cap?: number;
  capType?: string;
  validDateRange?: { start?: string; end?: string };
};

type PCRCard = {
  id: string;
  slug: string;
  name: string;
  bank: string;
  annualFee?: number;
  foreignCurrencyFee?: number;
  welcomeOfferText?: string;
  sellingPoints?: string[];
  promoEndDate?: string;
  rules?: PCRRule[];
};

type PCRData = {
  cards: PCRCard[];
};

const KEY_PCR = 'sf_cc_match_pickcardrebate_v1';

const CreditCard2PickCardRebate: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<PCRData | null>(null);
  const [q, setQ] = useState('');
  const [onlyMatched, setOnlyMatched] = useState<boolean>(false);

  useEffect(() => {
    fetch('./data/pickcardrebate_cards_v1.json')
      .then((r) => r.json())
      .then((j) => setData(j))
      .catch(() => setData(null));
  }, []);

  const cards = useMemo(() => {
    let list = data?.cards || [];

    if (onlyMatched) {
      try {
        const map = JSON.parse(localStorage.getItem(KEY_PCR) || '{}') as Record<string, string>;
        const matched = new Set(Object.values(map || {}).filter(Boolean));
        list = list.filter((c) => matched.has(c.id));
      } catch {
        // ignore
      }
    }

    const qq = q.trim().toLowerCase();
    if (!qq) return list;
    return list.filter((c) => {
      const hay = [c.name, c.bank, c.id, c.slug, ...(c.sellingPoints || [])].join(' ').toLowerCase();
      return hay.includes(qq);
    });
  }, [data, q, onlyMatched]);

  return (
    <div className="min-h-screen bg-background pt-safe-top pb-24">
      <div className="px-4 py-3 flex justify-between items-center sf-topbar sticky top-0 z-50">
        <button onClick={() => navigate(-1)} className="flex items-center text-primary">
          <ChevronLeft size={24} />
          <span>信用卡2</span>
        </button>
        <h2 className="text-lg font-semibold">B：回贈規則庫</h2>
        <div className="w-16" />
      </div>

      <div className="p-4 space-y-3">
        <div className="sf-panel rounded-xl p-3 flex items-center gap-2">
          <Search size={16} className="text-gray-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜尋：卡名 / 銀行 / tag"
            className="w-full bg-transparent text-gray-100 placeholder-gray-500 focus:outline-none text-sm"
          />
        </div>

        <div className="sf-panel rounded-xl p-3 space-y-2">
          <label className="flex items-center gap-2 text-xs text-gray-300">
            <input
              type="checkbox"
              checked={onlyMatched}
              onChange={(e) => setOnlyMatched(e.target.checked)}
            />
            只顯示已配對的信用卡
          </label>

          {onlyMatched && (
            <button
              type="button"
              onClick={() => navigate('/settings/creditcards2/match')}
              className="text-xs text-primary text-left"
            >
              去配對信用卡
            </button>
          )}

          <div className="text-[11px] text-gray-500">資料：PickCardRebate（本機快照 v1）</div>
        </div>

        <div className="space-y-2">
          {(cards || []).map((c) => (
            <div key={c.id} className="sf-panel rounded-xl p-3 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-gray-100 font-semibold truncate">{c.name}</div>
                  <div className="text-xs text-gray-500 truncate">{c.bank} · {c.id}</div>
                </div>
                <div className="text-right shrink-0 text-xs text-gray-400">
                  {typeof c.annualFee === 'number' ? `年費 $${c.annualFee}` : ''}
                </div>
              </div>

              {c.welcomeOfferText && (
                <div className="text-xs text-gray-300 line-clamp-2">迎新：{c.welcomeOfferText}</div>
              )}

              <div className="text-[11px] text-gray-500">rules: {c.rules?.length || 0}</div>
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

export default CreditCard2PickCardRebate;
