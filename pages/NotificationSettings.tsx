import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CalendarCheck } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { getStatementAndDueForMonth } from '../utils/creditCardSchedule';

const NotificationSettings: React.FC = () => {
  const navigate = useNavigate();
  const { creditCards } = useData();

  const [enabled, setEnabled] = useState(true);
  const [time, setTime] = useState("20:00");

  const [ccEnabled, setCcEnabled] = useState(true);
  const [ccAdvanceDays, setCcAdvanceDays] = useState(0); // 0 = on the day

  // Format date for ICS (YYYYMMDDTHHMMSS)
  const formatICSDate = (date: Date) => {
    // Keep UTC format; iOS Calendar handles Z-formatted timestamps fine.
    return date.toISOString().replace(/-|:|\.\d+/g, '');
  };

  // Build credit card reminders for the current month (and next month if needed)
  const creditCardEvents = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m0 = now.getMonth();

    const makeEvent = (summary: string, ymd: string) => {
      const [hh, mm] = time.split(':').map(Number);
      const dt = new Date(ymd + 'T00:00:00');
      dt.setHours(hh, mm, 0, 0);
      // advanceDays: subtract days
      if (ccAdvanceDays > 0) dt.setDate(dt.getDate() - ccAdvanceDays);
      return {
        uid: `${Date.now()}-${Math.random().toString(36).slice(2)}@smartfinance.app`,
        dt,
        summary,
      };
    };

    const events: { uid: string; dt: Date; summary: string }[] = [];

    for (const c of creditCards || []) {
      const { statementDate, dueDate } = getStatementAndDueForMonth(y, m0, c);
      if (c.remindStatement !== false && statementDate) {
        events.push(makeEvent(`信用卡截數提醒：${c.name}`, statementDate));
      }
      if (c.remindDue !== false && dueDate) {
        events.push(makeEvent(`信用卡繳費提醒：${c.name}`, dueDate));
      }
    }

    // If today is near end of month and user wants reminders, also include next month (helps planning)
    if (now.getDate() >= 25) {
      const next = new Date(y, m0 + 1, 1);
      const y2 = next.getFullYear();
      const m2 = next.getMonth();
      for (const c of creditCards || []) {
        const { statementDate, dueDate } = getStatementAndDueForMonth(y2, m2, c);
        if (c.remindStatement !== false && statementDate) {
          events.push(makeEvent(`信用卡截數提醒：${c.name}`, statementDate));
        }
        if (c.remindDue !== false && dueDate) {
          events.push(makeEvent(`信用卡繳費提醒：${c.name}`, dueDate));
        }
      }
    }

    // De-dupe by summary+date
    const seen = new Set<string>();
    return events
      .filter(e => {
        const key = `${e.summary}|${e.dt.toISOString()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => a.dt.getTime() - b.dt.getTime());
  }, [creditCards, time, ccAdvanceDays]);

  // Function to generate and download ICS file for iOS Calendar
  const addToCalendar = () => {
    // Construct the event start date (today at the selected time)
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    now.setHours(hours, minutes, 0);

    const events: string[] = [];

    // Daily bookkeeping reminder (optional)
    if (enabled) {
      events.push(
        [
          'BEGIN:VEVENT',
          `UID:${Date.now()}@smartfinance.app`,
          `DTSTAMP:${formatICSDate(new Date())}`,
          `DTSTART:${formatICSDate(now)}`,
          'RRULE:FREQ=DAILY',
          'SUMMARY:SmartFinance 記帳提醒',
          'DESCRIPTION:記得記錄今天的收支喔！保持良好的理財習慣。',
          'BEGIN:VALARM',
          'TRIGGER:-PT5M',
          'ACTION:DISPLAY',
          'DESCRIPTION:Reminder',
          'END:VALARM',
          'END:VEVENT'
        ].join('\r\n')
      );
    }

    // Credit card reminders (non-recurring events for this month/next month)
    if (ccEnabled && creditCardEvents.length) {
      for (const e of creditCardEvents) {
        events.push(
          [
            'BEGIN:VEVENT',
            `UID:${e.uid}`,
            `DTSTAMP:${formatICSDate(new Date())}`,
            `DTSTART:${formatICSDate(e.dt)}`,
            'SUMMARY:' + e.summary,
            'BEGIN:VALARM',
            'TRIGGER:-PT5M',
            'ACTION:DISPLAY',
            'DESCRIPTION:Reminder',
            'END:VALARM',
            'END:VEVENT'
          ].join('\r\n')
        );
      }
    }

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//SmartFinance//App//EN',
      ...events,
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'smartfinance-reminders.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-background pt-safe-top">
      <div className="px-4 py-3 flex justify-between items-center sf-topbar sticky top-0 z-50">
        <button onClick={() => navigate(-1)} className="flex items-center text-primary">
          <ChevronLeft size={24} />
          <span>設定</span>
        </button>
        <h2 className="text-lg font-semibold">通知設定</h2>
        <div className="w-16"></div>
      </div>

      <div className="p-4 mt-2 space-y-6">
         <div>
            <p className="text-gray-500 text-xs mb-2 ml-4">記帳提醒</p>
            <div className="sf-panel overflow-hidden divide-y sf-divider">
                {/* Toggle Row */}
                <div className="flex justify-between items-center p-4">
                  <span className="text-white text-base">開啟記帳提醒</span>
                  <div 
                    onClick={() => setEnabled(!enabled)}
                    className={`w-12 h-7 rounded-full relative cursor-pointer transition-colors ${enabled ? 'bg-green-500' : 'bg-gray-600'}`}
                  >
                      <div className={`w-6 h-6 bg-white rounded-full absolute top-0.5 shadow-md transition-all ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`}></div>
                  </div>
                </div>

                {/* Detail Rows */}
                {enabled && (
                  <>
                    <div className="flex justify-between items-center p-4 active:bg-gray-700/50 transition-colors cursor-pointer">
                      <span className="text-white">提醒頻率</span>
                      <div className="flex items-center gap-2">
                          <span className="text-gray-400">每日</span>
                          <ChevronRight size={16} className="text-gray-500" />
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-4 active:bg-gray-700/50 transition-colors cursor-pointer">
                      <span className="text-white">提醒時間</span>
                      <div className="flex items-center gap-2">
                          <input 
                            type="time" 
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            className="bg-transparent text-gray-400 focus:outline-none text-right"
                          />
                          <ChevronRight size={16} className="text-gray-500" />
                      </div>
                    </div>
                  </>
                )}
            </div>
         </div>

         <div>
            <p className="text-gray-500 text-xs mb-2 ml-4">信用卡提醒</p>
            <div className="sf-panel overflow-hidden divide-y sf-divider">
                <div className="flex justify-between items-center p-4">
                  <span className="text-white text-base">開啟信用卡提醒</span>
                  <div 
                    onClick={() => setCcEnabled(!ccEnabled)}
                    className={`w-12 h-7 rounded-full relative cursor-pointer transition-colors ${ccEnabled ? 'bg-green-500' : 'bg-gray-600'}`}
                  >
                      <div className={`w-6 h-6 bg-white rounded-full absolute top-0.5 shadow-md transition-all ${ccEnabled ? 'translate-x-5' : 'translate-x-0.5'}`}></div>
                  </div>
                </div>

                {ccEnabled && (
                  <>
                    <div className="flex justify-between items-center p-4 active:bg-gray-700/50 transition-colors">
                      <span className="text-white">提醒提前</span>
                      <select
                        value={ccAdvanceDays}
                        onChange={(e) => setCcAdvanceDays(Number(e.target.value))}
                        className="bg-transparent text-right text-gray-400 focus:outline-none cursor-pointer"
                      >
                        <option value={0}>當日</option>
                        <option value={1}>提前 1 日</option>
                        <option value={2}>提前 2 日</option>
                        <option value={3}>提前 3 日</option>
                        <option value={5}>提前 5 日</option>
                        <option value={7}>提前 7 日</option>
                      </select>
                    </div>
                    <div className="bg-background px-4 py-3 space-y-2">
                      <p className="text-xs text-gray-500">本月 / 下月（如接近月底）將加入行事曆嘅提醒</p>
                      {creditCardEvents.length ? (
                        <div className="space-y-1">
                          {creditCardEvents.slice(0, 6).map((e) => (
                            <div key={e.uid} className="flex items-center justify-between text-xs text-gray-200">
                              <span className="truncate">{e.summary}</span>
                              <span className="text-primary">{e.dt.toLocaleDateString()}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500">未有可用提醒（請先喺「信用卡管理」設定截數日/繳費日）</p>
                      )}
                    </div>
                  </>
                )}
            </div>
         </div>

         {enabled && (
           <div className="animate-fade-in-up">
              <button 
                onClick={addToCalendar}
                className="w-full sf-panel border border-primary/50 text-primary py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/10 active:scale-[0.98] transition-all"
              >
                <CalendarCheck size={20} />
                加入 iPhone 行事曆
              </button>
              <p className="text-gray-500 text-xs mt-3 ml-4 leading-relaxed">
                點擊上方按鈕將下載日曆檔案 (.ics)。<br/>
                在 iPhone 上開啟後，請選擇「加入行事曆」即可在每天指定時間收到系統通知。
              </p>
            </div>
         )}
      </div>
    </div>
  );
};

export default NotificationSettings;
