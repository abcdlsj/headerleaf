import { STORAGE_KEY, loadState, syncDynamicRules } from '@/lib/headerleaf';

export default defineBackground(() => {
  const applySavedHeaders = async () => {
    try {
      await syncDynamicRules(await loadState());
    } catch (error) {
      console.error('[Headerleaf] Failed to apply request headers', error);
    }
  };

  browser.runtime.onInstalled.addListener(applySavedHeaders);
  browser.runtime.onStartup.addListener(applySavedHeaders);
  browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes[STORAGE_KEY]) void applySavedHeaders();
  });

  void applySavedHeaders();
});
