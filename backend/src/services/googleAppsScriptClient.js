const TIMEOUT_MS = 15000;

class GoogleAppsScriptClient {
  getConfig() {
    return {
      url: (process.env.GOOGLE_APPS_SCRIPT_URL || '').trim(),
      secret: (process.env.GOOGLE_APPS_SCRIPT_SECRET || '').trim()
    };
  }

  isConfigured() {
    const { url, secret } = this.getConfig();
    return Boolean(url && secret);
  }

  async sendMail({ to, subject, html, text }) {
    const { url, secret } = this.getConfig();
    if (!url || !secret) {
      return {
        sent: false,
        reason: 'Google Apps Script delivery is selected but GOOGLE_APPS_SCRIPT_URL or GOOGLE_APPS_SCRIPT_SECRET is missing.'
      };
    }

    let response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ secret, to, subject, html, text }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
        redirect: 'follow'
      });
    } catch (error) {
      const reason = error.name === 'TimeoutError' || error.name === 'AbortError'
        ? 'Google Apps Script email request timed out.'
        : `Google Apps Script email request failed: ${error.message}`;
      return { sent: false, reason };
    }

    let result;
    try {
      result = await response.json();
    } catch {
      return {
        sent: false,
        reason: `Google Apps Script returned a non-JSON response (HTTP ${response.status}). Check the deployed Web App URL and deployment access.`
      };
    }

    if (!response.ok || result.ok !== true) {
      return {
        sent: false,
        reason: result.error || `Google Apps Script rejected the email request (HTTP ${response.status}).`
      };
    }

    return {
      sent: true,
      message: 'Google Apps Script accepted the verification email for delivery.'
    };
  }
}

module.exports = new GoogleAppsScriptClient();
