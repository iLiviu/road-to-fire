import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { SwUpdate } from '@angular/service-worker';
import { DialogsService } from 'src/app/modules/dialogs/dialogs.service';
import { APP_CONSTS } from 'src/app/config/app.constants';

const LS_KNOWN_VERSION = 'rtf_known_version';


/**
 * Notifies the user when a new version of the app is available and allow him to
 * reload the page in order to update
 */
@Injectable()
export class UpdateService {
  constructor(private swUpdate: SwUpdate, private snackBar: MatSnackBar, private dialog: DialogsService) {
    this.swUpdate.available.subscribe(evt => {
      const snack = this.snackBar.open('Application Update Available', 'Update', {
        duration: 6000,
      });

      snack.onAction()
        .subscribe(() => {
          window.location.reload();
        });
    });
    this.checkForFirstVersionLoad();
  }

  /**
   * Checks whenever this is the first time this version of the app is loaded, and if so,
   * open the "What's new" dialog.
   */
  async checkForFirstVersionLoad() {
    const knownVersion = localStorage.getItem(LS_KNOWN_VERSION);
    if (knownVersion !== APP_CONSTS.VERSION) {
      await this.dialog.message(APP_CONSTS.WHATS_NEW, APP_CONSTS.WHATS_NEW_TITLE);
      localStorage.setItem(LS_KNOWN_VERSION, APP_CONSTS.VERSION);
    }
  }
}
