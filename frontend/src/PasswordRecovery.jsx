import { useState } from "react";

async function submitRequest(path, body) {
  let response;
  try {
    response = await fetch(path, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Could not reach the store. Check your connection and try again.");
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = data?.detail || (data && typeof data === "object"
      ? Object.values(data).flat().join(" ")
      : "");
    throw new Error(detail || `Request failed (${response.status}).`);
  }
  return data;
}

export default function PasswordRecovery({ onBackToLogin }) {
  const params = new URLSearchParams(window.location.search);
  const uid = params.get("uid") || "";
  const token = params.get("token") || "";
  const isReset = window.location.pathname.replace(/\/+$/, "") === "/reset-password";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    const form = new FormData(event.currentTarget);
    try {
      if (isReset) {
        const password = String(form.get("new_password") || "");
        const confirmation = String(form.get("confirm_password") || "");
        if (password !== confirmation) {
          throw new Error("The passwords do not match.");
        }
        const result = await submitRequest("/api/auth/password-reset/confirm/", {
          uid,
          token,
          new_password: password,
        });
        setNotice(result.detail);
        event.currentTarget.reset();
      } else {
        const result = await submitRequest("/api/auth/password-reset/", {
          email: String(form.get("email") || "").trim(),
        });
        setNotice(result.detail);
        event.currentTarget.reset();
      }
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="recovery-shell">
      <header className="admin-header">
        <a className="admin-brand" href="/">LIVING SPACE<span>.</span></a>
        <a className="admin-store-link" href="/">Back to storefront <span aria-hidden="true">↗</span></a>
      </header>
      <section className="recovery-card">
        <p className="admin-eyebrow">ACCOUNT RECOVERY</p>
        <h1>{isReset ? "Choose a new password." : "Forgot your password?"}</h1>
        <p className="admin-intro">
          {isReset
            ? "Create a new password for your Living Space account."
            : "Enter the email address on your account and we’ll send a reset link if it matches."}
        </p>
        {error && <p className="admin-alert" role="alert">{error}</p>}
        {notice && <p className="admin-notice" role="status">{notice}</p>}
        {isReset && (!uid || !token) ? (
          <p className="admin-alert" role="alert">This reset link is incomplete. Request a new one.</p>
        ) : !notice && (
          <form className="recovery-form" onSubmit={submit}>
            {isReset ? (
              <>
                <label>New password<input name="new_password" type="password" autoComplete="new-password" minLength={8} required /></label>
                <label>Confirm new password<input name="confirm_password" type="password" autoComplete="new-password" minLength={8} required /></label>
              </>
            ) : (
              <label>Email<input name="email" type="email" autoComplete="email" required /></label>
            )}
            <button className="admin-primary-button" disabled={busy} type="submit">
              {busy ? "Please wait…" : isReset ? "Reset password" : "Send reset link"}
            </button>
          </form>
        )}
        <button className="recovery-back-button" onClick={onBackToLogin} type="button">Back to log in</button>
      </section>
    </main>
  );
}
