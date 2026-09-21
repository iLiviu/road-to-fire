import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';

import { StorageService, UnsupportedEncryptionError } from './storage.service';
import { EventsService } from './events.service';
import { APP_CONSTS } from 'src/app/config/app.constants';
import { LoggerService } from './logger.service';

interface LocalStored2FACredential {
  id: string;
  type: 'public-key';
  transports?: Array<'usb' | 'nfc' | 'ble' | 'internal'>;
  salt: string;
  encryptedPassword: string;
  authMethod?: 'prf' | 'webauthn';
  wrappedKey?: string;
  wrappedMasterKeyWebAuthn?: string;
  wrappedMasterKeyPrf?: string;
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
  private inMemoryPassword: string | null = null;

  constructor(private storageService: StorageService, private eventsService: EventsService,
    private logger: LoggerService) {
  }

  /**
   * Get user's password from memory or localStorage
   */
  getStoredPassword(): string {
    if (this.inMemoryPassword) {
      return this.inMemoryPassword;
    }
    const storedPassword = localStorage.getItem(CONFIG_PASSWORD_KEY);
    return storedPassword || '';
  }

  /**
   * Checks if password is stored permanently in localStorage (plaintext or 2FA encrypted)
   */
  hasPermanentStoredPassword(): boolean {
    return Boolean(localStorage.getItem(CONFIG_PASSWORD_KEY) || this.is2FAEnabled());
  }

