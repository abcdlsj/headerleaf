import { STORAGE_KEY, loadState, syncDynamicRules } from '@/lib/headerleaf';

export default defineBackground(() => {
  let applyQueue: Promise<void> = Promise.resolve();

  const applySavedHeaders = () => {
    const task = applyQueue.then(async () => {
      await syncDynamicRules(await loadState());
    });
    applyQueue = task.catch((error) => {
      console.error('[Headerleaf] Failed to apply request headers', error);
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
