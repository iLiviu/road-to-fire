import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { SwUpdate } from '@angular/service-worker';

/**
 * Notifies the user when a new version of the app is available and allow him to
 * reload the page in order to update
 */
@Injectable()
export class UpdateService {
  constructor(private swUpdate: SwUpdate, private snackBar: MatSnackBar) {
    this.swUpdate.available.subscribe(evt => {
      const snack = this.snackBar.open('Application Update Available', 'Update', {
        duration: 6000,
      });

      snack.onAction()
        .subscribe(() => {
          window.location.reload();
        });
    });
  }
}
