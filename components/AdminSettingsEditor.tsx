"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  SettingsPersistenceInfo,
  StorefrontSettings
} from "@/src/lib/settings";
import { formatMoney } from "@/src/lib/money";

type SettingsResponse = {
  settings: StorefrontSettings;
  persistence: SettingsPersistenceInfo;
  writeAuthentication: string;
};

function cloneSettings(
  settings: StorefrontSettings
): StorefrontSettings {
  return JSON.parse(JSON.stringify(settings)) as StorefrontSettings;
}

export function AdminSettingsEditor() {
  const [settings, setSettings] =
    useState<StorefrontSettings | null>(null);
  const [persistence, setPersistence] =
    useState<SettingsPersistenceInfo | null>(null);
  const [githubToken, setGithubToken] = useState("");
  const [adminToken, setAdminToken] = useState("");
  const [advancedJson, setAdvancedJson] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [status, setStatus] = useState("Loading storefront settings…");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch("/api/admin/settings", {
          cache: "no-store"
        });
        const body = (await response.json()) as SettingsResponse & {
          error?: string;
        };
        if (!response.ok || !body.settings) {
          throw new Error(
            body.error || "Settings could not be loaded."
          );
        }
        const loaded = cloneSettings(body.settings);
        setSettings(loaded);
        setPersistence(body.persistence);
        setAdvancedJson(JSON.stringify(loaded, null, 2));
        setStatus(
          body.persistence.tokenConfigured
            ? "GitHub-backed settings are ready. A server token is configured."
            : "GitHub-backed settings are ready. Enter a fine-grained GitHub token only when saving."
        );
      } catch (error) {
        setStatus(
          error instanceof Error
            ? error.message
            : "Settings could not be loaded."
        );
      }
    })();
  }, []);

  const pricingSummary = useMemo(() => {
    if (!settings) return "";
    return `${formatMoney(
      settings.product.priceCents,
      settings.product.currency
    )} per book + ${formatMoney(
      settings.product.shippingCents,
      settings.product.currency
    )} shipping & handling per order + applicable tax`;
  }, [settings]);

  function update<K extends keyof StorefrontSettings>(
    section: K,
    value: StorefrontSettings[K]
  ) {
    setSettings((current) => {
      if (!current) return current;
      const next = { ...current, [section]: value };
      setAdvancedJson(JSON.stringify(next, null, 2));
      return next;
    });
  }

  function applyAdvancedJson() {
    try {
      const parsed = JSON.parse(
        advancedJson
      ) as StorefrontSettings;
      setSettings(parsed);
      setStatus(
        "Advanced JSON applied in the browser. Save to commit it to GitHub."
      );
    } catch (error) {
      setStatus(
        error instanceof Error
          ? `Advanced JSON error: ${error.message}`
          : "Advanced JSON is invalid."
      );
    }
  }

  async function save() {
    if (!settings) return;
    setSaving(true);
    setStatus("Committing settings to GitHub…");

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };
      if (githubToken.trim()) {
        headers["X-GitHub-Token"] = githubToken.trim();
      }
      if (adminToken.trim()) {
        headers.Authorization = `Bearer ${adminToken.trim()}`;
      }

      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers,
        body: JSON.stringify(settings)
      });
      const body = (await response.json()) as {
        error?: string;
        settings?: StorefrontSettings;
        commit?: {
          commitSha?: string;
          commitUrl?: string;
        };
      };
      if (!response.ok || !body.settings) {
        throw new Error(
          body.error || "GitHub save failed."
        );
      }

      setSettings(cloneSettings(body.settings));
      setAdvancedJson(
        JSON.stringify(body.settings, null, 2)
      );
      setGithubToken("");
      setStatus(
        `Saved to GitHub${
          body.commit?.commitSha
            ? ` in commit ${body.commit.commitSha.slice(0, 8)}`
            : ""
        }. The public site reads this file directly.`
      );
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Settings could not be saved."
      );
    } finally {
      setSaving(false);
    }
  }

  if (!settings) {
    return (
      <section className="admin-shell">
        <p className="admin-status">{status}</p>
      </section>
    );
  }

  return (
    <section className="admin-shell">
      <div className="admin-panel admin-hero-panel">
        <div>
          <p className="eyebrow">GitHub-backed control surface</p>
          <h1>Storefront settings</h1>
          <p>
            Price, shipping, copy, imagery, and checkout settings
            are committed to{" "}
            <strong>
              {persistence?.repository ?? "the PowerNow repository"}
            </strong>
            . The website reads the committed file rather than
            relying on Vercel&apos;s temporary filesystem.
          </p>
        </div>
        <div className="admin-summary">
          <span>Current customer-facing structure</span>
          <strong>{pricingSummary}</strong>
          <small>
            Combined-price wording is deliberately not generated.
          </small>
        </div>
      </div>

      <div className="admin-grid">
        <div className="admin-panel">
          <p className="eyebrow">Pricing</p>
          <h2>Keep every charge separate</h2>

          <label className="field">
            <span>Book price, cents</span>
            <input
              type="number"
              min="0"
              step="1"
              value={settings.product.priceCents}
              onChange={(event) =>
                update("product", {
                  ...settings.product,
                  priceCents: Number(event.target.value)
                })
              }
            />
          </label>

          <label className="field">
            <span>Shipping &amp; handling per order, cents</span>
            <input
              type="number"
              min="0"
              step="1"
              value={settings.product.shippingCents}
              onChange={(event) =>
                update("product", {
                  ...settings.product,
                  shippingCents: Number(event.target.value)
                })
              }
            />
          </label>

          <label className="field">
            <span>Tax notice</span>
            <input
              value={settings.product.taxNotice}
              onChange={(event) =>
                update("product", {
                  ...settings.product,
                  taxNotice: event.target.value
                })
              }
            />
          </label>

          <label className="field">
            <span>Delivery estimate</span>
            <input
              value={settings.product.estimatedShipWindow}
              onChange={(event) =>
                update("product", {
                  ...settings.product,
                  estimatedShipWindow: event.target.value
                })
              }
            />
          </label>
        </div>

        <div className="admin-panel">
          <p className="eyebrow">Published cover</p>
          <h2>Use the real book artwork</h2>

          <label className="field">
            <span>Book-cover source URL</span>
            <input
              type="url"
              value={settings.imagery.bookCoverUrl}
              onChange={(event) =>
                update("imagery", {
                  ...settings.imagery,
                  bookCoverUrl: event.target.value
                })
              }
            />
          </label>

          <label className="check-field">
            <input
              type="checkbox"
              checked={settings.theme.useCoverPalette}
              onChange={(event) =>
                update("theme", {
                  ...settings.theme,
                  useCoverPalette: event.target.checked
                })
              }
            />
            <span>
              Derive the website palette from the cover image
            </span>
          </label>

          <div className="cover-admin-preview">
            <img
              src="/api/book-cover"
              alt="Current published cover source"
              width="300"
              height="450"
            />
            <p>
              The image proxy validates the configured source and
              tries standard Amazon ASIN image forms before using a
              fallback.
            </p>
          </div>
        </div>

        <div className="admin-panel">
          <p className="eyebrow">Opening message</p>
          <h2>Hero copy</h2>

          <label className="field">
            <span>Headline</span>
            <textarea
              rows={4}
              value={settings.copy.heroHook}
              onChange={(event) =>
                update("copy", {
                  ...settings.copy,
                  heroHook: event.target.value
                })
              }
            />
          </label>

          <label className="field">
            <span>Supporting copy</span>
            <textarea
              rows={6}
              value={settings.copy.heroSubhead}
              onChange={(event) =>
                update("copy", {
                  ...settings.copy,
                  heroSubhead: event.target.value
                })
              }
            />
          </label>
        </div>

        <div className="admin-panel">
          <p className="eyebrow">Checkout</p>
          <h2>Stripe configuration</h2>

          <label className="field">
            <span>Payment Link fallback</span>
            <input
              type="url"
              value={settings.checkout.paymentLinkUrl}
              onChange={(event) =>
                update("checkout", {
                  ...settings.checkout,
                  paymentLinkUrl: event.target.value
                })
              }
            />
          </label>

          <label className="check-field">
            <input
              type="checkbox"
              checked={settings.checkout.preferDynamicCheckout}
              onChange={(event) =>
                update("checkout", {
                  ...settings.checkout,
                  preferDynamicCheckout: event.target.checked
                })
              }
            />
            <span>
              Prefer dynamic Checkout Sessions when a server key is
              configured
            </span>
          </label>

          <p className="admin-note">
            Dynamic Checkout makes admin-managed price changes take
            effect immediately. The existing Payment Link remains a
            fixed-price fallback at the current $20 book price and
            $4.95 shipping-and-handling charge.
          </p>
        </div>
      </div>

      <div className="admin-panel">
        <button
          className="text-button"
          type="button"
          onClick={() => setShowAdvanced((value) => !value)}
        >
          {showAdvanced ? "Hide" : "Show"} advanced JSON editor
        </button>
        {showAdvanced ? (
          <>
            <textarea
              className="json-editor"
              value={advancedJson}
              onChange={(event) =>
                setAdvancedJson(event.target.value)
              }
              spellCheck={false}
            />
            <button
              className="button button-secondary"
              type="button"
              onClick={applyAdvancedJson}
            >
              Apply JSON in browser
            </button>
          </>
        ) : null}
      </div>

      <div className="admin-auth-panel">
        <div>
          <label className="field">
            <span>
              GitHub fine-grained token{" "}
              {persistence?.tokenConfigured
                ? "(optional—server token is configured)"
                : "(required for this save)"}
            </span>
            <input
              type="password"
              autoComplete="off"
              value={githubToken}
              onChange={(event) =>
                setGithubToken(event.target.value)
              }
              placeholder="github_pat_…"
            />
          </label>
          <small>
            Kept only in this page&apos;s memory and cleared after a
            successful save. Do not use a broad classic token.
          </small>
        </div>
        <div>
          <label className="field">
            <span>Admin passphrase, when configured</span>
            <input
              type="password"
              autoComplete="off"
              value={adminToken}
              onChange={(event) =>
                setAdminToken(event.target.value)
              }
            />
          </label>
        </div>
      </div>

      <div className="admin-savebar">
        <span>{status}</span>
        <button
          className="button button-primary"
          type="button"
          onClick={save}
          disabled={saving}
        >
          {saving ? "Saving to GitHub…" : "Save to GitHub"}
        </button>
      </div>
    </section>
  );
}
