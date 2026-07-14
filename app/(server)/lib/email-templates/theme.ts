export const EMAIL_THEME = {
  bgBody: "#020617",
  bgCard: "#0f172a",
  border: "#1e293b",
  textPrimary: "#f8fafc",
  textSecondary: "#94a3b8",
  textMuted: "#64748b",
  textDarkMuted: "#475569",
  accent: "#06b6d4",
  accentLight: "#38bdf8",
  accentDark: "#0e7490",
  accentText: "#22d3ee",
  font: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
} as const;

export const EMAIL_COMMON_STYLES = `
  body {
    margin: 0;
    padding: 0;
    width: 100% !important;
    -webkit-text-size-adjust: 100%;
    -ms-text-size-adjust: 100%;
    background-color: ${EMAIL_THEME.bgBody};
    font-family: ${EMAIL_THEME.font};
  }
  img {
    border: 0;
    outline: none;
    text-decoration: none;
  }
`;
