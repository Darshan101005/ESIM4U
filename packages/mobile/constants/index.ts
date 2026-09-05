// App identity
export const APP_NAME = "ESIM4U";

// The live site the app wraps. Change to a staging URL for testing if needed.
export const SITE_URL = "https://esim4u.uk";
export const LOGIN_URL = `${SITE_URL}/login`;
export const DASHBOARD_URL = `${SITE_URL}/dashboard`;
export const ADMIN_URL = `${SITE_URL}/admin`;

// The marketing landing page is not shown inside the app — any attempt to open
// the site root is redirected to the login page instead.
export const LANDING_REDIRECT_TO = LOGIN_URL;

// How long the branded loading animation shows after the native splash (ms).
export const LOADING_DURATION_MS = 2500;

export const COLORS = {
  brand: "#FF561E",
  brandDark: "#E04B18",
  white: "#FFFFFF",
  bgLight: "#F8F9FB",
  bgDark: "#0F1115",
  text: "#1A1D20",
  textMuted: "#6B7280",
};

export const STORAGE_KEYS = {
  // Tracks whether the user is logged in (set once the WebView reaches the
  // dashboard, cleared at the login/landing page). Drives whether the
  // "Get Started" screen shows on launch.
  loggedIn: "esim4u:logged-in",
};
