import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { browser } from 'wxt/browser';
import {
  GROUP_COLORS,
  createHeader,
  getActiveHeaders,
  loadState,
  saveState,
  type HeaderGroup,
  type HeaderleafState,
} from '@/lib/headerleaf';
import './App.css';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5" />
  </svg>
);

const LeafMark = () => (
  <svg className="leaf-mark" viewBox="0 0 42 42" aria-hidden="true">
    <rect x="13" y="7" width="23" height="27" rx="5" className="leaf-back" />
    <rect x="6" y="11" width="25" height="27" rx="5" className="leaf-page" />
    <path d="M13 20h12M13 26h9" className="leaf-lines" />
  </svg>
);

function App() {
  const [state, setState] = useState<HeaderleafState | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const confirmTimer = useRef<number | null>(null);

  useEffect(() => {
    loadState()
      .then((saved) => setState(saved))
      .catch(() => setSaveStatus('error'));
    return () => {
      if (confirmTimer.current !== null) window.clearTimeout(confirmTimer.current);
    };
  }, []);

  const activeGroup = useMemo(
    () => state?.groups.find((group) => group.id === state.activeGroupId) ?? state?.groups[0] ?? null,
    [state],
  );
  const activeCount = state ? getActiveHeaders(state).length : 0;

  const commit = (next: HeaderleafState) => {
    if (confirmTimer.current !== null) window.clearTimeout(confirmTimer.current);
    setConfirmingDelete(false);
    setState(next);
    setSaveStatus('saving');
    void saveState(next)
      .then(async () => {
        const response = await browser.runtime.sendMessage({ type: 'headerleaf:sync' });
        if (response?.ok === false) throw new Error(response.error || 'Sync failed');
      })
      .then(() => {
        setSaveStatus('saved');
        window.setTimeout(() => setSaveStatus('idle'), 1100);
      })
      .catch(() => setSaveStatus('error'));
  };

  const countActiveHeaders = (group: HeaderGroup) =>
    group.headers.filter((header) => header.enabled && header.key.trim()).length;

  const updateActiveGroup = (
    update: (group: NonNullable<typeof activeGroup>) => NonNullable<typeof activeGroup>,
  ) => {
    if (!state || !activeGroup) return;
    commit({
      ...state,
      groups: state.groups.map((group) =>
        group.id === activeGroup.id ? update(group) : group,
      ),
    });
  };

  const addGroup = () => {
    if (!state) return;
    const id = crypto.randomUUID();
    const newGroup = {
      id,
      name: `Profile ${state.groups.length + 1}`,
      color: GROUP_COLORS[state.groups.length % GROUP_COLORS.length],
      headers: [createHeader()],
    };
    commit({ groups: [...state.groups, newGroup], activeGroupId: id });
  };

  const deleteActiveGroup = () => {
    if (!state || state.groups.length === 1 || !activeGroup) return;
    const groups = state.groups
      .filter((group) => group.id !== activeGroup.id)
      .map((group, index) =>
        /^Profile \d+$/.test(group.name.trim())
          ? { ...group, name: `Profile ${index + 1}` }
          : group,
      );
    commit({ groups, activeGroupId: groups[0].id });
  };

  const handleDeleteClick = () => {
    if (!state || state.groups.length === 1) return;

    if (confirmingDelete) {
      if (confirmTimer.current !== null) window.clearTimeout(confirmTimer.current);
      setConfirmingDelete(false);
      deleteActiveGroup();
      return;
    }

    setConfirmingDelete(true);
    confirmTimer.current = window.setTimeout(() => setConfirmingDelete(false), 2600);
  };

  const addHeader = () => {
    updateActiveGroup((group) => ({
      ...group,
      headers: [...group.headers, createHeader()],
    }));
  };

  const updateHeader = (
    id: string,
    patch: Partial<{ key: string; value: string; enabled: boolean }>,
  ) => {
    updateActiveGroup((group) => ({
      ...group,
      headers: group.headers.map((header) =>
        header.id === id ? { ...header, ...patch } : header,
      ),
    }));
  };

  const deleteHeader = (id: string) => {
    updateActiveGroup((group) => ({
      ...group,
      headers: group.headers.filter((header) => header.id !== id),
    }));
  };

  if (!state || !activeGroup) {
    return (
      <div className="loading-shell">
        <LeafMark />
        <span>{saveStatus === 'error' ? 'Could not open Headerleaf' : 'Loading…'}</span>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className="group-rail">
        <div className="brand">
          <div className="brand-wordmark" aria-label="Headerleaf">
            <span>header</span>
            <strong>leaf<span>.</span></strong>
          </div>
        </div>

        <nav className="group-list" aria-label="Profiles">
          {state.groups.map((group) => {
            const count = countActiveHeaders(group);
            return (
              <button
                className={`group-tab ${group.id === state.activeGroupId ? 'is-active' : ''}`}
                key={group.id}
                onClick={() => commit({ ...state, activeGroupId: group.id })}
                style={{ '--tab-color': group.color } as CSSProperties}
                title={group.name}
                aria-pressed={group.id === state.activeGroupId}
                aria-label={`${group.name || 'Untitled'}, ${count} active header${count === 1 ? '' : 's'}`}
              >
                <span className="tab-color" />
                <span className="tab-name">{group.name || 'Untitled'}</span>
                <span
                  className={`tab-count ${count > 0 ? 'has-headers' : ''}`}
                  title={`${count} active headers`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </nav>

        <button className="new-group" onClick={addGroup} aria-label="New profile" title="New profile">
          <PlusIcon />
          <span>New profile</span>
        </button>
      </aside>

      <main className="workspace">
        <header className="workspace-header">
          <div className="title-stack">
            <input
              className="group-title"
              aria-label="Profile name"
              value={activeGroup.name}
              onChange={(event) =>
                updateActiveGroup((group) => ({ ...group, name: event.target.value }))
              }
              spellCheck={false}
            />
          </div>

          <div className="header-actions">
            <div className={`live-badge ${activeCount ? 'is-live' : ''} ${saveStatus === 'error' ? 'is-error' : ''}`}>
              <span />
              {saveStatus === 'error'
                ? 'Sync error'
                : activeCount
                  ? `${activeCount} active`
                  : 'No active headers'}
            </div>
            {saveStatus === 'saving' || saveStatus === 'saved' ? (
              <span className={`save-status is-${saveStatus}`} aria-hidden="true">
                {saveStatus === 'saving' ? 'Saving…' : 'Saved'}
              </span>
            ) : null}
            <span className="sr-only" role="status">
              {saveStatus === 'saved' ? 'Saved' : saveStatus === 'error' ? 'Sync error' : ''}
            </span>
            <button
              className={`icon-button delete-button ${confirmingDelete ? 'is-armed' : ''}`}
              onClick={handleDeleteClick}
              onKeyDown={(event) => {
                if (event.key === 'Escape') setConfirmingDelete(false);
              }}
              disabled={state.groups.length === 1}
              aria-label={confirmingDelete ? 'Confirm delete profile' : 'Delete profile'}
              title={
                state.groups.length === 1
                  ? 'Keep at least one profile'
                  : confirmingDelete
                    ? 'Click again to delete'
                    : 'Delete profile'
              }
            >
              <TrashIcon />
            </button>
          </div>
        </header>

        <section className="header-panel" aria-label={`${activeGroup.name} headers`}>
          <div className="column-headings">
            <span>On</span>
            <span>Key</span>
            <span>Value</span>
            <span />
          </div>

          <div className="header-list">
            {activeGroup.headers.map((header, index) => (
              <div
                className={`header-row ${header.enabled ? '' : 'is-disabled'}`}
                key={header.id}
                style={{ '--row-delay': `${Math.min(index, 8) * 28}ms` } as CSSProperties}
              >
                <label className="check-wrap" title={header.enabled ? 'Disable header' : 'Enable header'}>
                  <input
                    type="checkbox"
                    checked={header.enabled}
                    onChange={(event) => updateHeader(header.id, { enabled: event.target.checked })}
                  />
                  <span className="custom-check">
                    <svg viewBox="0 0 14 14" aria-hidden="true">
                      <path d="m3 7 2.4 2.5L11 4.5" />
                    </svg>
                  </span>
                </label>

                <input
                  className="header-input key-input"
                  value={header.key}
                  onChange={(event) => updateHeader(header.id, { key: event.target.value })}
                  placeholder="X-Request-ID"
                  aria-label={`Header key ${index + 1}`}
                  spellCheck={false}
                />
                <input
                  className="header-input value-input"
                  value={header.value}
                  onChange={(event) => updateHeader(header.id, { value: event.target.value })}
                  placeholder="value"
                  aria-label={`Header value ${index + 1}`}
                  spellCheck={false}
                />
                <button
                  className="row-delete"
                  onClick={() => deleteHeader(header.id)}
                  aria-label={`Delete header ${index + 1}`}
                  title="Delete row"
                >
                  <TrashIcon />
                </button>
              </div>
            ))}

            {activeGroup.headers.length === 0 && (
              <div className="empty-state">
                <span className="empty-glyph">
                  <LeafMark />
                </span>
                <strong>No headers yet</strong>
                <p>Add a header to this profile.</p>
              </div>
            )}
          </div>

          <div className="panel-footer">
            <span className="footer-note">Applies to new requests</span>
            <button className="add-header" onClick={addHeader} aria-label="Add header">
              <PlusIcon />
              <span>Add header</span>
            </button>
          </div>
        </section>

      </main>
    </div>
  );
}

export default App;
