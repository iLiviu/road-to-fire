export class MockStorageService {

  encryptionEnabled = false;
  correctPassword = 'test-password';

  waitForSync() {
    return Promise.resolve();
  }

  isEncryptionEnabled(): boolean {
    return this.encryptionEnabled;
  }

  verifyPassword(password: string): Promise<boolean> {
    return Promise.resolve(!this.encryptionEnabled || password === this.correctPassword);
  }

}
