import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ExternalLink, Trash2 } from 'lucide-react';

const DEFAULT_URL = 'https://www.swipewhich.com';
const NOTES_KEY = 'sf_rewards_notes_v1';

const CreditCardRewards: React.FC = () => {
  const navigate = useNavigate();

  const initialNotes = useMemo(() => {
    try {
      return localStorage.getItem(NOTES_KEY) || '';
    } catch {
      return '';
    }
  }, []);

  const [notes, setNotes] = useState<string>(initialNotes);

  useEffect(() => {
    try {
      localStorage.setItem(NOTES_KEY, notes);
    } catch {
      // ignore
    }
  }, [notes]);

  return (
    <div className="min-h-screen bg-background pt-safe-top pb-24">
      <div className="px-4 py-3 flex justify-between items-center sf-topbar sticky top-0 z-50">
        <button onClick={() => navigate(-1)} className="flex items-center text-primary">
          <ChevronLeft size={24} />
          <span>設定</span>
        </button>
        <h2 className="text-lg font-semibold">信用卡回贈</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.open(DEFAULT_URL, '_blank', 'noopener,noreferrer')}
            className="text-gray-200 sf-control rounded-xl px-3 py-2 flex items-center gap-2"
            title="打開 SwipeWhich"
          >
            <ExternalLink size={16} />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="sf-panel rounded-xl p-3 text-xs text-gray-500">
          SwipeWhich 不支援被內嵌（iframe 會被網站安全策略阻擋），所以改用「外開」方式。
          你可以喺下面記低你查到嘅回贈結果；內容會自動儲存，之後再入嚟都會保留。
        </div>

        <div className="sf-panel rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-200 font-semibold">我的回贈結果 / 筆記</div>
            <button
              type="button"
              onClick={() => {
                const ok = window.confirm('確定要清除所有回贈筆記？');
                if (!ok) return;
                setNotes('');
              }}
              className="text-xs text-red-300 flex items-center gap-2"
              title="清除"
            >
              <Trash2 size={14} />
              清除
            </button>
          </div>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={12}
            placeholder="例：\n- HSBC EveryMile：餐飲 4%（上限…）\n- Standard Chartered Simply Cash：本地 1.5%…\n\n（支援自由格式；會自動保存）"
            className="w-full sf-control rounded-xl p-3 text-gray-100 placeholder-gray-500 resize-none"
          />

          <div className="text-xs text-gray-500">
            已自動保存到本機（localStorage）。
          </div>
        </div>

        <button
          type="button"
          onClick={() => window.open(DEFAULT_URL, '_blank', 'noopener,noreferrer')}
          className="w-full sf-control rounded-xl p-3 text-gray-200 flex items-center justify-center gap-2"
        >
          <ExternalLink size={16} />
          打開 SwipeWhich
        </button>
      </div>
    </div>
  );
};

export default CreditCardRewards;
