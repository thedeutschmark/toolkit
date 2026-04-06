"use client";

import { BookMarked, Check, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toolkitApi } from "@/lib/toolkitApi";

/* ─── Types ─── */

type PermissionLevel = "everyone" | "vip" | "mod" | "streamer";

type Permissions = {
  sr: PermissionLevel;
  sNow: PermissionLevel;
  sLink: PermissionLevel;
  sQueue: PermissionLevel;
  sNext: PermissionLevel;
  sPrev: PermissionLevel;
  sPause: PermissionLevel;
  sPlay: PermissionLevel;
  sVol: PermissionLevel;
  sAdd: PermissionLevel;
  sLike: PermissionLevel;
  sReplay: PermissionLevel;
  songOut: PermissionLevel;
};

interface CommandProfile {
  id: string;
  name: string;
  permissions: Permissions;
}

/* ─── Constants ─── */

const PERMISSION_LEVELS: readonly PermissionLevel[] = ["everyone", "vip", "mod", "streamer"];

const COMMANDS: Array<{ key: keyof Permissions; label: string }> = [
  { key: "sr",      label: "!sr" },
  { key: "sNow",    label: "!snow" },
  { key: "sLink",   label: "!slink" },
  { key: "sQueue",  label: "!squeue" },
  { key: "sNext",   label: "!snext" },
  { key: "sPrev",   label: "!sprev" },
  { key: "sPause",  label: "!spause" },
  { key: "sPlay",   label: "!splay" },
  { key: "sVol",    label: "!svol" },
  { key: "sAdd",    label: "!sadd" },
  { key: "sLike",   label: "!slike" },
  { key: "sReplay", label: "!sreplay" },
  { key: "songOut", label: "!songout" },
];

const DEFAULT_PERMISSIONS: Permissions = {
  sr: "everyone", sNow: "everyone", sLink: "everyone", sQueue: "everyone",
  sNext: "mod", sPrev: "mod", sPause: "mod", sPlay: "mod",
  sVol: "mod", sAdd: "mod", sLike: "mod", sReplay: "mod", songOut: "mod",
};

const BUILT_IN_PROFILES: CommandProfile[] = [
  {
    id: "__open_queue",
    name: "Open Queue",
    permissions: {
      ...DEFAULT_PERMISSIONS,
      sr: "everyone", sNow: "everyone", sLink: "everyone", sQueue: "everyone",
      sNext: "mod", sPrev: "mod", sPause: "mod", sPlay: "mod",
      sVol: "mod", sAdd: "everyone", sLike: "everyone", sReplay: "everyone", songOut: "mod",
    },
  },
  {
    id: "__mods_only",
    name: "Mods Only",
    permissions: {
      sr: "mod", sNow: "everyone", sLink: "everyone", sQueue: "everyone",
      sNext: "mod", sPrev: "mod", sPause: "mod", sPlay: "mod",
      sVol: "mod", sAdd: "mod", sLike: "mod", sReplay: "mod", songOut: "mod",
    },
  },
  {
    id: "__viewer_dj",
    name: "Viewer DJ",
    permissions: {
      sr: "everyone", sNow: "everyone", sLink: "everyone", sQueue: "everyone",
      sNext: "everyone", sPrev: "mod", sPause: "mod", sPlay: "everyone",
      sVol: "mod", sAdd: "everyone", sLike: "everyone", sReplay: "everyone", songOut: "vip",
    },
  },
];

/* ─── Permission table ─── */

