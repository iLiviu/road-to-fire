import { Component, OnInit, AfterViewInit, ChangeDetectionStrategy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { UntypedFormGroup, UntypedFormControl, Validators, ValidationErrors } from '@angular/forms';

import { APP_CONSTS } from 'src/app/config/app.constants';
import { StorageService } from 'src/app/core/services/storage.service';
import { ConfigService } from 'src/app/core/services/config.service';
import { PortfolioService } from '../../services/portfolio.service';
import { LoggerService } from 'src/app/core/services/logger.service';
import { AppConfig } from 'src/app/core/models/app-storage';
import { PortfolioConfig, Goal } from '../../models/portfolio-config';
import { EventsService } from 'src/app/core/services/events.service';
import { DialogsService } from 'src/app/modules/dialogs/dialogs.service';
import { LocaleIDs } from 'src/app/core/services/locale-service';

const valueMatchesControlValidator = (secondCtrl: UntypedFormControl) => {
  return (control: UntypedFormControl): ValidationErrors | null => {
    return control.value !== secondCtrl.value ? { 'different': true } : null;
  };
};

/**
 * Component to display a wizard guiding the user with basic configuration of the app:
 * cloud sync, encryption and base app currency.
 *
 */
@Component({
  selector: 'app-wizard',
  templateUrl: './wizard.component.html',
  styleUrls: ['./wizard.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WizardComponent implements OnInit {

  appConfig: AppConfig;
  baseCurrencyForm: UntypedFormGroup;
  baseCurrency: UntypedFormControl;
  configPassword: UntypedFormControl;
  configPasswordConfirm: UntypedFormControl;
  cloudSyncForm: UntypedFormGroup;
  dateAndCurrencyFormat: UntypedFormControl;
  displayFormatForm: UntypedFormGroup;
  encryptionForm: UntypedFormGroup;
  fireForm: UntypedFormGroup;
  fireNumber: UntypedFormControl;
  passwordProtect: UntypedFormControl;
  portfolioConfig: PortfolioConfig;
  saveOnCloud: UntypedFormControl;
  swr: UntypedFormControl;
  wizardDone = false;

  readonly APP_CONSTS = APP_CONSTS;
  readonly currencyCodes = APP_CONSTS.CURRENCY_CODES;
  readonly LocaleIDs = LocaleIDs;

  constructor(private storageService: StorageService, private configService: ConfigService,
    private portfolioService: PortfolioService, private logger: LoggerService, private router: Router,
    private route: ActivatedRoute, private eventsService: EventsService, private dialogService: DialogsService) {

  }

  ngOnInit() {
    this.dateAndCurrencyFormat = new UntypedFormControl(LocaleIDs.EN_US);
    this.saveOnCloud = new UntypedFormControl(false);
    this.passwordProtect = new UntypedFormControl(false);
    this.configPassword = new UntypedFormControl('');
    this.configPasswordConfirm = new UntypedFormControl('');
    this.baseCurrency = new UntypedFormControl();
    this.fireNumber = new UntypedFormControl(1000000);
    this.swr = new UntypedFormControl(4);

    this.cloudSyncForm = new UntypedFormGroup({
      saveOnCloud: this.saveOnCloud,
      passwordProtect: this.passwordProtect,
    });

    this.displayFormatForm = new UntypedFormGroup({
      dateAndCurrencyFormat: this.dateAndCurrencyFormat,
    });

    this.encryptionForm = new UntypedFormGroup({
      passwordProtect: this.passwordProtect,
      configPassword: this.configPassword,
      configPasswordConfirm: this.configPasswordConfirm,
    });

    this.baseCurrencyForm = new UntypedFormGroup({
      baseCurrency: this.baseCurrency,
    });

    this.fireForm = new UntypedFormGroup({
      fireNumber: this.fireNumber,
      swr: this.swr,
    });


    this.readConfig();

  }

  onPasswordProtectionToggled() {
    if (this.passwordProtect.value) {
      this.configPassword.setValidators([Validators.required]);
      this.configPasswordConfirm.setValidators([Validators.required, valueMatchesControlValidator(this.configPassword)]);
    } else {
      this.configPassword.setValidators([]);
      this.configPasswordConfirm.setValidators([]);
    }
    this.configPassword.updateValueAndValidity();
    this.configPasswordConfirm.updateValueAndValidity();
  }

  async onWizardDone() {
    this.wizardDone = true;
    this.appConfig.wizardDone = true;
    this.appConfig.saveOnCloud = this.saveOnCloud.value;
    this.appConfig.dateAndCurrencyFormat = this.dateAndCurrencyFormat.value;
    // if locale is not set to en-US we will need to reload the app to apply the new locale
    const needsReload = this.appConfig.dateAndCurrencyFormat !== LocaleIDs.EN_US;

    this.portfolioConfig.goals = [];
    if (this.fireNumber.value) {
      const fireGoal: Goal = {
        title: 'Financial Independence',
        value: this.fireNumber.value,
      };
      this.portfolioConfig.goals.push(fireGoal);
    }
    this.portfolioConfig.withdrawalRate = this.swr.value / 100;
    this.portfolioConfig.baseCurrency = this.baseCurrency.value;

    try {
      if (this.passwordProtect.value) {
        // encryption mode has changed, we need to rewrite all data
        const dialogRef = this.dialogService.loadingScreen('Encrypting storage. Please wait...');
        await this.storageService.toggleEncryption(true, this.configPassword.value);
        this.eventsService.encryptionToggled(true);
        dialogRef.close();
      }

      await Promise.all([this.portfolioService.saveConfig(this.portfolioConfig), this.configService.saveConfig(this.appConfig)]);
      this.logger.info('Config saved!');
      if (needsReload) {
        window.location.reload();
      } else {
        this.navigateToHomepage();
      }
    } catch (err) {
      this.logger.error('Could not save config: ' + err, err);
      this.wizardDone = false;
    }
  }

  async onSkipWizard() {
    this.wizardDone = true;
    try {
      this.appConfig.wizardDone = true;
      await this.configService.saveConfig(this.appConfig);
      this.navigateToHomepage();
    } catch (err) {
      this.logger.error('Could not save config: ' + err, err);
      this.wizardDone = false;

    }
  }

  private async readConfig() {
    try {
      const configs = await Promise.all([this.configService.readConfig(), this.portfolioService.readConfig()]);
      this.appConfig = configs[0];
      this.portfolioConfig = configs[1];

      if (this.appConfig.wizardDone) {
        this.navigateToHomepage();
      }
    } catch (err) {
      this.logger.error('Could not read config: ' + err, err);
    }
  }

  private navigateToHomepage() {
    this.router.navigate(['../'], { relativeTo: this.route });
  }
}
