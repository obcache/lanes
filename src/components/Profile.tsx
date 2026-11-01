import { useRef, useState } from "react";
import {
  Upload,
  UserRound,
  LogIn,
  CloudUpload,
  LogOut,
  Image,
  PanelsTopLeft,
} from "lucide-react";
import type { Profile as ProfileType, Settings, Run } from "../shared/model";
import { api } from "../core/storage";
import { Heading, LanePreview } from "./ui";
export default function Profile({
  profile,
  settings,
  runs,
  onChange,
  notify,
}: {
  profile: ProfileType;
  settings: Settings;
  runs: Run[];
  onChange: (p: Partial<ProfileType>) => void;
  notify: (s: string) => void;
}) {
  const [name, setName] = useState(profile.displayName),
    [online, setOnline] = useState(false),
    [busy, setBusy] = useState(false),
    backgroundInput = useRef<HTMLInputElement>(null),
    laneInput = useRef<HTMLInputElement>(null);
  async function upload(
    file: File | undefined,
    kind: "background" | "laneSkin",
  ) {
    if (!file) return;
    if (
      file.size > 5 * 1024 * 1024 ||
      !["image/png", "image/jpeg", "image/webp"].includes(file.type)
    ) {
      notify("Choose a PNG, JPEG, or WebP image smaller than 5 MB.");
      return;
    }
    try {
      const bitmap = await createImageBitmap(file);
      if (
        bitmap.width > 4096 ||
        bitmap.height > 4096 ||
        bitmap.width < 16 ||
        bitmap.height < 16
      ) {
        bitmap.close();
        throw Error("Choose an image between 16 and 4096 pixels per side.");
      }
      bitmap.close();
      const reader = new FileReader();
      const data = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(Error("Image could not be read."));
        reader.readAsDataURL(file);
      });
      onChange({ [kind]: data });
      notify(
        "Appearance saved locally. Sync your profile to upload it to the server.",
      );
    } catch (e) {
      notify(String(e));
    }
  }
  async function load() {
    const data = await api(settings.apiUrl, "/profile");
    setOnline(true);
    if (data.profile) {
      const p = { ...data.profile, schemaVersion: 1 };
      onChange(p);
      setName(p.displayName);
    }
    notify("Online profile loaded.");
  }
  return (
    <main className="full-page profile-page">
      <Heading
        title="Your profile"
        description="A little more you. In every session."
        action={
          <button
            className="secondary"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                if (window.lanes) {
                  await api(settings.apiUrl, "/auth/login", "POST");
                  await load();
                } else {
                  if (!settings.apiUrl)
                    throw Error("Connect a server in Settings first.");
                  location.assign(`${settings.apiUrl}/auth/start`);
                }
              } catch (e) {
                notify(String(e));
              } finally {
                setBusy(false);
              }
            }}
          >
            <LogIn size={17} /> {busy ? "Connecting…" : "Sign in with SSO"}
          </button>
        }
      />
      <section className="profile-identity">
        <div className="avatar">
          <UserRound size={34} />
        </div>
        <div>
          <h2>{profile.displayName}</h2>
          <p>
            {online
              ? "Organization account connected"
              : "Playing locally · connect to sync your profile"}
          </p>
        </div>
      </section>
      <form
        className="settings-section inline-form"
        onSubmit={(e) => {
          e.preventDefault();
          onChange({ ...profile, displayName: name.trim() || "Local player" });
          notify("Display name saved.");
        }}
      >
        <label>
          Display name
          <input
            aria-label="Display name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            required
          />
        </label>
        <button className="secondary">Save name</button>
      </form>
      <section className="settings-section">
        <div className="section-heading">
          <div>
            <h2>Your stage, your style.</h2>
            <p>
              Upload a background and a lane texture. Your notes stay clear
              above your artwork.
            </p>
          </div>
        </div>
        <div className="appearance-grid">
          <div className="appearance-item">
            <div
              className={`background-preview ${profile.background ? "custom" : ""}`}
              style={
                profile.background
                  ? { backgroundImage: `url("${profile.background}")` }
                  : undefined
              }
            >
              <Image size={28} />
            </div>
            <div className="section-heading">
              <div>
                <h3>Game background</h3>
                <small>PNG, JPEG, WebP · up to 5 MB</small>
              </div>
              <button
                className="secondary"
                onClick={() => backgroundInput.current?.click()}
              >
                <Upload size={15} /> Upload
              </button>
            </div>
            {profile.background ? (
              <button
                className="text-button"
                onClick={() => onChange({ ...profile, background: "" })}
              >
                Use default
              </button>
            ) : null}
            <input
              hidden
              aria-label="Upload background"
              type="file"
              ref={backgroundInput}
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => {
                void upload(e.target.files?.[0], "background");
                e.target.value = "";
              }}
            />
          </div>
          <div className="appearance-item">
            <div className="skin-preview">
              <LanePreview
                difficulty={settings.difficulty}
                keys={settings.keybinds}
                skin={profile.laneSkin}
              />
            </div>
            <div className="section-heading">
              <div>
                <h3>
                  <PanelsTopLeft size={15} /> Lane texture
                </h3>
                <small>For the full five-lane highway</small>
              </div>
              <button
                className="secondary"
                onClick={() => laneInput.current?.click()}
              >
                <Upload size={15} /> Upload
              </button>
            </div>
            {profile.laneSkin ? (
              <button
                className="text-button"
                onClick={() => onChange({ ...profile, laneSkin: "" })}
              >
                Use default
              </button>
            ) : null}
            <input
              hidden
              aria-label="Upload lane texture"
              type="file"
              ref={laneInput}
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => {
                void upload(e.target.files?.[0], "laneSkin");
                e.target.value = "";
              }}
            />
          </div>
        </div>
      </section>
      <section className="settings-section">
        <h2>Your sessions</h2>
        <div className="profile-stats">
          <div>
            <b>{runs.length}</b>
            <span>Tracks completed</span>
          </div>
          <div>
            <b>{Math.max(0, ...runs.map((r) => r.maxCombo))}×</b>
            <span>Best combo</span>
          </div>
          <div>
            <b>
              {runs.length
                ? (
                    runs.reduce((a, r) => a + r.accuracy, 0) / runs.length
                  ).toFixed(1)
                : "—"}
              %
            </b>
            <span>Average accuracy</span>
          </div>
        </div>
      </section>
      <section className="settings-section">
        <h2>Keep your look in sync.</h2>
        <p>
          Your server profile holds your display name and uploaded artwork. Your
          music library and device settings stay local.
        </p>
        <div className="button-row">
          <button
            className="primary"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await api(settings.apiUrl, "/profile", "PUT", profile);
                setOnline(true);
                notify("Profile and artwork uploaded.");
              } catch (e) {
                notify(String(e));
              } finally {
                setBusy(false);
              }
            }}
          >
            <CloudUpload size={17} /> Sync profile
          </button>
          <button
            className="secondary"
            onClick={() => void load().catch((e) => notify(String(e)))}
          >
            Load online profile
          </button>
          <button
            className="text-button"
            onClick={async () => {
              try {
                await api(settings.apiUrl, "/auth/logout", "POST");
                setOnline(false);
                notify("Signed out.");
              } catch (e) {
                notify(String(e));
              }
            }}
          >
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </section>
    </main>
  );
}
