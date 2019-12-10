import { Injectable } from '@angular/core';

import { StorageService, UnsupportedEncryptionError } from './storage.service';
import { EventsService } from './events.service';
import { APP_CONSTS } from 'src/app/config/app.constants';
import { LoggerService } from './logger.service';

interface LocalPublicKeyCredentialDescriptor {
  id: string;
  type: 'public-key';
  transports?: Array<'usb' | 'nfc' | 'ble' | 'internal'>;
}

const CONFIG_PASSWORD_KEY = 'roadtofire:config_password';
const CONFIG_2FA_CREDENTIAL = 'roadtofire:config_2fa_cred';
/**
 * Service that handles user authentication. If storage is encrypted, the user will be required to
 * provide a password to access restricted area.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authenticated = false;

  constructor(private storageService: StorageService, private eventsService: EventsService,
    private logger: LoggerService) {
  }

  /**
   * Get user's password from localStorage
   */
  getStoredPassword(): string {
    let storedPassword = localStorage.getItem(CONFIG_PASSWORD_KEY);
    if (!storedPassword) {
      storedPassword = sessionStorage.getItem(CONFIG_PASSWORD_KEY);
    }
    return storedPassword;
  }

  /**
   * Checks if password is stored in localStorage or not
   */
  hasPermanentStoredPassword(): boolean {
    return localStorage.getItem(CONFIG_PASSWORD_KEY) ? true : false;
  }

  /**
   * Store user's password in localStorage (in plaintext)
   * @param value user password
   */
  storePassword(value: string, permanent: boolean) {
    if (permanent) {
      localStorage.setItem(CONFIG_PASSWORD_KEY, value);
    }
    sessionStorage.setItem(CONFIG_PASSWORD_KEY, value);
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
    const response = await this.storageService.verifyPassword(password);
    if (response) {
      this.authenticated = true;
      this.storePassword(password, rememberMe);
    }
    return response;
  }


  /**
   * check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    if (this.authenticated) {
      return true;
    }

    try {
      const storedPassword = this.getStoredPassword();
      const validPass = await this.storageService.verifyPassword(storedPassword);
      if (!validPass) {
        // invalidate stored password
        this.storePassword('', true);
        return false;
      }

      if (this.storageService.isEncryptionEnabled() && this.isWebAuthnAvailable()) {
        const storedCredential = this.getStored2FACredential();
        if (storedCredential) {
          const passed2FA = await this.authenticate2FA(storedCredential);
          if (!passed2FA) {
            return false;
          }
        }
      }

    } catch (e) {
      if (e instanceof UnsupportedEncryptionError) {
        return false; // unauthenticated
      } else {
        throw e;
      }
    }
    this.authenticated = true;
    this.eventsService.storageReady();
    return true;
  }

  /**
   * Checks if WebAuthn is available in browser
   */
  async isWebAuthnAvailable(): Promise<boolean> {
    try {
      // @ts-ignore
      if (typeof PublicKeyCredential !== 'undefined' &&
        // @ts-ignore
        typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable !== 'undefined') {
        // @ts-ignore
        const response: boolean = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        return response;
      } else {
        // User verifying platform authenticator is not available on this browser.`)
        return false;
      }
    } catch (err) {
      // WebAuthn failed
      return false;
    }
  }

  /**
   * Returns the current state of 2FA
   */
  is2FAEnabled() {
    return this.getStored2FACredential() ? true : false;
  }

  /**
   * Enables 2 factor authentication (used when password is stored on device)
   */
  async enable2FA() {
    const registered = await this.register2FA();
    return registered;
  }

  /**
   * Disables 2 factor authentication
   */
  disable2FA() {
    localStorage.removeItem(CONFIG_2FA_CREDENTIAL);
  }

  /**
   * Clears password and 2fa data from local storage
   */
  clearAuthStorageData() {
    this.disable2FA();
    this.storePassword(null, true);
  }

  private async register2FA(): Promise<boolean> {
    try {
      const publicKey: PublicKeyCredentialCreationOptions = {

        challenge: this.generateRandomBuffer(32),
        rp: {
          name: APP_CONSTS.TITLE,
        },
        user: {
          id: Uint8Array.from(window.atob('user'), c => c.charCodeAt(0)),
          name: 'user',
          displayName: 'user',
        },
        pubKeyCredParams:
          [
            { type: 'public-key', alg: -7 },
            { type: 'public-key', alg: -35 },
            { type: 'public-key', alg: -36 },
            { type: 'public-key', alg: -257 },
            { type: 'public-key', alg: -258 },
            { type: 'public-key', alg: -259 },
            { type: 'public-key', alg: -37 },
            { type: 'public-key', alg: -38 },
            { type: 'public-key', alg: -39 }
          ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          requireResidentKey: false,
          userVerification: 'required',
        }
      };

      const attestation = <PublicKeyCredential>await navigator.credentials.create({ 'publicKey': publicKey });
      if (attestation) {
        const credential: LocalPublicKeyCredentialDescriptor = {
          type: 'public-key',
          id: base64Encode(attestation.rawId),
        };

        // @ts-ignore
        if (attestation.response.getTransports) {
          // @ts-ignore
          credential.transports = attestation.response.getTransports();
        }

        this.store2FACredential(JSON.stringify(credential));
        return true;
      }
    } catch (err) {
      this.logger.error(`Two Factor registration error!`, err);
    }
    return false;
  }

  /**
   * Authenticate the user using Webauthn
   * @param credential credential to authenticate
   */
  private async authenticate2FA(credentialStr: string): Promise<boolean> {
    try {
      const credential: LocalPublicKeyCredentialDescriptor = JSON.parse(credentialStr);
      const publicKey: PublicKeyCredentialRequestOptions = {
        challenge: this.generateRandomBuffer(32),
        allowCredentials: [{
          id: base64Decode(credential.id),
          transports: credential.transports,
          type: credential.type,
        },
        ],
        userVerification: 'required',
      };
      const newCredentialInfo = await navigator.credentials.get({ 'publicKey': publicKey });
      console.log(newCredentialInfo);
      const authenticated = newCredentialInfo.id ? true : false;
      return authenticated;
    } catch (err) {
      this.logger.error(`Two Factor authentication error!`, err);
    }
    return false;
  }

  /**
   * Get stored 2FA credential
   */
  private getStored2FACredential() {
    const credential = localStorage.getItem(CONFIG_2FA_CREDENTIAL);
    return credential;
  }

  /**
   * Get stored 2FA credential
   */
  private store2FACredential(credential: string) {
    return localStorage.setItem(CONFIG_2FA_CREDENTIAL, credential);
  }

  /**
   * Generate a random set of characters with a specified length
   * @param length length of buffer
   */
  private generateRandomBuffer(length) {
    const result = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      result[i] = Math.floor(Math.random() * 256);
    }
    return result;
  }
}

function base64Decode(str: string) {
  return Uint8Array.from(atob(str), c => c.charCodeAt(0));
}

function base64Encode(bin: ArrayBuffer) {
  return btoa(new Uint8Array(bin).reduce(
    (s, byte) => s + String.fromCharCode(byte), ''
  ));
}
