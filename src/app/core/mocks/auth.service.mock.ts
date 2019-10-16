export class MockAuthService {
  authenticated = false;
  canLogin = false;

  private storedPassword = '';

  constructor() {
  }

  /**
   * Get user's password from localStorage
   */
  getStoredPassword(): string {
    return this.storedPassword;
  }

  /**
   * Store user's password in localStorage (in plaintext)
   * @param value user password
   */
  storePassword(value: string) {
    this.storedPassword = value;
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
        this.storePassword(password);
      } else {
        this.storePassword(null);
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
}
