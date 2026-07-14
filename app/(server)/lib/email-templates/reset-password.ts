import { EMAIL_THEME } from "./theme";

export function buildResetPasswordHtml(url: string): string {
  return `
  <html>
    <body style="font-family: ${EMAIL_THEME.font}; background-color: ${EMAIL_THEME.bgBody}; color: ${EMAIL_THEME.textPrimary}; padding: 40px;">
      <div style="max-width: 500px; margin: 0 auto; background-color: ${EMAIL_THEME.bgCard}; border: 1px solid ${EMAIL_THEME.border}; border-radius: 16px; padding: 32px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: ${EMAIL_THEME.accentText}; font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; margin: 0;">Splashdeals <span style="color: ${EMAIL_THEME.textSecondary};">Admin</span></h1>
        </div>
        <p style="font-size: 16px; line-height: 1.6; color: ${EMAIL_THEME.textSecondary}; margin-bottom: 24px;">
          A password reset was requested for your Splashdeals Admin account. Click the button below to set a new password. This link expires in 1 hour.
        </p>
        <div style="text-align: center; margin-bottom: 32px;">
          <a href="${url}" style="display: inline-block; background-color: ${EMAIL_THEME.accentText}; color: ${EMAIL_THEME.bgBody}; padding: 14px 32px; font-size: 14px; font-weight: 800; text-decoration: none; border-radius: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Reset Password</a>
        </div>
        <p style="font-size: 12px; color: ${EMAIL_THEME.textDarkMuted}; text-align: center; margin: 0;">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
      <div style="text-align: center; margin-top: 24px; color: ${EMAIL_THEME.textDarkMuted}; font-size: 10px; text-transform: uppercase; letter-spacing: 0.2em;">
        Splashdeals.rs &bull; Internal Portal
      </div>
    </body>
  </html>
  `;
}
