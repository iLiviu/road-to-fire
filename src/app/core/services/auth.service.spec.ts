import { TestBed } from '@angular/core/testing';
import * as CryptoJS from 'crypto-js';

import { AuthService, CONFIG_2FA_VERSION } from './auth.service';
import { StorageService } from './storage.service';
import { MockStorageService } from '../mocks/storage.service.mock';
import { EventsService } from './events.service';
import { LoggerService } from './logger.service';
import { MockLoggerService } from '../mocks/loger.service.mock';

const CONFIG_PASSWORD_KEY = 'roadtofire:config_password';
const CONFIG_2FA_CREDENTIAL = 'roadtofire:config_2fa_cred';

describe('AuthService', () => {
  let service: AuthService;
  let mockStorageService: MockStorageService;
  let eventsService: EventsService;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        EventsService,
        { provide: StorageService, useClass: MockStorageService },
        { provide: LoggerService, useClass: MockLoggerService },
      ]
    });

    service = TestBed.inject(AuthService);
    mockStorageService = TestBed.inject(StorageService) as any;
    eventsService = TestBed.inject(EventsService);
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Password storage when rememberMe is false', () => {
    it('should store password only in memory and not in localStorage or sessionStorage', () => {
      service.storePassword('my-secret-pass', false);

      expect(service.getStoredPassword()).toBe('my-secret-pass');
      expect(localStorage.getItem(CONFIG_PASSWORD_KEY)).toBeNull();
      expect(sessionStorage.getItem(CONFIG_PASSWORD_KEY)).toBeNull();
      expect(service.hasPermanentStoredPassword()).toBeFalse();
    });

    it('should authenticate and store password in memory only when rememberMe is false', async () => {
      mockStorageService.encryptionEnabled = true;
      mockStorageService.correctPassword = 'correct-pass';

      const result = await service.authenticate('correct-pass', false);
      expect(result).toBeTrue();
      expect(service.isLoggedIn()).toBeTrue();
      expect(service.getStoredPassword()).toBe('correct-pass');
      expect(localStorage.getItem(CONFIG_PASSWORD_KEY)).toBeNull();
      expect(sessionStorage.getItem(CONFIG_PASSWORD_KEY)).toBeNull();
    });
  });

  describe('Password storage when rememberMe is true and 2FA is disabled', () => {
    it('should store plaintext password in localStorage and memory, but not in sessionStorage', () => {
      service.storePassword('permanent-pass', true);

      expect(service.getStoredPassword()).toBe('permanent-pass');
      expect(localStorage.getItem(CONFIG_PASSWORD_KEY)).toBe('permanent-pass');
      expect(sessionStorage.getItem(CONFIG_PASSWORD_KEY)).toBeNull();
      expect(service.hasPermanentStoredPassword()).toBeTrue();
    });

    it('should authenticate on app revisit using stored plaintext password', async () => {
      mockStorageService.encryptionEnabled = true;
      mockStorageService.correctPassword = 'saved-password';
      localStorage.setItem(CONFIG_PASSWORD_KEY, 'saved-password');

      const authed = await service.isAuthenticated();
      expect(authed).toBeTrue();
      expect(service.isLoggedIn()).toBeTrue();
      expect(service.getStoredPassword()).toBe('saved-password');
    });

    it('should invalidate stored password if incorrect on revisit', async () => {
      mockStorageService.encryptionEnabled = true;
      mockStorageService.correctPassword = 'different-pass';
      localStorage.setItem(CONFIG_PASSWORD_KEY, 'old-wrong-pass');

      const authed = await service.isAuthenticated();
      expect(authed).toBeFalse();
      expect(service.isLoggedIn()).toBeFalse();
      expect(localStorage.getItem(CONFIG_PASSWORD_KEY)).toBeNull();
    });
  });

  describe('Password storage when 2FA is enabled', () => {
    let mockPRFKey: Uint8Array;

    beforeEach(() => {
      mockPRFKey = new Uint8Array(32);
      for (let i = 0; i < 32; i++) {
        mockPRFKey[i] = i + 1;
      }

      spyOn(service, 'isWebAuthnAvailable').and.returnValue(Promise.resolve(true));

      // Mock navigator.credentials.create and navigator.credentials.get
      const mockRawId = new Uint8Array([1, 2, 3, 4, 5]).buffer;
      const mockAttestation: any = {
        rawId: mockRawId,
        response: {
          getTransports: () => ['internal'],
        },
        getClientExtensionResults: () => ({
          prf: {
            results: {
              first: mockPRFKey.buffer,
            }
          }
        })
      };

      const mockAssertion: any = {
        id: 'test-cred-id',
        getClientExtensionResults: () => ({
          prf: {
            results: {
              first: mockPRFKey.buffer,
            }
          }
        })
      };

      spyOn(navigator.credentials, 'create').and.returnValue(Promise.resolve(mockAttestation));
      spyOn(navigator.credentials, 'get').and.returnValue(Promise.resolve(mockAssertion));
    });

    it('should enable 2FA, encrypt the password, and remove plaintext password from localStorage', async () => {
      service.storePassword('secure-pass', true);
      expect(localStorage.getItem(CONFIG_PASSWORD_KEY)).toBe('secure-pass');

      const enabled = await service.enable2FA();
      expect(enabled).toBeTrue();
      expect(service.is2FAEnabled()).toBeTrue();
      expect(service.hasPermanentStoredPassword()).toBeTrue();

      // Plaintext password MUST be removed from localStorage
      expect(localStorage.getItem(CONFIG_PASSWORD_KEY)).toBeNull();
      expect(sessionStorage.getItem(CONFIG_PASSWORD_KEY)).toBeNull();

      // Credential in localStorage must contain encrypted password
      const credStr = localStorage.getItem(CONFIG_2FA_CREDENTIAL);
      expect(credStr).toBeTruthy();
      const cred = JSON.parse(credStr);
      expect(cred.version).toBe(CONFIG_2FA_VERSION);
      expect(cred.encryptedPassword).toBeTruthy();
      expect(cred.encryptedPassword).not.toBe('secure-pass');
    });

    it('should decrypt password and authenticate user on revisit with 2FA', async () => {
      mockStorageService.encryptionEnabled = true;
      mockStorageService.correctPassword = 'secure-pass';

      // First setup 2FA
      service.storePassword('secure-pass', true);
      await service.enable2FA();

      // Simulate a fresh visit by creating a new instance
      const newAuthService = TestBed.inject(AuthService);
      (newAuthService as any).authenticated = false;
      (newAuthService as any).inMemoryPassword = null;

      expect(newAuthService.is2FAEnabled()).toBeTrue();
      expect(localStorage.getItem(CONFIG_PASSWORD_KEY)).toBeNull();

      const authed = await newAuthService.isAuthenticated();
      expect(authed).toBeTrue();
      expect(newAuthService.isLoggedIn()).toBeTrue();
      expect(newAuthService.getStoredPassword()).toBe('secure-pass');
    });

    it('should not store plaintext password in localStorage when 2FA is disabled', async () => {
      service.storePassword('secure-pass', true);
      await service.enable2FA();
      expect(localStorage.getItem(CONFIG_PASSWORD_KEY)).toBeNull();

      service.disable2FA();
      expect(service.is2FAEnabled()).toBeFalse();
      expect(localStorage.getItem(CONFIG_2FA_CREDENTIAL)).toBeNull();
      expect(localStorage.getItem(CONFIG_PASSWORD_KEY)).toBeNull();
      expect(service.getStoredPassword()).toBe('secure-pass');
      expect(service.hasPermanentStoredPassword()).toBeFalse();
    });

    it('should support authenticators that do not return PRF key (e.g. Edge with Windows Hello)', async () => {
      // Re-mock navigator.credentials with NO PRF output
      const nonPrfRawId = new Uint8Array([10, 20, 30, 40]).buffer;
      (navigator.credentials.create as jasmine.Spy).and.returnValue(Promise.resolve({
        rawId: nonPrfRawId,
        response: {},
        getClientExtensionResults: () => ({})
      } as any));

      (navigator.credentials.get as jasmine.Spy).and.returnValue(Promise.resolve({
        id: 'test-cred-id',
        getClientExtensionResults: () => ({})
      } as any));

      mockStorageService.encryptionEnabled = true;
      mockStorageService.correctPassword = 'edge-hello-pass';

      service.storePassword('edge-hello-pass', true);
      const enabled = await service.enable2FA();
      expect(enabled).toBeTrue();
      expect(service.is2FAEnabled()).toBeTrue();
      expect(localStorage.getItem(CONFIG_PASSWORD_KEY)).toBeNull();

      // Clear memory to simulate fresh revisit
      (service as any).authenticated = false;
      (service as any).inMemoryPassword = null;

      const authed = await service.isAuthenticated();
      expect(authed).toBeTrue();
      expect(service.isLoggedIn()).toBeTrue();
      expect(service.getStoredPassword()).toBe('edge-hello-pass');
    });

    it('should support authenticators where PRF is only returned on get (not create)', async () => {
      const nonPrfRawId = new Uint8Array([11, 22, 33, 44]).buffer;
      // create returns NO PRF
      (navigator.credentials.create as jasmine.Spy).and.returnValue(Promise.resolve({
        rawId: nonPrfRawId,
        response: {},
        getClientExtensionResults: () => ({ prf: { enabled: true } })
      } as any));

      // get returns PRF
      (navigator.credentials.get as jasmine.Spy).and.returnValue(Promise.resolve({
        id: 'test-cred-id',
        getClientExtensionResults: () => ({
          prf: {
            results: {
              first: mockPRFKey.buffer,
            }
          }
        })
      } as any));

      mockStorageService.encryptionEnabled = true;
      mockStorageService.correctPassword = 'edge-prf-on-get-pass';

      service.storePassword('edge-prf-on-get-pass', true);
      const enabled = await service.enable2FA();
      expect(enabled).toBeTrue();

      // Clear memory to simulate fresh revisit
      (service as any).authenticated = false;
      (service as any).inMemoryPassword = null;

      const authed = await service.isAuthenticated();
      expect(authed).toBeTrue();
      expect(service.isLoggedIn()).toBeTrue();
      expect(service.getStoredPassword()).toBe('edge-prf-on-get-pass');
    });

    it('should clear corrupted 2FA credential if biometric succeeds but decryption fails', async () => {
      // Put a corrupted/undecryptable credential into localStorage
      const corruptedCred = {
        version: CONFIG_2FA_VERSION,
        type: 'public-key',
        id: 'AQID',
        salt: 'AQID',
        encryptedPassword: 'corrupted-ciphertext',
        wrappedMasterKeyWebAuthn: 'corrupted-wrapper'
      };
      localStorage.setItem(CONFIG_2FA_CREDENTIAL, JSON.stringify(corruptedCred));

      (navigator.credentials.get as jasmine.Spy).and.returnValue(Promise.resolve({
        id: 'test-cred-id',
        getClientExtensionResults: () => ({})
      } as any));

      const authed = await service.isAuthenticated();
      expect(authed).toBeFalse();
      expect(localStorage.getItem(CONFIG_2FA_CREDENTIAL)).toBeNull();
    });

    it('should remove stored 2FA credential and restart login process when 2FA credential has no version', async () => {
      const legacyCredWithoutVersion = {
        type: 'public-key',
        id: 'AQID',
        salt: 'AQID',
        encryptedPassword: 'ciphertext',
      };
      localStorage.setItem(CONFIG_2FA_CREDENTIAL, JSON.stringify(legacyCredWithoutVersion));

      const authed = await service.isAuthenticated();
      expect(authed).toBeFalse();
      expect(localStorage.getItem(CONFIG_2FA_CREDENTIAL)).toBeNull();
      expect(service.is2FAEnabled()).toBeFalse();
    });

    it('should remove stored 2FA credential and restart login process when 2FA credential has mismatched version', async () => {
      const mismatchedVersionCred = {
        version: CONFIG_2FA_VERSION + 1,
        type: 'public-key',
        id: 'AQID',
        salt: 'AQID',
        encryptedPassword: 'ciphertext',
      };
      localStorage.setItem(CONFIG_2FA_CREDENTIAL, JSON.stringify(mismatchedVersionCred));

      const authed = await service.isAuthenticated();
      expect(authed).toBeFalse();
      expect(localStorage.getItem(CONFIG_2FA_CREDENTIAL)).toBeNull();
      expect(service.is2FAEnabled()).toBeFalse();
    });

    it('should remove stored 2FA credential and restart login process when 2FA credential JSON is invalid', async () => {
      localStorage.setItem(CONFIG_2FA_CREDENTIAL, 'invalid-json{');

      const authed = await service.isAuthenticated();
      expect(authed).toBeFalse();
      expect(localStorage.getItem(CONFIG_2FA_CREDENTIAL)).toBeNull();
      expect(service.is2FAEnabled()).toBeFalse();
    });

    it('should fallback to stored password when 2FA credential version is invalid and resume login', async () => {
      mockStorageService.encryptionEnabled = true;
      mockStorageService.correctPassword = 'plain-pass';
      localStorage.setItem(CONFIG_PASSWORD_KEY, 'plain-pass');

      const mismatchedVersionCred = {
        version: 99,
        type: 'public-key',
        id: 'AQID',
        salt: 'AQID',
        encryptedPassword: 'ciphertext',
      };
      localStorage.setItem(CONFIG_2FA_CREDENTIAL, JSON.stringify(mismatchedVersionCred));

      const authed = await service.isAuthenticated();
      expect(authed).toBeTrue();
      expect(service.isLoggedIn()).toBeTrue();
      expect(service.getStoredPassword()).toBe('plain-pass');
      expect(localStorage.getItem(CONFIG_2FA_CREDENTIAL)).toBeNull();
    });
  });

  describe('Clear auth storage data', () => {
    it('should clear all 2FA, password, and session data', () => {
      localStorage.setItem(CONFIG_PASSWORD_KEY, 'pass');
      localStorage.setItem(CONFIG_2FA_CREDENTIAL, 'cred');
      sessionStorage.setItem(CONFIG_PASSWORD_KEY, 'pass');

      service.clearAuthStorageData();

      expect(localStorage.getItem(CONFIG_PASSWORD_KEY)).toBeNull();
      expect(localStorage.getItem(CONFIG_2FA_CREDENTIAL)).toBeNull();
      expect(sessionStorage.getItem(CONFIG_PASSWORD_KEY)).toBeNull();
      expect(service.getStoredPassword()).toBe('');
      expect(service.isLoggedIn()).toBeFalse();
    });
  });
});
