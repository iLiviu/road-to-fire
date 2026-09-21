export class MockAuthService {
  authenticated = false;
  canLogin = false;
  twoFactorEnabled = false;
  webAuthnAvailable = true;

  private storedPassword = '';

  constructor() {
  }

  /**
   * Get user's password from memory or localStorage
   */
  getStoredPassword(): string {
    return this.storedPassword;
  }

  /**
   * Checks if password is stored permanently
   */
  hasPermanentStoredPassword(): boolean {
    return Boolean(this.storedPassword || this.twoFactorEnabled);
  }

  /**
   * Store user's password
   * @param value user password
   */
  storePassword(value: string, permanent?: boolean) {
    this.storedPassword = value || '';
  }

  /**
   * returns true if user is already authenticated
   */
  isLoggedIn() {
    return this.authenticated;
  }

  /**
   * Verify if user provided password is correct
   * @param password user password
   * @param rememberMe if true, stores the password in localStorage to be used when user reloads the app
   */
  async authenticate(password: string, rememberMe: boolean): Promise<boolean> {
    if (this.canLogin) {
      this.authenticated = true;
      if (rememberMe) {
        this.storePassword(password, true);
      } else {
        this.storePassword(password, false);
      }
    }
    return this.canLogin;
  }

  /**
   * check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    return this.authenticated;
  }

  async isWebAuthnAvailable(): Promise<boolean> {
    return this.webAuthnAvailable;
  }

  is2FAEnabled(): boolean {
    return this.twoFactorEnabled;
  }

  async enable2FA(password?: string): Promise<boolean> {
    this.twoFactorEnabled = true;
    return true;
  }

  disable2FA() {
    this.twoFactorEnabled = false;
  }

  clearAuthStorageData() {
    this.storedPassword = '';
    this.twoFactorEnabled = false;
    this.authenticated = false;
  }
}
