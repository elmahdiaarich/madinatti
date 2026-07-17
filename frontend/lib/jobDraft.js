const DRAFT_PREFIX = 'job_draft_';
const DRAFT_MAX_AGE_MS = 3 * 24 * 60 * 60 * 1000; // 3 jours

const getKey = (userId) => `${DRAFT_PREFIX}${userId || 'anonymous'}`;

export const saveJobDraft = (userId, form, step) => {
  try {
    const payload = { form, step, savedAt: Date.now() };
    localStorage.setItem(getKey(userId), JSON.stringify(payload));
  } catch (e) {
    // Stockage indisponible (navigation privée, quota dépassé...) — on ignore silencieusement
  }
};

export const loadJobDraft = (userId) => {
  try {
    const raw = localStorage.getItem(getKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.savedAt || Date.now() - parsed.savedAt > DRAFT_MAX_AGE_MS) {
      localStorage.removeItem(getKey(userId));
      return null;
    }
    return parsed;
  } catch (e) {
    return null;
  }
};

export const clearJobDraft = (userId) => {
  try {
    localStorage.removeItem(getKey(userId));
  } catch (e) {}
};

export const hasMeaningfulContent = (form) => {
  return !!(
    form.title?.trim() ||
    form.categorySlug ||
    form.city ||
    form.description?.trim() ||
    form.missions?.some((m) => m.trim())
  );
};

export const formatRelativeTime = (timestamp) => {
  const diffMs = Date.now() - timestamp;
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `il y a ${diffH} h`;
  const diffDay = Math.round(diffH / 24);
  return `il y a ${diffDay} j`;
};