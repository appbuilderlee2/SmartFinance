import { readJson, writeJson } from './storage';

const TAG_HISTORY_KEY = 'sf.tagHistory.v1';
const MAX_TAGS_DEFAULT = 50;

type TagHistory = {
  // MRU order: index 0 = most recent
  mru: string[];
};

function normalizeTag(tag: string): string {
  // Spec: 原樣保存；只做 trim
  return tag.trim();
}

export function loadTagHistory(): string[] {
  const data = readJson<TagHistory>(TAG_HISTORY_KEY);
  if (!data || !Array.isArray(data.mru)) return [];

  // Defensive: ensure strings + trimmed + unique (keep first occurrence)
  const out: string[] = [];
  for (const t of data.mru) {
    if (typeof t !== 'string') continue;
    const nt = normalizeTag(t);
    if (!nt) continue;
    if (!out.includes(nt)) out.push(nt);
    if (out.length >= MAX_TAGS_DEFAULT) break;
  }
  return out;
}

export function rememberTags(tags: string[], maxTags = MAX_TAGS_DEFAULT): void {
  if (!Array.isArray(tags) || tags.length === 0) return;

  const prev = loadTagHistory();
  const next: string[] = [...prev];

  // For MRU, process in order given and move each to front.
  for (const raw of tags) {
    const t = normalizeTag(raw);
    if (!t) continue;

    const idx = next.indexOf(t);
    if (idx !== -1) next.splice(idx, 1);
    next.unshift(t);
  }

  const trimmed = next.slice(0, Math.max(1, maxTags));
  writeJson(TAG_HISTORY_KEY, { mru: trimmed } satisfies TagHistory);
}
