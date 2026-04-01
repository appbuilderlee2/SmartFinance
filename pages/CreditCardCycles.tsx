import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle2, DollarSign } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { loadCycles, saveCycles, getOrCreateCurrentCycle, upsertCycle } from '../utils/creditCardCycleStorage';
import { getNextYearMonth, createOpenCycle } from '../utils/creditCardCycles';

const CreditCardCycles: React.FC = () => {
  const navigate = useNavigate();
  const { creditCards } = useData();

  const [cycles, setCycles] = useState(() => loadCycles());

  const current = useMemo(() => {
    const now = new Date();
    const list = (creditCards || []).map((c) => {
      const res = getOrCreateCurrentCycle(c, cycles, now);
      return { card: c, cycle: res.cycle, cycles: res.cycles };
    });
    // ensure created cycles are persisted in state
    const merged = list.reduce((_acc, x) => x.cycles, cycles);
    if (merged.length !== cycles.length) {
      setCycles(merged);
      saveCycles(merged);
    }
    return list;
  }, [creditCards]);

  const setAmountDue = (cardId: string, yearMonth: string) => {
    const card = creditCards.find(c => c.id === cardId);
    if (!card) return;
    const id = `ccyc_${cardId}_${yearMonth}`;
    const existing = cycles.find(c => c.id === id);
    const base = existing || createOpenCycle(card, Number(yearMonth.slice(0,4)), Number(yearMonth.slice(5,7)) - 1);
    const raw = window.prompt(`輸入 ${card.name}（${yearMonth}）本期應繳金額`, base.amountDue?.toString() || '');
    if (raw == null) return;
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0) {
      alert('金額不正確');
      return;
    }
    const next = {
      ...base,
      amountDue: n,
      amountDueEnteredAt: new Date().toISOString(),
      status: base.status || 'open',
    };
    const updated = upsertCycle(cycles, next);
    setCycles(updated);
    saveCycles(updated);
  };

  const markPaidAndNext = (cardId: string, yearMonth: string) => {
    const card = creditCards.find(c => c.id === cardId);
    if (!card) return;
    const id = `ccyc_${cardId}_${yearMonth}`;
    const existing = cycles.find(c => c.id === id);
    const base = existing || createOpenCycle(card, Number(yearMonth.slice(0,4)), Number(yearMonth.slice(5,7)) - 1);

    const nextClosed = {
      ...base,
      status: 'closed' as const,
      paidAt: new Date().toISOString(),
    };

    const nextYm = getNextYearMonth(nextClosed.year, nextClosed.month0);
    const nextOpen = createOpenCycle(card, nextYm.year, nextYm.month0);

    const updated = upsertCycle(upsertCycle(cycles, nextClosed), nextOpen);
    setCycles(updated);
    saveCycles(updated);
    alert('已標記繳費，已切換到下一期');
  };

  return (
    <div className="min-h-screen bg-background pt-safe-top pb-24">
      <div className="px-4 py-3 flex justify-between items-center sf-topbar sticky top-0 z-50">
        <button onClick={() => navigate(-1)} className="flex items-center text-primary">
          <ChevronLeft size={24} />
          <span>設定</span>
        </button>
        <h2 className="text-lg font-semibold">信用卡週期</h2>
        <div className="w-16" />
      </div>

      <div className="p-4 space-y-4">
        <div className="text-xs text-gray-500">
          以「截數月」為一期。截數後第 1 日會提醒你輸入本期應繳金額；繳費後可一鍵跳到下一期。
        </div>

        {(current || []).map(({ card, cycle }) => (
          <div key={card.id} className="sf-panel rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-gray-100 font-semibold truncate">{card.name}</div>
              <div className="text-xs text-gray-500">{cycle.yearMonth}</div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-gray-300">
              <div>截數：<span className="text-gray-100">{cycle.statementDate || '-'}</span></div>
              <div>繳費：<span className="text-gray-100">{cycle.dueDate || '-'}</span></div>
              <div>應繳：<span className="text-gray-100">{typeof cycle.amountDue === 'number' ? cycle.amountDue : '-'}</span></div>
              <div>狀態：<span className={cycle.status === 'closed' ? 'text-green-400' : 'text-yellow-400'}>{cycle.status}</span></div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAmountDue(card.id, cycle.yearMonth)}
                className="sf-control rounded-xl p-3 text-gray-200 flex items-center justify-center gap-2"
              >
                <DollarSign size={16} />
                輸入應繳
              </button>
              <button
                type="button"
                onClick={() => markPaidAndNext(card.id, cycle.yearMonth)}
                className="sf-control rounded-xl p-3 text-gray-200 flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={16} />
                已繳費 → 下一期
              </button>
            </div>
          </div>
        ))}

        {(!creditCards || creditCards.length === 0) && (
          <div className="text-sm text-gray-500">未有信用卡資料。</div>
        )}
      </div>
    </div>
  );
};

export default CreditCardCycles;