function PermissionTable({
  permissions,
  onChange,
  readOnly = false,
}: {
  permissions: Permissions;
  onChange?: (key: keyof Permissions, level: PermissionLevel) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="pb-2 pr-4 text-left font-medium text-[var(--toolkit-text-dim)]">Command</th>
            {PERMISSION_LEVELS.map(level => (
              <th key={level} className="pb-2 px-2 text-center font-medium capitalize text-[var(--toolkit-text-dim)]">
                {level}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--toolkit-border)]">
          {COMMANDS.map(({ key, label }) => {
            const current = permissions[key];
            const currentIdx = PERMISSION_LEVELS.indexOf(current);
            return (
              <tr key={key}>
                <td className="py-2 pr-4 font-mono text-[var(--toolkit-text-muted)]">{label}</td>
                {PERMISSION_LEVELS.map((level, idx) => {
                  const filled = idx <= currentIdx;
                  return (
                    <td key={level} className="py-2 px-2 text-center">
                      <button
                        type="button"
                        disabled={readOnly}
                        onClick={() => onChange?.(key, level)}
                        className={[
                          "mx-auto flex h-4 w-4 items-center justify-center rounded-full border transition-colors",
                          readOnly ? "cursor-default" : "cursor-pointer",
                          filled
                            ? "border-[var(--toolkit-accent)] bg-[var(--toolkit-accent)]"
                            : "border-[var(--toolkit-border-strong)] bg-transparent hover:border-[var(--toolkit-accent)]",
                        ].join(" ")}
                      >
                        {filled && <span className="h-1.5 w-1.5 rounded-full bg-[var(--toolkit-bg)]" />}
                      </button>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Page ─── */

export default function CommandProfilesPage() {
  const [profiles, setProfiles] = useState<CommandProfile[]>([]);
  const [loading, setLoading]   = useState(true);
  const [applying, setApplying] = useState<string | null>(null);
  const [applied, setApplied]   = useState<string | null>(null);
  const [newName, setNewName]   = useState("");
  const [editId, setEditId]     = useState<string | null>(null);
  const [editPerms, setEditPerms] = useState<Permissions>(DEFAULT_PERMISSIONS);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    toolkitApi.get<{ profiles: CommandProfile[] }>("/command-profiles")
      .then(data => setProfiles(data.profiles))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = useCallback((next: CommandProfile[]) => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      void toolkitApi.put("/command-profiles", { profiles: next });
    }, 600);
  }, []);

  function applyProfile(id: string) {
    const isBuiltIn = id.startsWith("__");
    const profile = isBuiltIn
      ? BUILT_IN_PROFILES.find(p => p.id === id)
      : profiles.find(p => p.id === id);
    if (!profile) return;

    setApplying(id);

    const doApply = isBuiltIn
      ? toolkitApi.put("/stream-settings", { permissions: profile.permissions })
      : toolkitApi.post("/command-profiles/apply", { id });

    doApply
      .then(() => {
        setApplied(id);
        setTimeout(() => setApplied(null), 2000);
      })
      .catch(() => {})
      .finally(() => setApplying(null));
  }

  function addProfile() {
    const name = newName.trim();
    if (!name) return;
    const id = `custom_${Date.now()}`;
    const next = [...profiles, { id, name, permissions: { ...DEFAULT_PERMISSIONS } }];
    setProfiles(next);
    save(next);
    setNewName("");
    setEditId(id);
    setEditPerms({ ...DEFAULT_PERMISSIONS });
  }

  function deleteProfile(id: string) {
    const next = profiles.filter(p => p.id !== id);
    setProfiles(next);
    save(next);
    if (editId === id) setEditId(null);
  }

  function openEdit(profile: CommandProfile) {
    setEditId(profile.id);
    setEditPerms({ ...profile.permissions });
  }

  function saveEdit() {
    const next = profiles.map(p => p.id === editId ? { ...p, permissions: editPerms } : p);
    setProfiles(next);
    save(next);
    setEditId(null);
  }

  function setEditPerm(key: keyof Permissions, level: PermissionLevel) {
    setEditPerms(prev => ({ ...prev, [key]: level }));
  }

  const allProfiles = [...BUILT_IN_PROFILES, ...profiles];

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="toolkit-surface px-4 py-5 text-[var(--toolkit-text-strong)] sm:px-6 sm:py-7">
        <p className="toolkit-eyebrow">Stream Music</p>
        <h1 className="mt-4 text-2xl font-semibold tracking-[-0.06em] sm:text-3xl">
          Command Profiles
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--toolkit-text-muted)]">
          Save named permission matrices and apply them in one click. Built-in presets cover the most common modes — add custom ones for anything else.
        </p>
      </section>

      {/* Profiles grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        {loading ? (
          <div className="toolkit-surface col-span-2 px-6 py-8 text-center text-sm text-[var(--toolkit-text-dim)]">
            Loading profiles…
          </div>
        ) : (
          allProfiles.map(profile => {
            const isBuiltIn = profile.id.startsWith("__");
            const isEditing = editId === profile.id;
            const isApplying = applying === profile.id;
            const wasApplied = applied === profile.id;

            return (
              <section key={profile.id} className="toolkit-surface px-5 py-5 sm:px-6 sm:py-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <BookMarked className="h-4 w-4 shrink-0 text-[var(--toolkit-accent)]" />
                    <h2 className="text-sm font-semibold text-[var(--toolkit-text-strong)]">
                      {profile.name}
                    </h2>
                    {isBuiltIn && (
                      <span className="inline-flex rounded-full border border-[var(--toolkit-border-strong)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--toolkit-text-dim)]">
                        Built-in
                      </span>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {!isBuiltIn && !isEditing && (
                      <>
                        <button
                          type="button"
                          onClick={() => openEdit(profile)}
                          className="text-xs text-[var(--toolkit-text-dim)] hover:text-[var(--toolkit-text-muted)] underline underline-offset-4"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteProfile(profile.id)}
                          className="text-[var(--toolkit-danger)] hover:opacity-70 transition-opacity"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                    {isEditing && (
                      <button
                        type="button"
                        onClick={saveEdit}
                        className="toolkit-button toolkit-button-primary text-xs"
                      >
                        Save
                      </button>
                    )}
                    {!isEditing && (
                      <button
                        type="button"
                        disabled={isApplying}
                        onClick={() => applyProfile(profile.id)}
                        className="toolkit-button toolkit-button-secondary text-xs disabled:opacity-50"
                      >
                        {wasApplied ? (
                          <><Check className="h-3.5 w-3.5" /> Applied</>
                        ) : isApplying ? "Applying…" : "Apply"}
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <PermissionTable
                    permissions={isEditing ? editPerms : profile.permissions}
                    onChange={isEditing ? setEditPerm : undefined}
                    readOnly={!isEditing}
                  />
                </div>
              </section>
            );
          })
        )}
      </div>

      {/* Add custom profile */}
      <section className="toolkit-surface px-5 py-5 sm:px-6 sm:py-6">
        <p className="toolkit-eyebrow mb-4">New profile</p>
        <div className="flex gap-3">
          <input
            className="toolkit-input flex-1"
            placeholder="Profile name…"
            value={newName}
            maxLength={64}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addProfile()}
          />
          <button
            type="button"
            disabled={!newName.trim()}
            onClick={addProfile}
            className="toolkit-button toolkit-button-primary disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>
        <p className="mt-3 text-xs leading-5 text-[var(--toolkit-text-dim)]">
          New profiles start with the default permission matrix. Edit the table to customise, then Apply to push to Stream Music.
        </p>
      </section>
    </div>
  );
}
