import { StorageModule } from '../services/storage.service';

/**
 * Configuration variables for the app (main) storage module
 */
export interface AppConfig {
  saveOnCloud: boolean;
  version: number;
  wizardDone: boolean;
}

/**
 * Storage module responsible for reading and writing the application config
 */
export interface AppStorage extends StorageModule {
  /**
   * Reads the configuration from storage
   */
  readConfig(): Promise<AppConfig>;

  /**
   * Saves the configuration to storage
   * @param cfg app config
   */
  saveConfig(cfg: AppConfig): Promise<void>;
}
