import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ExternalLink, RefreshCw } from 'lucide-react';

const STORAGE_KEY = 'sf_rewards_last_url';
const DEFAULT_URL = 'https://www.swipewhich.com';

const CreditCardRewards: React.FC = () => {
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const initialUrl = useMemo(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || DEFAULT_URL;
    } catch {
      return DEFAULT_URL;
    }
  }, []);

  const [url] = useState<string>(initialUrl);
  const [reloadKey, setReloadKey] = useState<number>(0);
  const [embedError, setEmbedError] = useState<string | null>(null);

  // Best-effort: remember last opened base URL.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, url);
    } catch {
      // ignore
    }
  }, [url]);

  // Some sites block iframes (CSP / X-Frame-Options). We can't reliably detect all cases,
  // but we can show a fallback message if the iframe doesn't load after a short delay.
  useEffect(() => {
    setEmbedError(null);
    const t = setTimeout(() => {
      try {
        const el = iframeRef.current;
        // If blocked, many browsers keep it blank; we show fallback hint.
        if (el && !el.contentWindow) {
          setEmbedError('此網站可能不支援內嵌（iframe 被 CSP / X-Frame-Options 阻擋）。');
        }
      } catch {
        setEmbedError('此網站可能不支援內嵌（iframe 被阻擋）。');
      }
    }, 2500);
    return () => clearTimeout(t);
  }, [reloadKey]);

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
            onClick={() => setReloadKey((k) => k + 1)}
            className="text-gray-200 sf-control rounded-xl px-3 py-2 flex items-center gap-2"
            title="重新載入"
          >
            <RefreshCw size={16} />
          </button>
          <button
            type="button"
            onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
            className="text-gray-200 sf-control rounded-xl px-3 py-2 flex items-center gap-2"
            title="用瀏覽器打開"
          >
            <ExternalLink size={16} />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="text-xs text-gray-500">
          來源：swipewhich.com（內嵌顯示；如被網站安全策略阻擋，可用右上角「外開」）。
        </div>

        {embedError && (
          <div className="sf-panel rounded-xl p-3 text-sm text-yellow-300">
            {embedError}
            <div className="text-xs text-gray-400 mt-1">建議：按右上角「外開」。</div>
          </div>
        )}

        <div className="sf-panel rounded-xl overflow-hidden" style={{ height: '70vh' }}>
          <iframe
            key={reloadKey}
            ref={iframeRef}
            src={url}
            title="SwipeWhich"
            className="w-full h-full"
            sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-downloads"
          />
        </div>
      </div>
    </div>
  );
};

export default CreditCardRewards;
