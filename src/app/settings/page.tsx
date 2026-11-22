"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useOrbit } from "@/context/OrbitContext";
import { COMMON_TIMEZONES } from "@/lib/storage";
import {
  OrbitButton,
  OrbitField,
  OrbitFilterButton,
  OrbitSectionHeading,
  OrbitStatusBadge,
} from "@/components/ui/OrbitPrimitives";
import { MotionPreference } from "@/types/orbit";

export default function SettingsPage() {
  const router = useRouter();
  const {
    state,
    updatePreferences,
    replayWelcomeIntro,
    openDemoLogin,
    resetWorkspaceData,
    cycleModelCooldown,
    pushToast,
  } = useOrbit();

  const [confirmReset, setConfirmReset] = useState(false);

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orbit-workspace-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    pushToast("Exported local workspace JSON backup.", { tone: "success" });
  };

  const handleReplayWelcome = () => {
    replayWelcomeIntro();
    router.push("/");
  };

  return (
    <div className="w-full">
      <section className="p-5 sm:p-8 border-b border-[#B3B3AF]">
        <p className="inline-flex items-center gap-2 orbit-mono-label text-[#C82A00] mb-2">
          <span className="w-1.5 h-1.5 bg-[#FA3600]" aria-hidden="true" />
          08 / PREFERENCES &amp; SIMULATED SYSTEM STATUS
        </p>
        <h1 className="orbit-display text-[34px] sm:text-[44px] text-[#FA3600]">
          <span className="orbit-line-mask">
            <span className="orbit-page-title-inner">Settings</span>
          </span>
        </h1>
        <p className="text-[14px] text-[#414140] mt-2 max-w-[58ch]">
          Configure your greeting identity, timezone, motion preferences, and inspect simulated integration/provider states. No external APIs or credentials are connected.
        </p>
      </section>

      {/* Personal Identity, Timezone & Motion */}
      <section className="orbit-page-section grid grid-cols-1 lg:grid-cols-12 border-b border-[#B3B3AF]">
        <div className="lg:col-span-6 border-b lg:border-b-0 lg:border-r border-[#B3B3AF]">
          <OrbitSectionHeading
            code="ID"
            title="Identity &"
            accentWord="Locale"
            className="bg-[#ECEBE2]/45"
          />

          <OrbitField
            id="settings-name"
            label="Display Name"
            value={state.preferences.name}
            onChange={(e) => updatePreferences({ name: e.target.value })}
          />

          <div className="p-4 border-b border-[#B3B3AF]">
            <label
              htmlFor="settings-tz"
              className="block orbit-mono-label text-[#5C5C59] mb-1.5"
            >
              Timezone (Drives Greeting &amp; Clock)
            </label>
            <select
              id="settings-tz"
              value={state.preferences.timezone}
              onChange={(e) => {
                updatePreferences({ timezone: e.target.value });
                pushToast(`Timezone set to ${e.target.value}.`, {
                  tone: "success",
                });
              }}
              className="w-full border border-[#B3B3AF] bg-[#F5F5ED] px-3 py-2.5 font-mono text-[12px] text-[#282828]"
            >
              {COMMON_TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>

          <div className="p-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-[14px] font-medium text-[#282828]">
                Demo Weather Strip on Today
              </p>
              <p className="font-mono text-[11px] text-[#5C5C59]">
                Clearly labelled simulated forecast readout
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={state.preferences.demoWeatherEnabled}
              onClick={() =>
                updatePreferences({
                  demoWeatherEnabled: !state.preferences.demoWeatherEnabled,
                })
              }
              className={`px-3 py-1.5 border font-mono text-[11px] uppercase cursor-pointer transition-colors ${
                state.preferences.demoWeatherEnabled
                  ? "bg-[#282828] text-[#F5F5ED] border-[#282828]"
                  : "border-[#B3B3AF] text-[#282828] hover:border-[#282828]"
              }`}
            >
              {state.preferences.demoWeatherEnabled ? "Shown" : "Hidden"}
            </button>
          </div>
        </div>

        {/* Motion & Welcome Replay */}
        <div className="lg:col-span-6 flex flex-col justify-between">
          <div>
            <OrbitSectionHeading
              code="MO"
              title="Motion &"
              accentWord="Entrance"
              className="bg-[#ECEBE2]/45"
            />

            <div className="p-5 border-b border-[#B3B3AF]">
              <p className="orbit-mono-label text-[#5C5C59] mb-3">
                Motion Preference
              </p>
              <div className="grid grid-cols-3 border border-[#B3B3AF]">
                {(
                  [
                    { value: "system", label: "System" },
                    { value: "full", label: "Full Motion" },
                    { value: "reduced", label: "Reduced" },
                  ] as { value: MotionPreference; label: string }[]
                ).map((opt) => (
                  <OrbitFilterButton
                    key={opt.value}
                    label={opt.label}
                    active={state.preferences.motionPreference === opt.value}
                    onClick={() => {
                      updatePreferences({ motionPreference: opt.value });
                      pushToast(`Motion preference: ${opt.label}.`, {
                        tone: "success",
                      });
                    }}
                    className="border-r last:border-r-0 border-[#B3B3AF]"
                  />
                ))}
              </div>
              <p className="font-mono text-[11px] text-[#5C5C59] mt-2.5">
                Reduced mode switches the 3D Earth to a static orbital state and disables entrance/hover motion transitions.
              </p>
            </div>

            <div className="p-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-[14px] font-medium text-[#282828]">
                  Post-Login Welcome Hero
                </p>
                <p className="font-mono text-[11px] text-[#5C5C59]">
                  Plays after demo login or once per session. Test either flow anytime.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <OrbitButton
                  type="button"
                  label="Demo Login Flow"
                  size="sm"
                  variant="subtle"
                  onClick={openDemoLogin}
                />
                <OrbitButton
                  type="button"
                  label="Replay Welcome"
                  size="sm"
                  variant="accent"
                  onClick={handleReplayWelcome}
                />
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-[#B3B3AF] bg-[#ECEBE2]/35 font-mono text-[11px] text-[#5C5C59]">
            Typography Note: Paired <strong className="text-[#282828]">Archivo</strong> +{" "}
            <strong className="text-[#282828]">Geist Mono</strong> as an approximate freely licensed substitute for proprietary BT Grotesk.
          </div>
        </div>
      </section>

      {/* Simulated Integration Cards & AI Provider Cooldown States */}
      <section className="orbit-page-section grid grid-cols-1 lg:grid-cols-12 border-b border-[#B3B3AF]">
        <div className="lg:col-span-6 border-b lg:border-b-0 lg:border-r border-[#B3B3AF]">
          <OrbitSectionHeading
            code="IN"
            title="Demo"
            accentWord="Integrations"
            className="bg-[#ECEBE2]/45"
            rightSlot={<OrbitStatusBadge tone="muted">DEMO · COMING SOON</OrbitStatusBadge>}
          />
          <div className="divide-y divide-[#B3B3AF]">
            {state.integrations.map((item) => (
              <div key={item.id} className="p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-[15px] font-bold text-[#282828]">
                      {item.name}
                    </h3>
                    <p className="font-mono text-[10px] uppercase text-[#5C5C59]">
                      {item.category} · {item.lastSyncLabel}
                    </p>
                  </div>
                  <OrbitStatusBadge
                    tone={
                      item.status === "Simulated: Connected"
                        ? "accent"
                        : "neutral"
                    }
                  >
                    {item.status}
                  </OrbitStatusBadge>
                </div>
                <p className="text-[13px] text-[#414140] mt-2">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-6">
          <OrbitSectionHeading
            code="AI"
            title="AI Provider"
            accentWord="Status"
            className="bg-[#ECEBE2]/45"
            rightSlot={<OrbitStatusBadge tone="muted">DEMO · COMING SOON</OrbitStatusBadge>}
          />
          <div className="divide-y divide-[#B3B3AF]">
            {state.modelProviders.map((prov) => (
              <div
                key={prov.id}
                className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-[15px] font-bold text-[#282828]">
                      {prov.name}
                    </h3>
                    <OrbitStatusBadge
                      tone={
                        prov.status === "Simulated: Cooldown"
                          ? "accent"
                          : prov.status === "Simulated: Ready"
                            ? "ink"
                            : "neutral"
                      }
                    >
                      {prov.status}
                      {prov.cooldownSeconds > 0 ? ` (${prov.cooldownSeconds}s)` : ""}
                    </OrbitStatusBadge>
                  </div>
                  <p className="font-mono text-[11px] text-[#5C5C59] mt-1">
                    {prov.model} · {prov.latencyLabel}
                  </p>
                </div>

                <OrbitButton
                  type="button"
                  size="sm"
                  variant="subtle"
                  showArrow={false}
                  label="Simulate State"
                  onClick={() => cycleModelCooldown(prov.id)}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Local Data Export & Mock-Data Reset */}
      <section className="orbit-page-section p-5 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="orbit-display text-[20px] text-[#282828]">
            Local Workspace Data
          </h2>
          <p className="text-[13px] text-[#414140] mt-1">
            Export your persisted localStorage snapshot as JSON or reset back to the original demo dataset.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <OrbitButton
            type="button"
            label="Export Workspace JSON"
            onClick={handleExportJson}
          />

          {!confirmReset ? (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="px-4 py-2.5 border border-[#FA3600] text-[#C82A00] font-mono text-[11px] uppercase tracking-[0.06em] hover:bg-[#FA3600] hover:text-white transition-colors cursor-pointer"
            >
              Reset Mock Data
            </button>
          ) : (
            <div className="flex items-center gap-2 p-2 border border-[#FA3600] bg-[#FA3600]/8">
              <span className="font-mono text-[11px] text-[#282828] px-1">
                Confirm reset?
              </span>
              <button
                type="button"
                onClick={() => {
                  resetWorkspaceData();
                  setConfirmReset(false);
                }}
                className="px-3 py-1.5 bg-[#FA3600] text-white font-mono text-[10px] uppercase cursor-pointer"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="px-3 py-1.5 border border-[#B3B3AF] font-mono text-[10px] uppercase cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
