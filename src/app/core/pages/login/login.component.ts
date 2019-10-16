import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';

import { ConfigService } from '../../services/config.service';
import { APP_CONSTS } from 'src/app/config/app.constants';
import { StorageService } from '../../services/storage.service';
import { AuthService } from '../../services/auth.service';
import { DialogsService } from 'src/app/modules/dialogs/dialogs.service';

/**
 * Handles user authentication. Provides a login screen and allows user to wipe storage if
 * he can't remember his password
 */
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent implements OnInit {

  password: string;
  rememberMe: boolean;
  goodPassword = true;
  formSubmitted = false;
  APP_CONSTS = APP_CONSTS;

  constructor(private authService: AuthService, private router: Router, private configService: ConfigService,
    private dialogsService: DialogsService, private storageService: StorageService, private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.has('wipestorage')) {
      this.forgotPassword()
        .then((confirmed) => {
          if (!confirmed) {
            this.checkAuth();
          }
        });
    } else {
      this.checkAuth();
    }
  }

  async checkAuth() {
    const authenticated = await this.authService.isAuthenticated();
    if (authenticated) {
      this.router.navigate(['']); // go to homepage
    }
  }


  /**
   * Check if user provided password is correct, and allow access if so
   */
  async login() {
    this.formSubmitted = true;
    this.goodPassword = await this.authService.authenticate(this.password, this.rememberMe);
    if (this.goodPassword) {
      const webauthAvailable = await this.authService.isWebAuthnAvailable();
      if (this.storageService.isEncryptionEnabled() &&
        this.rememberMe &&
        !this.authService.is2FAEnabled() &&
        webauthAvailable) {
        const enable2FA = await this.dialogsService.confirm(`Do you want to enable biometric authentication?`);
        if (enable2FA) {
          await this.authService.enable2FA();
        }
      }
      await this.configService.readConfig();
      this.router.navigate(['']); // go to homepage
    } else {
      this.dialogsService.error('Incorrect password!');
      this.formSubmitted = false;
      this.cdr.markForCheck();
    }
  }

  /**
   * Wipe entire storage, as user forgot his password and the encrypted data can't be recovered anymore,
   * and allow user to start clean
   */
  async forgotPassword() {
    const confirmWipe = await this.dialogsService.confirm(`Unfortunately, if you forgot your password, the stored data can't ` +
      `be recovered.\nDo you want to delete the entire app data and start fresh?\n\n` +
      `Note: For security reasons, cloud data won't be deleted!`);
    if (confirmWipe) {
      this.formSubmitted = true;
      this.dialogsService.loadingScreen('Wiping storage. Please wait...');
      this.authService.clearAuthStorageData();
      await this.storageService.wipeStorage(false);

      window.location.reload();
    }
    return confirmWipe;
  }

}
