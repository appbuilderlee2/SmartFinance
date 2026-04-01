import React, { useMemo, useState, useEffect } from 'react';
import { ChevronLeft, BarChart2, Download, PieChart, BarChart3, LineChart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Currency, TransactionType } from '../types';
import { getCurrencySymbol } from '../utils/currency';
import { parseDate, toLocalYMD } from '../utils/date';

type CategoryChartMode = 'pie' | 'bar';
type TrendChartMode = 'bar' | 'line';
type RangePreset = 'this-month' | 'this-year' | 'all' | 'custom';

const Reports: React.FC = () => {
  const navigate = useNavigate();
  const { transactions, categories, currency, budgets } = useData();
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(currency);

  const availableCurrencies = useMemo(() => {
    const set = new Set<Currency>();
    set.add(currency);
    transactions.forEach((t) => {
      const txCurrency = (t.currency as Currency) || currency;
      set.add(txCurrency);
    });
    return Array.from(set);
  }, [transactions, currency]);

  const [range, setRange] = useState<{ start: string; end: string }>({
    start: '',
    end: ''
  });
  const [categoryChartMode, setCategoryChartMode] = useState<CategoryChartMode>('bar');
  const [trendChartMode, setTrendChartMode] = useState<TrendChartMode>('bar');
  const [preset, setPreset] = useState<RangePreset>('this-month');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [keyword, setKeyword] = useState<string>('');
  const [periodView, setPeriodView] = useState<'month' | 'quarter' | 'year'>('month');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const currencySymbol = getCurrencySymbol(selectedCurrency);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach(tx => tx.tags?.forEach(t => set.add(t)));
    return Array.from(set);
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const txCurrency = (tx.currency as Currency) || currency;
      if (txCurrency !== selectedCurrency) return false;
      const date = parseDate(tx.date);
      if (!date) return false;
      const startOk = range.start ? new Date(range.start) <= date : true;
      const endOk = range.end ? date <= new Date(range.end) : true;
      return startOk && endOk;
    }).filter(tx => {
      if (selectedCategories.length && !selectedCategories.includes(tx.categoryId)) return false;
      if (selectedTags.length && !tx.tags?.some(t => selectedTags.includes(t))) return false;
      const amt = tx.amount;
      if (minAmount && amt < Number(minAmount)) return false;
      if (maxAmount && amt > Number(maxAmount)) return false;
      if (keyword.trim()) {
        const k = keyword.trim().toLowerCase();
        const noteMatch = tx.note?.toLowerCase().includes(k);
        const tagMatch = tx.tags?.some(t => t.toLowerCase().includes(k));
        if (!noteMatch && !tagMatch) return false;
      }
      return true;
    });
  }, [transactions, range.start, range.end, selectedCategories, selectedTags, minAmount, maxAmount, keyword, currency, selectedCurrency]);

  const hasOtherCurrencies = useMemo(() => {
    return transactions.some((t) => {
      const txCurrency = (t.currency as Currency) || currency;
      return txCurrency !== selectedCurrency;
    });
  }, [transactions, currency, selectedCurrency]);

  const totals = useMemo(() => {
    return filteredTransactions.reduce(
      (acc, tx) => {
        if (tx.type === TransactionType.EXPENSE) acc.expense += tx.amount;
        if (tx.type === TransactionType.INCOME) acc.income += tx.amount;
        const cat = categories.find(c => c.id === tx.categoryId);
        const key = cat?.name || '未分類';
        acc.byCategory[key] = (acc.byCategory[key] || 0) + tx.amount * (tx.type === TransactionType.EXPENSE ? -1 : 1);
        return acc;
      },
      { income: 0, expense: 0, byCategory: {} as Record<string, number> }
    );
  }, [filteredTransactions, categories]);

  const pieData = useMemo(() => {
    const entries = Object.entries(totals.byCategory).filter(([, v]) => v !== 0);
    const sumAbs = entries.reduce((s, [, v]) => s + Math.abs(v), 0);
    return entries.map(([name, value]) => ({
      name,
      value: Math.abs(value),
      percent: sumAbs ? Math.round((Math.abs(value) / sumAbs) * 100) : 0,
      positive: value >= 0
    }));
  }, [totals.byCategory]);

  const palette = ['#22c55e', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#a16207', '#0ea5e9'];
  const pieGradient = useMemo(() => {
    if (!pieData.length) return '';
    let current = 0;
    return pieData.map((item, idx) => {
      const start = current;
      const slice = item.percent || 0;
      const end = current + slice;
      current = end;
      return `${palette[idx % palette.length]} ${start}% ${end}%`;
    }).join(', ');
  }, [pieData]);

  const applyPreset = (p: RangePreset) => {
    if (p === 'custom') return;
    if (p === 'all') {
      setRange({ start: '', end: '' });
      return;
    }
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);

    if (p === 'this-month') {
      start.setDate(1);
      end.setMonth(end.getMonth() + 1, 0);
    } else if (p === 'this-year') {
      start.setMonth(0, 1);
      end.setMonth(12, 0);
    }

    const toStr = (d: Date) => toLocalYMD(d);
    setRange({ start: toStr(start), end: toStr(end) });
  };

  useEffect(() => {
    applyPreset(preset);
  }, [preset]);

  const seriesByPeriod = useMemo(() => {
    const bucket = new Map<string, { income: number; expense: number }>();
    filteredTransactions.forEach(tx => {
      const d = new Date(tx.date);
      let key = '';
      if (periodView === 'month') {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      } else if (periodView === 'quarter') {
        const q = Math.floor(d.getMonth() / 3) + 1;
        key = `${d.getFullYear()}-Q${q}`;
      } else {
        key = `${d.getFullYear()}`;
      }
      const current = bucket.get(key) || { income: 0, expense: 0 };
      if (tx.type === TransactionType.EXPENSE) current.expense += tx.amount;
      else current.income += tx.amount;
      bucket.set(key, current);
    });
    const sortedKeys = Array.from(bucket.keys()).sort((a, b) => a > b ? 1 : -1);
    return sortedKeys.map(k => ({ key: k, ...bucket.get(k)! }));
  }, [filteredTransactions, periodView]);

  const expenseTop5 = useMemo(() => {
    const map = new Map<string, number>();
    filteredTransactions.forEach(tx => {
      if (tx.type !== TransactionType.EXPENSE) return;
      const name = categories.find(c => c.id === tx.categoryId)?.name || '未分類';
      map.set(name, (map.get(name) || 0) + tx.amount);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [filteredTransactions, categories]);

  const net = totals.income - totals.expense;

  const monthsCount = useMemo(() => {
    if (!filteredTransactions.length) return 1;
    const dates = filteredTransactions.map(t => new Date(t.date).getTime());
    const min = Math.min(...dates);
    const max = Math.max(...dates);
    const diffMonths = (new Date(max).getFullYear() - new Date(min).getFullYear()) * 12 +
      (new Date(max).getMonth() - new Date(min).getMonth()) + 1;
    return Math.max(1, diffMonths);
  }, [filteredTransactions]);

  const monthlyAvg = totals.expense / monthsCount;

  const thisMonthExpense = useMemo(() => {
    const now = new Date();
    return filteredTransactions.filter(tx => {
      const d = new Date(tx.date);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && tx.type === TransactionType.EXPENSE;
    }).reduce((s, t) => s + t.amount, 0);
  }, [filteredTransactions]);

  const thisMonthIncome = useMemo(() => {
    const now = new Date();
    return filteredTransactions.filter(tx => {
      const d = new Date(tx.date);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && tx.type === TransactionType.INCOME;
    }).reduce((s, t) => s + t.amount, 0);
  }, [filteredTransactions]);

  const lastMonthExpense = useMemo(() => {
    const now = new Date();
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return filteredTransactions.filter(tx => {
      const d = new Date(tx.date);
      return d.getFullYear() === prev.getFullYear() && d.getMonth() === prev.getMonth() && tx.type === TransactionType.EXPENSE;
    }).reduce((s, t) => s + t.amount, 0);
  }, [filteredTransactions]);

  const mom = lastMonthExpense ? ((thisMonthExpense - lastMonthExpense) / lastMonthExpense) * 100 : null;

  const currentYear = new Date().getFullYear();
  const thisYearExpense = filteredTransactions.filter(tx => {
    const d = new Date(tx.date);
    return d.getFullYear() === currentYear && tx.type === TransactionType.EXPENSE;
  }).reduce((s, t) => s + t.amount, 0);
  const lastYearExpense = filteredTransactions.filter(tx => {
    const d = new Date(tx.date);
    return d.getFullYear() === currentYear - 1 && tx.type === TransactionType.EXPENSE;
  }).reduce((s, t) => s + t.amount, 0);
  const yoy = lastYearExpense ? ((thisYearExpense - lastYearExpense) / lastYearExpense) * 100 : null;

  const budgetTotal = useMemo(() => budgets.reduce((sum, b) => sum + (b.limit || 0), 0), [budgets]);
  const budgetProgress = budgetTotal ? (thisMonthExpense / budgetTotal) * 100 : 0;

  const exportCSV = () => {
    const headers = ['Date', 'Type', 'Category', 'Amount', 'Note'];
    const rows = filteredTransactions.map(tx => {
      const cat = categories.find(c => c.id === tx.categoryId)?.name || '未分類';
      const date = toLocalYMD(new Date(tx.date));
      const safeNote = `"${(tx.note || '').replace(/"/g, '""')}"`;
      return [date, tx.type, cat, tx.amount, safeNote].join(',');
    });
    const content = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `report_${preset}_${toLocalYMD(new Date())}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background text-white pb-24">
      <div className="flex items-center justify-between px-4 py-3 sf-topbar sticky top-0 z-50">
        <button onClick={() => navigate(-1)} className="text-primary flex items-center gap-1">
          <ChevronLeft size={22} /> 返回
        </button>
        <h1 className="text-lg font-semibold flex items-center gap-2">
          <BarChart2 size={18} /> 報告統計
        </h1>
        <div className="w-12" />
      </div>

      <div className="p-4 space-y-4">
        {hasOtherCurrencies && (
          <div className="sf-panel p-3 text-xs text-gray-300">
            本頁報表以 {selectedCurrency} 計算，已排除其他幣別交易。
            {selectedCurrency !== currency && <span className="ml-2 text-gray-500">（預算設定以主貨幣 {currency} 為準）</span>}
          </div>
        )}

        <div className="sf-panel p-3 flex items-center justify-between">
          <span className="text-xs text-gray-400">幣別</span>
          <select
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value as Currency)}
            className="bg-transparent text-gray-200 focus:outline-none cursor-pointer text-sm"
          >
            {availableCurrencies.map((c) => (
              <option key={c} value={c} className="bg-surface">
                {c} ({getCurrencySymbol(c)})
              </option>
            ))}
          </select>
        </div>
        <div className="sf-panel p-3 flex items-center justify-between">
          <span className="text-xs text-gray-400">期間</span>
          <select
            value={preset}
            onChange={(e) => setPreset(e.target.value as RangePreset)}
            className="bg-transparent text-gray-200 focus:outline-none cursor-pointer text-sm"
          >
            <option value="this-month">本月</option>
            <option value="this-year">今年</option>
            <option value="all">全期間</option>
            <option value="custom">自訂</option>
          </select>
        </div>

        {/* Summary / KPI */}
        <div className="sf-panel p-4 space-y-3">
          <h3 className="text-sm text-gray-400">總覽</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <p className="text-xs text-gray-300">收入</p>
              <p className="text-xl font-bold text-emerald-400">{currencySymbol} {totals.income.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30">
              <p className="text-xs text-gray-300">支出</p>
              <p className="text-xl font-bold text-red-400">{currencySymbol} {totals.expense.toLocaleString()}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/30">
              <p className="text-xs text-gray-300">淨額</p>
              <p className={`text-xl font-bold ${net >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {net >= 0 ? '+' : '-'}{currencySymbol} {Math.abs(net).toLocaleString()}
              </p>
              <p className="text-[11px] text-gray-400 mt-1">月平均支出：{currencySymbol} {monthlyAvg.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30">
              <p className="text-xs text-gray-300">同比 / 環比</p>
              <p className="text-sm text-gray-200">
                MoM: {mom === null ? 'N/A' : `${mom >= 0 ? '+' : ''}${mom.toFixed(1)}%`}
              </p>
              <p className="text-sm text-gray-200">
                YoY: {yoy === null ? 'N/A' : `${yoy >= 0 ? '+' : ''}${yoy.toFixed(1)}%`}
              </p>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
            <p className="text-xs text-gray-300">月預算完成度</p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-200">
                {currencySymbol} {thisMonthExpense.toLocaleString()} / {currencySymbol} {budgetTotal.toLocaleString()}
              </span>
              <span className={`text-sm font-semibold ${budgetProgress >= 100 ? 'text-red-400' : 'text-emerald-400'}`}>
                {budgetProgress.toFixed(0)}%
              </span>
            </div>
            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden mt-2">
              <div
                className={`h-full ${budgetProgress >= 100 ? 'bg-red-500' : 'bg-emerald-400'}`}
                style={{ width: `${Math.min(150, budgetProgress)}%` }}
              />
            </div>
            {budgetProgress >= 100 && <p className="text-xs text-red-400 mt-1">已超過預算，請留意開支</p>}
          </div>
          <button
            onClick={() => setShowAdvanced(v => !v)}
            className="w-full mt-2 sf-control rounded-lg py-2 text-sm flex items-center justify-center gap-2 hover:bg-background/80 transition-colors"
          >
            {showAdvanced ? '收起進階報告' : '展開進階報告'}
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl sf-panel">
            <p className="text-xs text-gray-400">本月收入</p>
            <p className="text-xl font-bold text-emerald-400 mt-1">{currencySymbol} {thisMonthIncome.toLocaleString()}</p>
          </div>
          <div className="p-4 rounded-2xl sf-panel">
            <p className="text-xs text-gray-400">本月支出</p>
            <p className="text-xl font-bold text-red-400 mt-1">{currencySymbol} {thisMonthExpense.toLocaleString()}</p>
          </div>
          <div className="p-4 rounded-2xl sf-panel col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">本月淨額</p>
                <p className={`text-xl font-bold ${thisMonthIncome - thisMonthExpense >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {(thisMonthIncome - thisMonthExpense >= 0 ? '+' : '-')}{currencySymbol} {Math.abs(thisMonthIncome - thisMonthExpense).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">月預算進度</p>
                <p className={`text-sm font-semibold ${budgetProgress >= 100 ? 'text-red-400' : 'text-emerald-400'}`}>{budgetProgress.toFixed(0)}%</p>
              </div>
            </div>
            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden mt-2">
              <div className={`h-full ${budgetProgress >= 100 ? 'bg-red-500' : 'bg-emerald-400'}`} style={{ width: `${Math.min(150, budgetProgress)}%` }} />
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              {currencySymbol} {thisMonthExpense.toLocaleString()} / {currencySymbol} {budgetTotal.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Category breakdown */}
        <div className="sf-panel p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm text-gray-400">分類彙總</h3>
            <div className="flex gap-2 text-xs">
              <button
                onClick={() => setCategoryChartMode('bar')}
                className={`px-3 py-1 rounded-full border ${categoryChartMode === 'bar' ? 'bg-primary text-white border-primary' : 'border-gray-700 text-gray-200'}`}
              >
                <BarChart3 size={14} className="inline-block mr-1" /> 長條
              </button>
              <button
                onClick={() => setCategoryChartMode('pie')}
                className={`px-3 py-1 rounded-full border ${categoryChartMode === 'pie' ? 'bg-primary text-white border-primary' : 'border-gray-700 text-gray-200'}`}
              >
                <PieChart size={14} className="inline-block mr-1" /> 餅圖
              </button>
            </div>
          </div>
          <div className="space-y-2">
            {Object.entries(totals.byCategory).length === 0 && (
              <div className="text-center text-gray-500 text-sm py-6">尚無資料</div>
            )}
            {categoryChartMode === 'bar' && Object.entries(totals.byCategory).map(([catName, value]) => {
              const totalAbs = Math.abs(value);
              const scale = Math.min(100, totalAbs / Math.max(1, Math.abs(totals.expense) + totals.income) * 100);
              return (
                <div key={catName} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{catName}</span>
                    <span className={`text-sm font-semibold ${value >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                      {currencySymbol} {totalAbs.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-gray-800 overflow-hidden">
                    <div
                      className={`h-full ${value >= 0 ? 'bg-emerald-400' : 'bg-red-400'}`}
                      style={{ width: `${scale}%` }}
                    />
                  </div>
                </div>
              );
            })}

            {categoryChartMode === 'pie' && (
              <div className="space-y-4">
                {pieData.length === 0 && <div className="text-center text-gray-500 text-sm py-4">無資料可顯示</div>}
                {pieData.length > 0 && (
                  <div className="flex items-center gap-6">
                    <div
                      className="w-40 h-40 rounded-full border border-gray-800 shadow-inner"
                      style={{ background: `conic-gradient(${pieGradient})` }}
                    />
                    <div className="space-y-2">
                      {pieData.map((item, idx) => (
                        <div key={item.name} className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2">
                            <span className="inline-block w-3 h-3 rounded-full" style={{ background: palette[idx % palette.length] }}></span>
                            <span className="text-sm">{item.name}</span>
                          </div>
                          <div className="text-sm text-gray-200">{item.percent}%</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {showAdvanced && (
          <>
            <div className="sf-panel p-4 space-y-3">
              <h3 className="text-sm text-gray-400">篩選</h3>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="關鍵字（備註/標籤）"
                    className="flex-1 sf-control text-white rounded-lg px-3 py-2 text-sm focus:outline-none"
                  />
                  <input
                    type="number"
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                    placeholder="最小金額"
                    className="w-28 sf-control text-white rounded-lg px-3 py-2 text-sm focus:outline-none"
                  />
                  <input
                    type="number"
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                    placeholder="最大金額"
                    className="w-28 sf-control text-white rounded-lg px-3 py-2 text-sm focus:outline-none"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => {
                    const active = selectedCategories.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategories(prev => prev.includes(cat.id) ? prev.filter(c => c !== cat.id) : [...prev, cat.id])}
                        className={`px-3 py-1 rounded-full text-xs border ${active ? 'bg-primary text-white border-primary' : 'border-gray-700 text-gray-300 hover:border-gray-500'}`}
                      >
                        {cat.name}
                      </button>
                    );
                  })}
                </div>

                {allTags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {allTags.map(tag => {
                      const active = selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          onClick={() => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                          className={`px-3 py-1 rounded-full text-xs border ${active ? 'bg-emerald-500 text-white border-emerald-500' : 'border-gray-700 text-gray-300 hover:border-gray-500'}`}
                        >
                          #{tag}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {preset === 'custom' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">開始日期</span>
                    <input
                      type="date"
                      value={range.start}
                      onChange={(e) => setRange(prev => ({ ...prev, start: e.target.value }))}
                      className="sf-control text-white rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">結束日期</span>
                    <input
                      type="date"
                      value={range.end}
                      onChange={(e) => setRange(prev => ({ ...prev, end: e.target.value }))}
                      className="sf-control text-white rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="sf-panel p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm text-gray-400">趨勢</h3>
                <div className="flex gap-2 text-xs">
                  {(['month', 'quarter', 'year'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setPeriodView(p)}
                      className={`px-3 py-1 rounded-full border ${periodView === p ? 'bg-primary text-white border-primary' : 'border-gray-700 text-gray-200'}`}
                    >
                      {p === 'month' ? '月' : p === 'quarter' ? '季' : '年'}
                    </button>
                  ))}
                  <button
                    onClick={() => setTrendChartMode('bar')}
                    className={`px-3 py-1 rounded-full border ${trendChartMode === 'bar' ? 'bg-primary text-white border-primary' : 'border-gray-700 text-gray-200'}`}
                  >
                    <BarChart3 size={14} className="inline-block mr-1" /> 長條
                  </button>
                  <button
                    onClick={() => setTrendChartMode('line')}
                    className={`px-3 py-1 rounded-full border ${trendChartMode === 'line' ? 'bg-primary text-white border-primary' : 'border-gray-700 text-gray-200'}`}
                  >
                    <LineChart size={14} className="inline-block mr-1" /> 折線
                  </button>
                </div>
              </div>
              {seriesByPeriod.length === 0 && <div className="text-center text-gray-500 text-sm py-6">尚無資料</div>}
              {seriesByPeriod.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-4 text-xs text-gray-300">
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>收入</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span>支出</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-400 inline-block"></span>淨額</span>
                  </div>
                  {seriesByPeriod.map(item => {
                    const netVal = item.income - item.expense;
                    const maxVal = Math.max(...seriesByPeriod.map(i => Math.max(i.income, i.expense, Math.abs(i.income - i.expense))), 1);
                    const incW = Math.min(100, (item.income / maxVal) * 100);
                    const expW = Math.min(100, (item.expense / maxVal) * 100);
                    const netW = Math.min(100, (Math.abs(netVal) / maxVal) * 100);
                    return (
                      <div key={item.key} className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-gray-300">
                          <span>{item.key}</span>
                          <span>淨額 {currencySymbol} {(netVal).toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden flex">
                          <div className="h-full bg-emerald-500" style={{ width: `${incW}%` }} title="收入"></div>
                          <div className="h-full bg-red-500" style={{ width: `${expW}%` }} title="支出"></div>
                        </div>
                        <div className="w-full bg-gray-900 h-1 rounded-full overflow-hidden">
                          <div className={`h-full ${netVal >= 0 ? 'bg-emerald-400' : 'bg-red-400'}`} style={{ width: `${netW}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              onClick={exportCSV}
              className="w-full sf-control rounded-lg py-2 text-sm flex items-center justify-center gap-2 hover:bg-background/80 transition-colors"
            >
              <Download size={16} /> 匯出目前篩選結果 (CSV)
            </button>
          </>
        )}

        {/* Top 5 */}
        <div className="sf-panel p-4 space-y-3">
          <h3 className="text-sm text-gray-400">支出 Top 5 分類</h3>
          {expenseTop5.length === 0 && <div className="text-center text-gray-500 text-sm py-6">尚無資料</div>}
          {expenseTop5.length > 0 && (
            <div className="space-y-2">
              {expenseTop5.map(([name, value], idx) => {
                const maxVal = expenseTop5[0][1] || 1;
                const scale = Math.min(100, (value / maxVal) * 100);
                return (
                  <div key={name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">#{idx + 1}</span>
                        <span>{name}</span>
                      </div>
                      <span className="font-semibold text-red-300">{currencySymbol} {value.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-gray-800 overflow-hidden">
                      <div className="h-full bg-red-500" style={{ width: `${scale}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Reports;
