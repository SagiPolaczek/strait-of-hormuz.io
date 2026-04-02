const ua = navigator.userAgent || '';
const touchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
const smallScreen = window.innerWidth < 1024 || window.innerHeight < 768;
const mobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);

/** True on touch-capable small-screen / mobile-UA devices. */
export const isMobile = touchDevice && (smallScreen || mobileUA);

export function requestFullscreen() {
  const el = document.documentElement;
  const rfs = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
  if (rfs) rfs.call(el);
  try { screen.orientation?.lock('landscape').catch(() => {}); } catch (_) { /* unsupported */ }
}

export function exitFullscreen() {
  const efs = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
  if (efs) efs.call(document);
}

export function isFullscreen() {
  return !!(document.fullscreenElement || document.webkitFullscreenElement);
}

export function toggleFullscreen() {
  if (isFullscreen()) exitFullscreen();
  else requestFullscreen();
}
