import { Injectable } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import * as moment from 'moment';

export enum LocaleIDs {
  EN_US = 'en-US',
  EN_GB = 'en-GB',
  EN_BE = 'en-BE',
}

const CURRENT_LOCALE = 'rtf_current_locale';

/**
 * Service to set and load locale specific display settings.
 */
@Injectable({
  providedIn: 'root'
})
export class LocaleService {

  /**
   * Gets the current stored locale. Defaults to en-US.
   */
  getCurrentLocale(): string {
    const currentLocale = localStorage.getItem(CURRENT_LOCALE) || LocaleIDs.EN_US;
    return currentLocale;
  }

  /**
   * Get the current locale used by moment.js
   */
  getCurrentMomentLocale(): string {
    let currentLocale = this.getCurrentLocale().toLowerCase();
    if (currentLocale === 'en-be') {
      // moment does not have a 'en-be' locale, but en-gb dates are formatted the same
      currentLocale = 'en-gb';
    }
    return currentLocale;
  }

  /**
   * Stores the locale to be used
   * @param value locale id
   */
  setCurrentLocale(value: string) {
    localStorage.setItem(CURRENT_LOCALE, value);
  }

  /**
   * Load current locale modules asynchronously.
   * Use webpack magic comments to only include supported locale modules in production build.
   */
  async loadCurrentLocale(): Promise<string> {
    const currentLocale = this.getCurrentLocale();
    // en-US is default for framework so no need to load it
    if (currentLocale !== 'en-US') {
      const module = await import(
        /* webpackInclude: /en-(GB|BE)\.mjs$/ */
        `/node_modules/@angular/common/locales/${currentLocale}.mjs`
      );

      registerLocaleData(module.default, currentLocale);

      const momentLocale = this.getCurrentMomentLocale();
      await import(
        /* webpackInclude: /en-gb\.js$/ */
        `moment/locale/${momentLocale}.js`);
      moment.locale(momentLocale);
    }
    return currentLocale;
  }
}

