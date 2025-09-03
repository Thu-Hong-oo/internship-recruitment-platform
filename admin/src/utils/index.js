import moment from "moment";

// To prepend Vite's BASE_URL, icons/images work in both localhost (/) and production (/admin/)
export const getPath = (path) => `${import.meta.env.BASE_URL}${path}`;

export function setCssVars() {
  const root = document.documentElement;
  root.style.setProperty("--base-url", import.meta.env.BASE_URL);
  root.style.setProperty("--icon-checked", `url("${import.meta.env.BASE_URL}icons/auth/ic-checked.svg")`);
}

export function exportTableToExcel(tableID, filename = "") {
  TableToExcel.convert(document.getElementById(tableID), {
    name: filename,
  });
}

export function getParamUrlByKey(key) {
  if (!key) return null;
  return new URLSearchParams(window.location.search).get(key);
}

export function setRememberMeCookie(phoneNumber) {
  try {
    const expiresDate = moment().add(30, 'days'); // Remember for 30 days
    const expiresString = expiresDate.utc().format('ddd, DD MMM YYYY HH:mm:ss [GMT]');
    const secure = process.env.NODE_ENV === 'production' ? 'Secure' : '';
    document.cookie = `remember_me_phone=${encodeURIComponent(phoneNumber)}; Path=/; Expires=${expiresString}; ${secure}; SameSite=Strict;`;
  } catch (error) {
    console.error('Failed to set cookie:', error);
  }
}

export function clearRememberMeCookie() {
  document.cookie = `remember_me_phone=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}