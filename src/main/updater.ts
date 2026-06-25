import { autoUpdater } from 'electron-updater';
import { BrowserWindow, dialog } from 'electron';

/**
 * In-place auto-update from GitHub Releases (electron-updater). Checks on
 * launch, downloads in the background, then offers to restart — and applies
 * automatically on the next quit. Updates install over the existing app, so
 * users never uninstall/reinstall.
 *
 * Platform note: Windows (NSIS) auto-update works for unsigned builds. macOS
 * auto-update requires a signed + notarized app (Squirrel.Mac), so on an
 * unsigned macOS build the check fails gracefully (logged, no crash) and users
 * upgrade by downloading the new .dmg.
 */
export function initAutoUpdater(): void {
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('update-downloaded', (info) => {
    const win = BrowserWindow.getAllWindows()[0];
    const options = {
      type: 'info' as const,
      buttons: ['Restart now', 'Later'],
      defaultId: 0,
      cancelId: 1,
      title: 'Update ready',
      message: `DayONE ${info.version} has been downloaded.`,
      detail:
        'Restart to update now, or it will be applied automatically the next time you quit.',
    };
    const choice = win
      ? dialog.showMessageBoxSync(win, options)
      : dialog.showMessageBoxSync(options);
    if (choice === 0) {
      autoUpdater.quitAndInstall();
    }
  });

  autoUpdater.on('error', (err) => {
    console.error('Auto-update error:', err == null ? 'unknown' : err.message);
  });

  void autoUpdater.checkForUpdates();
}
