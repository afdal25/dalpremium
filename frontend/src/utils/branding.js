const APP_LOGO_CACHE_KEY = "dalpremiumLogoUrl";

const isLegacyLogo = (value = "") =>
  value.includes("/logofix.png") || value.includes("/favicon.png");

export const getCachedLogo = () => {
  const value = localStorage.getItem(APP_LOGO_CACHE_KEY);

  if (!value || isLegacyLogo(value)) {
    return "";
  }

  return value;
};

export const setCachedLogo = (value) => {
  if (!value || isLegacyLogo(value)) {
    localStorage.removeItem(APP_LOGO_CACHE_KEY);
    return "";
  }

  localStorage.setItem(APP_LOGO_CACHE_KEY, value);
  return value;
};
