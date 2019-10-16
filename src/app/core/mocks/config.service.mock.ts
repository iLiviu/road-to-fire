import { AppStorage } from '../models/app-storage';

class MockAppStorage implements AppStorage {
  readConfig(): Promise<import('../models/app-storage').AppConfig> {
    throw new Error('Method not implemented.');
  }

  saveConfig(cfg: import('../models/app-storage').AppConfig): Promise<void> {
    throw new Error('Method not implemented.');
  }
  setChangeListener(listener: (event: import('../services/storage.service').StorageChangeEvent) => void): void {
    throw new Error('Method not implemented.');
  }
  wipeStorage(): Promise<void> {
    throw new Error('Method not implemented.');
  }
  getId(): string {
    return 'roadtofire';
  }
  export(): Promise<any> {
    throw new Error('Method not implemented.');
  }
  import(exportedData: any): Promise<void> {
    throw new Error('Method not implemented.');
  }


}

export class MockConfigService {

  readonly storage: AppStorage;

  constructor() {
    this.storage = new MockAppStorage();
  }

}
