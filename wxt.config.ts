import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Headerleaf',
    description: 'Switch grouped request headers without leaving your tab.',
    version: '0.1.0',
    permissions: ['storage', 'declarativeNetRequestWithHostAccess'],
    host_permissions: ['<all_urls>'],
    action: {
      default_title: 'Headerleaf',
    },
  },
});
