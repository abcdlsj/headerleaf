import {
  STORAGE_KEY,
  getActiveHeaders,
  loadState,
  syncDynamicRules,
  type HeaderleafState,
} from '@/lib/headerleaf';

const BADGE_COLOR = '#4967e8';
const BADGE_ERROR_COLOR = '#d9634f';
const BADGE_TEXT_COLOR = '#ffffff';

const badgeText = (count: number) => {
  if (count <= 0) return '';
  return count > 99 ? '99+' : String(count);
};

async function updateBadge(state: HeaderleafState | null, ok = true): Promise<void> {
  const count = state ? getActiveHeaders(state).length : 0;
  const text = ok ? badgeText(count) : '!';

  await Promise.all([
    browser.action.setBadgeText({ text }),
    browser.action.setBadgeBackgroundColor({
      color: ok ? BADGE_COLOR : BADGE_ERROR_COLOR,
    }),
    browser.action.setBadgeTextColor({ color: BADGE_TEXT_COLOR }),
    browser.action.setTitle({
      title: ok && count > 0
        ? `Headerleaf — ${count} active header${count === 1 ? '' : 's'}`
        : ok
          ? 'Headerleaf'
          : 'Headerleaf — sync error',
    }),
  ]).catch((error) => {
    console.warn('[Headerleaf] Could not update the toolbar badge', error);
  });
}

export default defineBackground(() => {
  let applyQueue: Promise<void> = Promise.resolve();

  const applySavedHeaders = () => {
    const task = applyQueue.then(async () => {
      const state = await loadState();
      await syncDynamicRules(state);
      await updateBadge(state);
    });
    applyQueue = task.catch(async (error) => {
      console.error('[Headerleaf] Failed to apply request headers', error);
      await updateBadge(null, false);
    });
    return task;
  };

  browser.runtime.onInstalled.addListener(() => void applySavedHeaders());
  browser.runtime.onStartup.addListener(() => void applySavedHeaders());
  browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes[STORAGE_KEY]) {
      void applySavedHeaders();
    }
  });

  browser.runtime.onMessage.addListener((message) => {
    if (message?.type !== 'headerleaf:sync') return;
    return applySavedHeaders()
      .then(() => ({ ok: true }))
      .catch((error) => ({ ok: false, error: String(error) }));
  });

  void applySavedHeaders();
});
