"use client";

import { useEffect, useState } from "react";
import type { StorefrontSettings } from "@/src/lib/settings";
import { dollarsToCents, formatMoney } from "@/src/lib/money";

type AdminSettingsResponse = {
  settings: StorefrontSettings;
  readMode: string;
  writeMode: string;
};

const moneyInput = (cents: number) => (cents / 100).toFixed(2);

function cloneSettings(settings: StorefrontSettings): StorefrontSettings {
  return JSON.parse(JSON.stringify(settings)) as StorefrontSettings;
}

export function AdminSettingsEditor() {
  const [settings, setSettings] = useState<StorefrontSettings | null>(null);
  const [advancedJson, setAdvancedJson] = useState("");
  const [advancedDirty, setAdvancedDirty] = useState(false);
  const [adminToken, setAdminToken] = useState("");
  const [status, setStatus] = useState("Loading storefront settings…");
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState({ readMode: "local", writeMode: "local" });

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch("/api/admin/settings", { cache: "no-store" });
        const body = (await response.json()) as AdminSettingsResponse;
        if (!response.ok) throw new Error("Unable to load settings.");
        setSettings(body.settings);
        setAdvancedJson(JSON.stringify(body.settings, null, 2));
        setMode({ readMode: body.readMode, writeMode: body.writeMode });
        setStatus("Settings loaded.");
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Unable to load settings.");
      }
    }

    void loadSettings();
  }, []);

  function patch(updater: (draft: StorefrontSettings) => void) {
    if (!settings) return;
    const next = cloneSettings(settings);
    updater(next);
    setSettings(next);
    setAdvancedJson(JSON.stringify(next, null, 2));
    setAdvancedDirty(false);
  }

  async function save() {
    setSaving(true);
    setStatus("Saving settings…");

    try {
      const payload = advancedDirty ? (JSON.parse(advancedJson) as StorefrontSettings) : settings;
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify(payload)
      });

      const body = (await response.json()) as { settings?: StorefrontSettings; error?: string; mode?: string };
      if (!response.ok || !body.settings) throw new Error(body.error || "Unable to save settings.");
      setSettings(body.settings);
      setAdvancedJson(JSON.stringify(body.settings, null, 2));
      setAdvancedDirty(false);
      setStatus(`Saved through ${body.mode ?? mode.writeMode} mode.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to save settings.");
    } finally {
      setSaving(false);
    }
  }

  if (!settings) {
    return <p className="admin-status">{status}</p>;
  }

  const total = settings.product.priceCents + settings.product.shippingCents;

  return (
    <div className="admin-shell">
      <section className="admin-panel admin-hero-panel">
        <div>
          <p className="eyebrow">Storefront admin</p>
          <h1>Power NOW sales settings</h1>
          <p>
            Manage the direct-sale price, shipping and handling, public copy, stock imagery links, Stripe checkout behavior, and affiliate defaults.
          </p>
          <p className="admin-mode">
            Read mode: <strong>{mode.readMode}</strong> · Write mode: <strong>{mode.writeMode}</strong>
          </p>
        </div>
        <label className="field admin-token">
          <span>Admin token</span>
          <input
            type="password"
            value={adminToken}
            onChange={(event) => setAdminToken(event.target.value)}
            placeholder="ADMIN_TOKEN from environment"
          />
        </label>
      </section>

      <section className="admin-grid">
        <div className="admin-panel">
          <p className="eyebrow">Pricing</p>
          <h2>Book price and shipping</h2>
          <div className="two-fields">
            <label className="field">
              <span>Book price</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={moneyInput(settings.product.priceCents)}
                onChange={(event) => patch((draft) => { draft.product.priceCents = dollarsToCents(event.target.value); })}
              />
            </label>
            <label className="field">
              <span>Shipping & handling</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={moneyInput(settings.product.shippingCents)}
                onChange={(event) => patch((draft) => { draft.product.shippingCents = dollarsToCents(event.target.value); })}
              />
            </label>
          </div>
          <p className="admin-total">Current checkout total: {formatMoney(total, settings.product.currency)}</p>
          <label className="field">
            <span>Buy button label</span>
            <input
              value={settings.checkout.buyButtonLabel}
              onChange={(event) => patch((draft) => { draft.checkout.buyButtonLabel = event.target.value; })}
            />
          </label>
          <label className="field">
            <span>Allowed shipping countries</span>
            <input
              value={settings.checkout.allowedCountries.join(", ")}
              onChange={(event) =>
                patch((draft) => {
                  draft.checkout.allowedCountries = event.target.value
                    .split(",")
                    .map((country) => country.trim().toUpperCase())
                    .filter(Boolean);
                })
              }
            />
          </label>
        </div>

        <div className="admin-panel">
          <p className="eyebrow">Product</p>
          <h2>Book merchandising</h2>
          <label className="field">
            <span>Book title</span>
            <input
              value={settings.product.title}
              onChange={(event) => patch((draft) => { draft.product.title = event.target.value; })}
            />
          </label>
          <label className="field">
            <span>Subtitle</span>
            <input
              value={settings.product.subtitle}
              onChange={(event) => patch((draft) => { draft.product.subtitle = event.target.value; })}
            />
          </label>
          <label className="field">
            <span>Hero hook</span>
            <textarea
              rows={3}
              value={settings.copy.heroHook}
              onChange={(event) => patch((draft) => { draft.copy.heroHook = event.target.value; })}
            />
          </label>
          <label className="field">
            <span>Hero subhead</span>
            <textarea
              rows={5}
              value={settings.copy.heroSubhead}
              onChange={(event) => patch((draft) => { draft.copy.heroSubhead = event.target.value; })}
            />
          </label>
        </div>

        <div className="admin-panel">
          <p className="eyebrow">Imagery</p>
          <h2>Swap stock or cover art by URL</h2>
          {(
            [
              ["Hero background", "heroBackgroundUrl"],
              ["Book cover / mockup face", "bookCoverUrl"],
              ["Writing desk section", "writingDeskUrl"],
              ["Workspace section", "actionWorkspaceUrl"],
              ["Affiliate section", "affiliateUrl"]
            ] as const
          ).map(([label, key]) => (
            <label className="field" key={key}>
              <span>{label}</span>
              <input
                value={settings.imagery[key]}
                onChange={(event) => patch((draft) => { draft.imagery[key] = event.target.value; })}
              />
            </label>
          ))}
        </div>

        <div className="admin-panel">
          <p className="eyebrow">Affiliates</p>
          <h2>Referral-ready defaults</h2>
          <label className="field check-field">
            <input
              type="checkbox"
              checked={settings.affiliate.enabled}
              onChange={(event) => patch((draft) => { draft.affiliate.enabled = event.target.checked; })}
            />
            <span>Show affiliate page and capture ?ref= codes</span>
          </label>
          <div className="two-fields">
            <label className="field">
              <span>Commission %</span>
              <input
                type="number"
                min="0"
                max="80"
                value={settings.affiliate.defaultCommissionPercent}
                onChange={(event) => patch((draft) => { draft.affiliate.defaultCommissionPercent = Number(event.target.value); })}
              />
            </label>
            <label className="field">
              <span>Referral cookie days</span>
              <input
                type="number"
                min="1"
                max="365"
                value={settings.affiliate.cookieDays}
                onChange={(event) => patch((draft) => { draft.affiliate.cookieDays = Number(event.target.value); })}
              />
            </label>
          </div>
          <label className="field">
            <span>Affiliate application email</span>
            <input
              value={settings.affiliate.applyEmail}
              onChange={(event) => patch((draft) => { draft.affiliate.applyEmail = event.target.value; })}
            />
          </label>
        </div>
      </section>

      <section className="admin-panel">
        <p className="eyebrow">Advanced</p>
        <h2>Full storefront JSON</h2>
        <p>
          Use this for series expansion, testimonials, affiliate assets, additional parts, and future book releases. The save API sanitizes pricing and country codes.
        </p>
        <textarea
          className="json-editor"
          value={advancedJson}
          onChange={(event) => {
            setAdvancedJson(event.target.value);
            setAdvancedDirty(true);
          }}
          spellCheck={false}
        />
      </section>

      <div className="admin-savebar">
        <span>{status}</span>
        <button className="button button-primary" type="button" onClick={save} disabled={saving || !adminToken}>
          {saving ? "Saving…" : "Save storefront settings"}
        </button>
      </div>
    </div>
  );
}
