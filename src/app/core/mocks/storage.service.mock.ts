export class MockStorageService {

  encryptionEnabled = false;

  waitForSync() {
    return Promise.resolve();
  }

  isEncryptionEnabled(): boolean {
    return this.encryptionEnabled;
  }

}
