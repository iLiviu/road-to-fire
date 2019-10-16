export let canInstallApp = false;
export let installAppEvent;

window.addEventListener('beforeinstallprompt', (e) => {
  installAppEvent = e;
  canInstallApp = true;
});
