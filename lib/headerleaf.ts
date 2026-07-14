import { browser } from 'wxt/browser';

export interface HeaderEntry {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export interface HeaderGroup {
  id: string;
  name: string;
  color: string;
  headers: HeaderEntry[];
}

export interface HeaderleafState {
  groups: HeaderGroup[];
  activeGroupId: string;
}

export const STORAGE_KEY = 'headerleaf-state';
export const RULE_ID = 8181;

export const GROUP_COLORS = [
  '#FF8B6A',
  '#F6C95F',
  '#75C9A6',
  '#73A9E6',
  '#B695D8',
  '#E58DA9',
];

const makeId = () => crypto.randomUUID();

export const createHeader = (key = '', value = ''): HeaderEntry => ({
  id: makeId(),
  key,
  value,
  enabled: true,
});

export const createDefaultState = (): HeaderleafState => {
  const localId = makeId();
  const stagingId = makeId();

  return {
    activeGroupId: localId,
    groups: [
      {
        id: localId,
        name: 'Local API',
        color: GROUP_COLORS[0],
        headers: [
          createHeader('X-Debug-Mode', 'true'),
          { ...createHeader('Authorization', ''), enabled: false },
        ],
      },
      {
        id: stagingId,
        name: 'Staging',
        color: GROUP_COLORS[2],
        headers: [createHeader('X-Environment', 'staging')],
      },
    ],
  };
};

export async function loadState(): Promise<HeaderleafState> {
  const result = await browser.storage.local.get(STORAGE_KEY);
  const saved = result[STORAGE_KEY] as HeaderleafState | undefined;

  if (!saved?.groups?.length) {
    const initial = createDefaultState();
    await saveState(initial);
    return initial;
  }

  return saved;
}

export async function saveState(state: HeaderleafState): Promise<void> {
  await browser.storage.local.set({ [STORAGE_KEY]: state });
}

export function getActiveHeaders(state: HeaderleafState): HeaderEntry[] {
  const group = state.groups.find((item) => item.id === state.activeGroupId);
  if (!group) return [];

  const byKey = new Map<string, HeaderEntry>();
  group.headers.forEach((header) => {
    const key = header.key.trim();
    if (header.enabled && key) byKey.set(key.toLowerCase(), { ...header, key });
  });
  return [...byKey.values()];
}

export async function syncDynamicRules(state: HeaderleafState): Promise<void> {
  const requestHeaders = getActiveHeaders(state).map((header) => ({
    header: header.key,
    operation: 'set' as const,
    value: header.value,
  }));

  await browser.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [RULE_ID],
    addRules: requestHeaders.length
      ? [
          {
            id: RULE_ID,
            priority: 1,
            action: {
              type: 'modifyHeaders',
              requestHeaders,
            },
            condition: {
              urlFilter: '*',
            },
          },
        ]
      : [],
  });
}
