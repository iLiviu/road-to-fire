import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlSegment, CanDeactivate } from '@angular/router';
import { Observable } from 'rxjs';

import { SettingsComponent } from './settings.component';
import { DialogsService } from 'src/app/modules/dialogs/dialogs.service';

/**
 * Guard to disallow user to leave the settings page without an additional confirmation, if there are
 * unsaved changes.
 */
@Injectable({
  providedIn: 'root'
})
export class SettingsGuard implements CanDeactivate<SettingsComponent> {


  constructor(private dialogsService: DialogsService) {
  }

  canDeactivate(component: SettingsComponent, currentRoute: ActivatedRouteSnapshot,
    currentState: RouterStateSnapshot, nextState: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    if (!component.settingsSaved && component.settingsForm && component.settingsForm.dirty) {
      return this.dialogsService.confirm('Your changes have not been saved. Discard changes?', 'Discard changes');
    } else {
      return true;
    }

  }


}
