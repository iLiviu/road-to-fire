import { Injectable } from '@angular/core';

import { StorageService, StorageChangeEvent, StorageChangeOrigin } from './storage.service';
import { EventsService, AppEventType } from './events.service';
import { AppStorage, AppConfig } from '../models/app-storage';
import { AppStorageService, CONFIG_PATH, PASS_HASH_PATH } from './app-storage.service';
import { LoggerService } from './logger.service';
import { LocaleService, LocaleIDs } from './locale-service';


const CONFIG_VERSION = 1;
const CONFIG_THEME_KEY = 'roadtofire:theme';
export const APP_THEMES = {
    LIGHT : 'light',
    DARK : 'dark'
};
/**
 * Error thrown whenever the saved configuration's object format version is
 * newer than what the app expects.
 */
export class UnsupportedConfigVersionError extends Error {
  constructor(message?: string) {
    super(message);
    // Set the prototype explicitly.
    Object.setPrototypeOf(this, UnsupportedConfigVersionError.prototype);
  }
}

/**
 * Service that provides app configuration. Interacts with storage service to read/write configuration
 */
@Injectable({
  providedIn: 'root'
})
export class ConfigService {

  readonly storage: AppStorage;

  private configLoaded = false;

  constructor(private storageService: StorageService, private appStorageService: AppStorageService, private eventsService: EventsService,
    private logger: LoggerService, private localeService: LocaleService) {
    this.storage = this.appStorageService.storage;
    this.initStorage();
  }

  initStorage() {
    const self = this;

    this.storage.setChangeListener(async (event: StorageChangeEvent) => {
      if (event.origin === StorageChangeOrigin.remote || event.origin === StorageChangeOrigin.conflict) {
        if (event.newValue === null && event.oldValue === null) {
          // data is encrypted with unknown password. we need to reload page
          self.eventsService.encryptionStateChangedRemotely();
        } else if (event.relativePath === CONFIG_PATH) {
          // delay notifications until sync is complete
          await self.storageService.waitForSync();

          // check if locale changed remotely and replace local cached one
          const cfg = await self.readConfig();
          if (cfg.dateAndCurrencyFormat !== this.localeService.getCurrentLocale()) {
            this.localeService.setCurrentLocale(cfg.dateAndCurrencyFormat);
          }

          self.eventsService.configUpdatedRemotely(self.storage.getId());
        } else if (event.relativePath === PASS_HASH_PATH) {

        }
      }
    });

    // only load config when storage is ready
    this.eventsService.events$.subscribe(
      event => {
        switch (event.type) {
          case AppEventType.STORAGE_READY: this.readConfig();
            break;
        }
      });

  }

  /**
   * @return `true` if config has already been loaded, `false` otherwise
   */
  isConfigLoaded() {
    return this.configLoaded;
  }

  /**
   * Load configuration from storage, or provide a default one, if no configuration was
   * stored already
   */
  async readConfig(): Promise<AppConfig> {
    this.configLoaded = false;
    let cfg = await this.storage.readConfig();
    if (!cfg) {
      cfg = {
        dateAndCurrencyFormat: LocaleIDs.EN_US,
        saveOnCloud: false,
        version: CONFIG_VERSION,
        wizardDone: false,
      };
    } else {
      // throw error if config version is newer, to avoid any silent errors cased by different format
      if (cfg.version && cfg.version > CONFIG_VERSION) {
        this.logger.error('Config was saved with a newer version of the app! Update app first!');
        throw new UnsupportedConfigVersionError(`Unsupported config version: ${cfg.version}`);
      }
    }
    this.configLoaded = true;
    // on imports we may have incorrect cloud sync state stored so we may need to fix it by getting the actual state.
    cfg.saveOnCloud = cfg.saveOnCloud || this.storageService.isCloudSyncEnabled();
    if (cfg.saveOnCloud) {
      this.storageService.toggleCloudSync(true);
    }
    this.eventsService.configLoaded(this.storage.getId(), cfg);
    return cfg;
  }

  /**
   * Stores the app configuration, and enables/disables
   * cloud sync, if user required so.
   * @param config app config
   */
  async saveConfig(config: AppConfig): Promise<void> {
    await this.storage.saveConfig(config);
    this.storageService.toggleCloudSync(config.saveOnCloud);
    this.localeService.setCurrentLocale(config.dateAndCurrencyFormat);
  }

  /**
   * Get the theme that has been saved in local storage
   * @returns identifier for current stored theme
   */
  getStoredTheme() {
    const value = localStorage.getItem(CONFIG_THEME_KEY) || APP_THEMES.LIGHT;
    return value;
  }

  /**
   * Update the current theme by storing it in the local storage
   * @param newValue theme identifier
   */
  setCurrentTheme(newValue: string) {
    localStorage.setItem(CONFIG_THEME_KEY, newValue);
    this.eventsService.themeChanged(newValue);
  }


}
