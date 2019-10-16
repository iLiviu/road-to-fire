import { Component, OnInit, AfterViewInit, ChangeDetectionStrategy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormGroup, FormControl, Validators, ValidationErrors } from '@angular/forms';

import { APP_CONSTS } from 'src/app/config/app.constants';
import { StorageService } from 'src/app/core/services/storage.service';
import { ConfigService } from 'src/app/core/services/config.service';
import { PortfolioService } from '../../services/portfolio.service';
import { LoggerService } from 'src/app/core/services/logger.service';
import { AppConfig } from 'src/app/core/models/app-storage';
import { PortfolioConfig, Goal } from '../../models/portfolio-config';
import { EventsService } from 'src/app/core/services/events.service';
import { DialogsService } from 'src/app/modules/dialogs/dialogs.service';

const valueMatchesControlValidator = (secondCtrl: FormControl) => {
  return (control: FormControl): ValidationErrors | null => {
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
  baseCurrencyForm: FormGroup;
  baseCurrency: FormControl;
  configPassword: FormControl;
  configPasswordConfirm: FormControl;
  cloudSyncForm: FormGroup;
  encryptionForm: FormGroup;
  fireForm: FormGroup;
  fireNumber: FormControl;
  passwordProtect: FormControl;
  portfolioConfig: PortfolioConfig;
  saveOnCloud: FormControl;
  swr: FormControl;
  wizardDone = false;

  readonly APP_CONSTS = APP_CONSTS;
  readonly currencyCodes = APP_CONSTS.CURRENCY_CODES;

  constructor(private storageService: StorageService, private configService: ConfigService,
    private portfolioService: PortfolioService, private logger: LoggerService, private router: Router,
    private route: ActivatedRoute, private eventsService: EventsService, private dialogService: DialogsService) {

  }

  ngOnInit() {
    this.saveOnCloud = new FormControl(false);
    this.passwordProtect = new FormControl(false);
    this.configPassword = new FormControl('');
    this.configPasswordConfirm = new FormControl('');
    this.baseCurrency = new FormControl();
    this.fireNumber = new FormControl(1000000);
    this.swr = new FormControl(4);

    this.cloudSyncForm = new FormGroup({
      saveOnCloud: this.saveOnCloud,
      passwordProtect: this.passwordProtect,
    });
    this.encryptionForm = new FormGroup({
      passwordProtect: this.passwordProtect,
      configPassword: this.configPassword,
      configPasswordConfirm: this.configPasswordConfirm,
    });

    this.baseCurrencyForm = new FormGroup({
      baseCurrency: this.baseCurrency,
    });

    this.fireForm = new FormGroup({
      fireNumber: this.fireNumber,
      swr: this.swr,
    });


    this.readConfig();

  }

  onPasswordProtectionToggled() {
    if (this.passwordProtect.value) {
      this.configPassword.setValidators([Validators.required]);
      this.configPasswordConfirm.setValidators([Validators.required, valueMatchesControlValidator(this.configPassword) ]);
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

    this.portfolioConfig.goals = [];
    if (this.fireNumber.value) {
      const fireGoal: Goal = {
        title: 'Financial Independence',
        value: this.fireNumber.value,
      };
      this.portfolioConfig.goals.push(fireGoal);
    }
    this.portfolioConfig.withdrawalRate = this.swr.value  / 100;
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
      this.navigateToHomepage();
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