  /**
   * Store user's password in memory, and in localStorage if permanent storage is requested.
   * Session storage is not used.
   * @param value user password
   * @param permanent whether to store in localStorage
   */
  storePassword(value: string, permanent: boolean) {
    this.inMemoryPassword = value;
    if (permanent) {
      if (!value) {
        localStorage.removeItem(CONFIG_PASSWORD_KEY);
        localStorage.removeItem(CONFIG_2FA_CREDENTIAL);
      } else if (this.is2FAEnabled()) {
        // Plaintext password is removed when 2FA is enabled
        localStorage.removeItem(CONFIG_PASSWORD_KEY);
      } else {
        localStorage.setItem(CONFIG_PASSWORD_KEY, value);
      }
    } else {
      localStorage.removeItem(CONFIG_PASSWORD_KEY);
      localStorage.removeItem(CONFIG_2FA_CREDENTIAL);
    }
    sessionStorage.removeItem(CONFIG_PASSWORD_KEY);
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
      this.inMemoryPassword = password;
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
      if (this.is2FAEnabled() && (await this.isWebAuthnAvailable())) {
        const storedCredential = this.getStored2FACredential();
        if (storedCredential) {
          const passed2FA = await this.authenticate2FA(storedCredential);
          if (!passed2FA) {
            return false;
          }
          const validPass = await this.storageService.verifyPassword(this.inMemoryPassword);
          if (!validPass) {
            this.clearAuthStorageData();
            return false;
          }
        } else {
          return false;
        }
      } else {
        const storedPassword = this.getStoredPassword();
        const validPass = await this.storageService.verifyPassword(storedPassword);
        if (!validPass) {
          // invalidate stored password
          this.storePassword('', true);
          return false;
        }
        if (storedPassword) {
          this.inMemoryPassword = storedPassword;
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
        // User verifying platform authenticator is not available on this browser.
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
  is2FAEnabled(): boolean {
    return Boolean(this.getStored2FACredential());
  }

  /**
   * Enables 2 factor authentication (encrypts stored password using WebAuthn PRF derived key)
   */
  async enable2FA(password?: string): Promise<boolean> {
    const pwd = password || this.inMemoryPassword || this.getStoredPassword();
    if (!pwd) {
      this.logger.error('Cannot enable 2FA: No password available to encrypt');
      return false;
    }
    const registered = await this.register2FA(pwd);
    if (registered) {
      localStorage.removeItem(CONFIG_PASSWORD_KEY);
      return true;
    }
    return false;
  }

  /**
   * Disables 2 factor authentication
   */
  disable2FA() {
    localStorage.removeItem(CONFIG_2FA_CREDENTIAL);
    localStorage.removeItem(CONFIG_PASSWORD_KEY);
  }

  /**
   * Clears password and 2fa data from storage and memory
   */
  clearAuthStorageData() {
    localStorage.removeItem(CONFIG_2FA_CREDENTIAL);
    localStorage.removeItem(CONFIG_PASSWORD_KEY);
    sessionStorage.removeItem(CONFIG_PASSWORD_KEY);
    this.inMemoryPassword = null;
    this.authenticated = false;
  }

  private async register2FA(password: string): Promise<boolean> {
    try {
      const salt = this.generateRandomBuffer(32);
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
        },
        extensions: {
          prf: {
            eval: {
              first: salt,
            }
          }
        } as any
      };

      const attestation = <PublicKeyCredential>await navigator.credentials.create({ 'publicKey': publicKey });
      if (attestation) {
        const extResults: any = attestation.getClientExtensionResults ? attestation.getClientExtensionResults() : {};
        let prfKey: ArrayBuffer = extResults?.prf?.results?.first;

        const rawIdBytes = new Uint8Array(attestation.rawId);

        // Generate master key to encrypt password
        const masterKey = this.generateRandomBuffer(32);
        const masterKeyHex = uint8ArrayToHex(masterKey);
        const encryptedPassword = CryptoJS.AES.encrypt(password, masterKeyHex).toString();

        // WebAuthn-guarded key wraps master key
        const webAuthnKey = this.getWebAuthnKey(salt, rawIdBytes);
        const wrappedMasterKeyWebAuthn = CryptoJS.AES.encrypt(masterKeyHex, webAuthnKey).toString();

        const credential: LocalStored2FACredential = {
          type: 'public-key',
          id: uint8ArrayToBase64(rawIdBytes),
          salt: uint8ArrayToBase64(salt),
          encryptedPassword: encryptedPassword,
          wrappedMasterKeyWebAuthn: wrappedMasterKeyWebAuthn,
          authMethod: 'prf',
        };

        // @ts-ignore
        if (attestation.response.getTransports) {
          // @ts-ignore
          credential.transports = attestation.response.getTransports();
        }

        if (!prfKey && extResults?.prf?.enabled) {
          // If PRF eval wasn't returned directly on create, attempt to retrieve via get
          try {
            const assertion = <PublicKeyCredential>await navigator.credentials.get({
              publicKey: {
                challenge: this.generateRandomBuffer(32),
                allowCredentials: [{
                  id: attestation.rawId,
                  transports: credential.transports,
                  type: credential.type,
                }],
                userVerification: 'required',
                extensions: {
                  prf: {
                    eval: {
                      first: salt,
                    }
                  }
                } as any
              }
            });
            const getExtResults: any = assertion?.getClientExtensionResults ? assertion.getClientExtensionResults() : {};
            prfKey = getExtResults?.prf?.results?.first;
          } catch (e) {
            // Ignored, fallback wrapping is already in place
          }
        }

        if (prfKey) {
          const prfHex = uint8ArrayToHex(new Uint8Array(prfKey));
          credential.wrappedMasterKeyPrf = CryptoJS.AES.encrypt(masterKeyHex, prfHex).toString();
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
   * Authenticate the user using WebAuthn and decrypt the stored password
   * @param credentialStr JSON stringified credential descriptor
   */
  private async authenticate2FA(credentialStr: string): Promise<boolean> {
    try {
      const credential: LocalStored2FACredential = JSON.parse(credentialStr);
      const salt = base64ToUint8Array(credential.salt);
      const credentialIdBytes = base64ToUint8Array(credential.id);
      const publicKey: PublicKeyCredentialRequestOptions = {
        challenge: this.generateRandomBuffer(32),
        allowCredentials: [{
          id: credentialIdBytes,
          transports: credential.transports,
          type: credential.type,
        }],
        userVerification: 'required',
        extensions: {
          prf: {
            eval: {
              first: salt,
            }
          }
        } as any
      };
      const newCredentialInfo = <PublicKeyCredential>await navigator.credentials.get({ 'publicKey': publicKey });
      if (!newCredentialInfo) {
        return false;
      }

      const extResults: any = newCredentialInfo.getClientExtensionResults ? newCredentialInfo.getClientExtensionResults() : {};
      const prfKey: ArrayBuffer = extResults?.prf?.results?.first;

      let masterKeyHex = '';

      // 1. Try PRF unwrap if PRF key is available and wrapper exists
      if (prfKey && credential.wrappedMasterKeyPrf) {
        try {
          const prfHex = uint8ArrayToHex(new Uint8Array(prfKey));
          const bytes = CryptoJS.AES.decrypt(credential.wrappedMasterKeyPrf, prfHex);
          masterKeyHex = bytes.toString(CryptoJS.enc.Utf8);
        } catch (e) {}
      }

      // 2. Try WebAuthn unwrap if masterKeyHex not yet recovered
      if (!masterKeyHex && credential.wrappedMasterKeyWebAuthn) {
        try {
          const webAuthnKey = this.getWebAuthnKey(salt, credentialIdBytes);
          const bytes = CryptoJS.AES.decrypt(credential.wrappedMasterKeyWebAuthn, webAuthnKey);
          masterKeyHex = bytes.toString(CryptoJS.enc.Utf8);
        } catch (e) {}
      }

      let decryptedPassword = '';
      if (masterKeyHex) {
        try {
          const bytes = CryptoJS.AES.decrypt(credential.encryptedPassword, masterKeyHex);
          decryptedPassword = bytes.toString(CryptoJS.enc.Utf8);
        } catch (e) {}
      }

      // 3. Fallback for legacy credential formats
      if (!decryptedPassword) {
        if (prfKey) {
          try {
            decryptedPassword = this.decryptPassword(credential.encryptedPassword, new Uint8Array(prfKey));
          } catch (e) {}
        }
        if (!decryptedPassword && credential.wrappedKey) {
          try {
            const backupKey = this.deobfuscateKey(credential.wrappedKey, credentialIdBytes);
            const derivedKeyHex = this.generateDerivedKey(backupKey, salt, credentialIdBytes);
            const bytes = CryptoJS.AES.decrypt(credential.encryptedPassword, derivedKeyHex);
            decryptedPassword = bytes.toString(CryptoJS.enc.Utf8);
          } catch (e) {}
        }
      }

      if (!decryptedPassword) {
        this.logger.error('Failed to decrypt password with derived 2FA key!');
        // Biometrics succeeded but stored ciphertext could not be decrypted (e.g. legacy/incompatible format).
        // Clear broken 2FA data so user can log in with password and cleanly re-enable.
        localStorage.removeItem(CONFIG_2FA_CREDENTIAL);
        return false;
      }

      // Upgrade: If PRF key is available now but wasn't wrapped during registration, save PRF wrapper
      if (prfKey && masterKeyHex && !credential.wrappedMasterKeyPrf) {
        const prfHex = uint8ArrayToHex(new Uint8Array(prfKey));
        credential.wrappedMasterKeyPrf = CryptoJS.AES.encrypt(masterKeyHex, prfHex).toString();
        this.store2FACredential(JSON.stringify(credential));
      }

      this.inMemoryPassword = decryptedPassword;
      return true;
    } catch (err) {
      this.logger.error(`Two Factor authentication error!`, err);
    }
    return false;
  }

  /**
   * Encrypt password using AES and derived PRF key
   */
  private encryptPassword(password: string, keyBytes: Uint8Array): string {
    const keyHex = uint8ArrayToHex(keyBytes);
    return CryptoJS.AES.encrypt(password, keyHex).toString();
  }

  /**
   * Decrypt ciphertext using AES and derived PRF key
   */
  private decryptPassword(ciphertext: string, keyBytes: Uint8Array): string {
    const keyHex = uint8ArrayToHex(keyBytes);
    const bytes = CryptoJS.AES.decrypt(ciphertext, keyHex);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  private getWebAuthnKey(salt: Uint8Array, rawId: Uint8Array): string {
    const saltHex = uint8ArrayToHex(salt);
    const rawIdHex = uint8ArrayToHex(rawId);
    const combined = CryptoJS.enc.Hex.parse(saltHex + rawIdHex);
    return CryptoJS.SHA256(combined).toString();
  }

  private generateDerivedKey(key: Uint8Array, salt: Uint8Array, rawId: Uint8Array): string {
    const keyHex = uint8ArrayToHex(key);
    const saltHex = uint8ArrayToHex(salt);
    const rawIdHex = uint8ArrayToHex(rawId);
    const combined = CryptoJS.enc.Hex.parse(keyHex + saltHex + rawIdHex);
    return CryptoJS.SHA256(combined).toString();
  }

  private obfuscateKey(key: Uint8Array, rawId: Uint8Array): string {
    const result = new Uint8Array(key.length);
    for (let i = 0; i < key.length; i++) {
      result[i] = key[i] ^ (rawId[i % rawId.length] || 0x5a);
    }
    return uint8ArrayToBase64(result);
  }

  private deobfuscateKey(obfuscatedBase64: string, rawId: Uint8Array): Uint8Array {
    const bytes = base64ToUint8Array(obfuscatedBase64);
    const result = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
      result[i] = bytes[i] ^ (rawId[i % rawId.length] || 0x5a);
    }
    return result;
  }

  /**
   * Get stored 2FA credential
   */
  private getStored2FACredential() {
    const credential = localStorage.getItem(CONFIG_2FA_CREDENTIAL);
    return credential;
  }

  /**
   * Store 2FA credential
   */
  private store2FACredential(credential: string) {
    return localStorage.setItem(CONFIG_2FA_CREDENTIAL, credential);
  }

  /**
   * Generate a random set of characters with a specified length
   * @param length length of buffer
   */
  private generateRandomBuffer(length: number): Uint8Array {
    const result = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      result[i] = Math.floor(Math.random() * 256);
    }
    return result;
  }
}

function uint8ArrayToHex(bytes: Uint8Array): string {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
