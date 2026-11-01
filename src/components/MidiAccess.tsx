import { useRef, useState, useEffect } from "react";
import { ShieldAlert, Settings2, RotateCcw, Copy, Check } from "lucide-react";
import type { Settings } from "../shared/model";
import { isMidiPermissionError } from "../core/midi";

export function MidiAccessNotice({
  error,
  onOpen,
  onRetry,
}: {
  error: unknown;
  onOpen: () => void;
  onRetry: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  if (!isMidiPermissionError(error)) return null;
  return (
    <section
      className="midi-access-notice"
      role="alert"
      aria-labelledby="midi-access-alert-title"
    >
      <ShieldAlert size={24} aria-hidden="true" />
      <div>
        <h2 id="midi-access-alert-title">MIDI device access is blocked</h2>
        <p>
          {window.lanes
            ? "Review LANES’ device access setting, then try connecting again."
            : "Allow MIDI devices for this site in your browser’s site settings, then try connecting again."}
        </p>
        <div className="button-row">
          <button className="primary" onClick={onOpen}>
            <Settings2 size={16} />
            Open device access settings
          </button>
          <button
            className="secondary"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onRetry();
              } finally {
                setBusy(false);
              }
            }}
          >
            <RotateCcw size={16} />
            {busy ? "Connecting…" : "Try MIDI again"}
          </button>
        </div>
      </div>
    </section>
  );
}

export function MidiDeviceAccess({
  settings,
  onChange,
  onRetry,
}: {
  settings: Settings;
  onChange: (s: Settings) => void;
  onRetry: () => Promise<void>;
}) {
  const heading = useRef<HTMLHeadingElement>(null),
    [copied, setCopied] = useState(false),
    [copyFailed, setCopyFailed] = useState(false),
    [busy, setBusy] = useState(false);
  const isEdge = /Edg\//.test(navigator.userAgent),
    isChrome = /Chrome\//.test(navigator.userAgent);
  const address = isEdge
    ? "edge://settings/content/midiDevices"
    : isChrome
      ? "chrome://settings/content/midiDevices"
      : "";
  useEffect(() => {
    heading.current?.focus();
    heading.current?.scrollIntoView({ block: "center" });
  }, []);
  return (
    <section
      className="midi-device-access"
      aria-labelledby="device-access-heading"
    >
      <h3 id="device-access-heading" ref={heading} tabIndex={-1}>
        MIDI device access
      </h3>
      {window.lanes ? (
        <>
          <label className="midi-access-toggle">
            <input
              type="checkbox"
              checked={settings.midiAccessAllowed}
              disabled={busy}
              onChange={async (e) => {
                const next = {
                  ...settings,
                  midiAccessAllowed: e.target.checked,
                };
                setBusy(true);
                try {
                  await onChange(next);
                } finally {
                  setBusy(false);
                }
              }}
            />
            <span>Allow LANES to access MIDI devices</span>
          </label>
          <p>
            This setting applies to LANES on this computer. Turn it on, then try
            connecting again.
          </p>
        </>
      ) : (
        <>
          <p>
            Use the site information button beside your browser’s address bar →
            Site settings → MIDI devices → Allow. Apply the change to{" "}
            <strong>{location.origin}</strong>, then return here.
          </p>
          {address ? (
            <>
              <label>
                MIDI settings address
                <input
                  aria-label="MIDI settings address"
                  readOnly
                  value={address}
                  onFocus={(e) => e.target.select()}
                />
              </label>
              <button
                className="secondary"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(address);
                    setCopied(true);
                    setCopyFailed(false);
                  } catch {
                    setCopyFailed(true);
                  }
                }}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}{" "}
                {copied ? "Settings address copied" : "Copy settings address"}
              </button>
              <p className="muted">
                Paste this address into a new tab. Browsers prevent web pages
                from opening their protected settings directly.
              </p>
              {copyFailed ? (
                <p role="status">Select and copy the settings address above.</p>
              ) : null}
            </>
          ) : null}
          <p className="muted">
            If MIDI is disabled by your organization or this page’s permissions
            policy, ask the site administrator to enable it.
          </p>
        </>
      )}
      <button
        className="secondary"
        disabled={busy || (!!window.lanes && !settings.midiAccessAllowed)}
        onClick={async () => {
          setBusy(true);
          try {
            await onRetry();
          } finally {
            setBusy(false);
          }
        }}
      >
        <RotateCcw size={16} />
        {busy ? "Connecting…" : "Try MIDI again"}
      </button>
    </section>
  );
}
