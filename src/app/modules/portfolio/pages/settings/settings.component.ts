import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Location } from '@angular/common';
import { FormGroup, FormControl, FormArray, Validators, ValidatorFn, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { EventsService } from 'src/app/core/services/events.service';
import { APP_CONSTS } from 'src/app/config/app.constants';
import { ConfigService } from 'src/app/core/services/config.service';
import { AssetType, ASSET_TYPE_LABELS } from '../../models/asset';
import { LoggerService } from 'src/app/core/services/logger.service';
import { PortfolioService } from '../../services/portfolio.service';
import { PortfolioPageComponent } from '../../components/portfolio-page/portfolio-page.component';
import { DialogsService } from 'src/app/modules/dialogs/dialogs.service';
import { AssetAllocation, Goal } from '../../models/portfolio-config';
import { StorageService } from 'src/app/core/services/storage.service';
import { AppConfig } from 'src/app/core/models/app-storage';
import { FloatingMath } from 'src/app/shared/util';
import { AuthService } from 'src/app/core/services/auth.service';
import { AssetManagementService } from '../../services/asset-management.service';


/**
 * Validates if the sum of percentages of all asset types equals 100
 */
const portfolioAllocationValidator: ValidatorFn = (control: FormGroup): ValidationErrors | null => {
  let totalAllocation = 0;
  for (const fieldId of Object.keys(control.controls)) {
    const childControl = control.get(fieldId);
    totalAllocation += +childControl.value;
  }
  return totalAllocation !== 100 ? { 'invalidAllocation': true } : null;
};



@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsComponent extends PortfolioPageComponent implements OnInit {

  appConfig: AppConfig;
  baseCurrencyCtl: FormControl;
  configPassword: FormControl;
  dataLoaded = false;
  enable2FA: FormControl;
  encryptionEnabled: boolean;
  formSubmitted = false;
  goals: FormArray;
  invalidAllocation = false;
  isPasswordStored: boolean;
  passwordProtect: FormControl;
  portfolioAllocation: FormGroup;
  saveOnCloud: FormControl;
  settingsSaved = false;
  settingsForm: FormGroup;
  twoFactorAvailable: boolean;
  withdrawalRate: FormControl;

  readonly ALL_ASSETS = [
    AssetType.Cash,
    AssetType.Bond,
    AssetType.Stock,
    AssetType.Commodity,
    AssetType.Cryptocurrency,
    AssetType.RealEstate
  ];
  readonly ASSET_TYPE_LABELS = ASSET_TYPE_LABELS;
  readonly currencyCodes = APP_CONSTS.CURRENCY_CODES;


  constructor(protected eventsService: EventsService, protected configService: ConfigService, protected logger: LoggerService,
    protected location: Location, protected portfolioService: PortfolioService, protected dialogService: DialogsService,
    protected storageService: StorageService, protected router: Router,
    protected route: ActivatedRoute, protected authService: AuthService, protected assetManagementService: AssetManagementService,
    protected cdr: ChangeDetectorRef) {
    super(logger, portfolioService, dialogService, eventsService, router, storageService);

  }

  ngOnInit() {
    this.dataLoaded = false;
    super.ngOnInit();
  }

  /**
   * Saves portfolio and app settings. If encryption is toggled, it first encrypts/decrypts the entire
   * storage.
   */
  async saveSettings() {
    this.formSubmitted = true;
    try {
      this.portfolioConfig.baseCurrency = this.baseCurrencyCtl.value;
      this.portfolioConfig.withdrawalRate = +this.withdrawalRate.value / 100;
      for (let i = 0; i < this.portfolioConfig.goals.length; i++) {
        this.portfolioConfig.goals[i].value = +this.goals.controls[i].value;
      }
      this.portfolioConfig.goals.sort((a, b) => a.value < b.value ? -1 : 1);

      this.portfolioConfig.portfolioAllocation = [];
      for (const prop of Object.keys(this.portfolioAllocation.controls)) {
        this.portfolioConfig.portfolioAllocation.push(<AssetAllocation>{
          assetType: +prop,
          allocation: +this.portfolioAllocation.get(prop).value / 100
        });
      }

      if (this.enable2FA.value) {
        if (!this.authService.is2FAEnabled()) {
          const enabled = await this.authService.enable2FA();
          if (enabled && !this.authService.hasPermanentStoredPassword()) {
            // we need to permanently store password
            this.authService.storePassword(this.authService.getStoredPassword(), true);
          }
        }
      } else {
        if (this.authService.is2FAEnabled()) {
          await this.authService.disable2FA();
        }
      }

      this.appConfig.saveOnCloud = this.saveOnCloud.value;
      const enableEncryption = this.passwordProtect.value;
      if (this.encryptionEnabled !== enableEncryption) {
        // encryption mode has changed, we need to rewrite all data
        const dialogRef = this.dialogService.loadingScreen((enableEncryption ? 'Encrypting' : 'Decrypting') + ' storage. Please wait...');
        await this.storageService.toggleEncryption(this.passwordProtect.value, this.configPassword.value);
        this.eventsService.encryptionToggled(enableEncryption);
        dialogRef.close();
      }

      await this.portfolioService.saveConfig(this.portfolioConfig);
      await this.configService.saveConfig(this.appConfig);
      this.settingsSaved = true;
      this.logger.info('Config saved!');
      this.navigateToHomepage();
    } catch (err) {
      this.logger.error('Could not save config!', err);
      this.formSubmitted = false;
    }
  }

  /**
   * Adds a new portfolio value goal
   */
  async addGoal() {
    const goalName = await this.dialogService.input('Enter new goal name:');
    if (goalName) {
      const newGoal: Goal = {
        title: goalName,
        value: 0,
      };
      this.portfolioConfig.goals.push(newGoal);
      this.updateGoals();
      this.settingsForm.markAsDirty();
    }
  }

  /**
   * Deletes a portfolio value goal
   *
   * @param index index of goal to delete
   */
  async deleteGoal(index: number) {
    const confirmed = await this.dialogService.confirm('Delete selected goal?');
    if (confirmed) {
      this.goals.removeAt(index);
      this.portfolioConfig.goals.splice(index, 1);
      this.settingsForm.markAsDirty();
      this.onGoalsUpdated();
    }
  }

  /**
   * Fired when biometric authentication checkbox is clicked. Asks user for confirmation to store password on device if
   * he is enabling biometric authentication.
   */
  async twoFAChanged() {
    if (this.enable2FA.value) {
      const confirm = await this.dialogService.confirm(`Enabling biometric authentication requires storing password on this device.\n` +
        `Do you want to continue?`);
      if (!confirm) {
        this.enable2FA.setValue(false);
      }
    }
  }

  /**
   * Wipes the entire app storage. Asks user for confirmation before doing so.
   */
  async wipeAppData() {
    const response = await this.dialogService.confirm('Are you sure you want to delete all the app data ' +
      `(config and asset portfolio)?\nThis action can\'t be undone!`);
    if (response) {
      try {
        const dialogRef = this.dialogService.loadingScreen('Wiping storage. Please wait...');
        this.authService.clearAuthStorageData();
        await this.storageService.wipeStorage(true);
        dialogRef.close();
        this.eventsService.storageWiped();
      } catch (err) {
        this.logger.error(`An error occurred while deleting portfolio data: ${err}`, err);
      }
    }
  }

  /**
   * Import entire app data (config + portfolio) from a file
   * @param fileInput file containing app data
   */
  async importAppDataFromFile(fileInput: any) {
    const response = await this.dialogService.confirm('Importing data will overwrite your current app configuration and portfolio data.\n' +
      'Are you sure you want continue?');
    if (response) {
      const reader = new FileReader();
      const dialogRef = this.dialogService.loadingScreen('Importing data, please wait...');
      reader.onload = async (e: any) => {
        try {
          await this.storageService.importFromJSON(e.target.result);
          // we don't need to close the dialog as the window refreshes when action is done and sync is complete
        } catch (err) {
          this.logger.error('Could not import app data!', err);
          dialogRef.close();
          this.dialogService.error(err, 'Import error');
        }

      };
      reader.readAsText(fileInput.target.files[0]);
    }
  }

  /**
   * Export entire app data (config + portfolio) to a user specified file.
   */
  async exportAppDataToFile() {
    const jsonStr = await this.storageService.exportToJSON();
    this.saveToFile(jsonStr, 'roadtofire_export.txt', 'text/plain');
  }

  /**
   * Export portfolio assets data to a CSV file for user to use outside of app.
   */
  async exportPortfolioDataToCSV() {
    const csvStr = await this.assetManagementService.exportToCSV();
    this.saveToFile(csvStr, 'portfolio_export.csv', 'text/csv;charset=utf-8');
  }

  /**
   * Save a string to a file. If browser does not support automatic downloads, it will show the
   * user a text-box with the data, allowing him to copy it.
   * @param outputData a string with data to save to file
   * @param filename the name of the output file
   * @param fileFormat file MIME format
   */
  private saveToFile(outputData: string, filename: string, fileFormat?: string) {
    if (!fileFormat) {
      fileFormat = 'text/plain';
    }
    const link = document.createElement('a');
    // check if `download` attribute is supported, and if not, we will show the user
    // a textbox with export data instead of a save file dialog
    const manualDownloadNeeded = typeof link.download === 'undefined';
    if (manualDownloadNeeded) {
      this.dialogService.textarea(outputData);
    } else {
      const data = new Blob([outputData], { type: fileFormat });

      const textFile = window.URL.createObjectURL(data);
      link.setAttribute('download', filename);
      link.href = textFile;

      document.body.appendChild(link);
      // wait for the link to be added to the document
      window.requestAnimationFrame(function () {
        const event = new MouseEvent('click');
        link.dispatchEvent(event);
        document.body.removeChild(link);
      });
    }

  }

  protected async doReadConfig() {
    this.twoFactorAvailable = await this.authService.isWebAuthnAvailable();
    const configs = await Promise.all([this.configService.readConfig(), this.portfolioService.readConfig()]);
    this.appConfig = configs[0];
    this.portfolioConfig = configs[1];
  }

  protected onConfigLoaded() {
    super.onConfigLoaded();
    this.loadComplete();
  }

  private navigateToHomepage() {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  /**
   * Builds internal goals form controls
   */
  private updateGoals() {
    this.goals.controls.splice(0, this.goals.controls.length);
    for (const goal of this.portfolioConfig.goals) {
      this.goals.push(new FormControl(goal.value, [Validators.min(0), Validators.pattern(/^\d*\.?\d*$/)]));
    }
    this.onGoalsUpdated();
  }

  /**
   * Populate the form controls. Fired when config is loaded.
   */
  private loadComplete() {
    this.encryptionEnabled = this.storageService.isEncryptionEnabled();
    this.goals = new FormArray([]);
    this.updateGoals();

    this.portfolioAllocation = new FormGroup({}, [portfolioAllocationValidator]);
    for (const assetType of this.ALL_ASSETS) {
      this.portfolioAllocation.addControl(assetType.toString(), new FormControl('0', [Validators.min(0), Validators.max(100)]));
    }
    for (const asset of this.portfolioConfig.portfolioAllocation) {
      this.portfolioAllocation.controls[asset.assetType].setValue(FloatingMath.fixRoundingError(asset.allocation * 100));
    }
    this.enable2FA = new FormControl(this.authService.is2FAEnabled());
    this.baseCurrencyCtl = new FormControl(this.portfolioConfig.baseCurrency);
    this.withdrawalRate = new FormControl(FloatingMath.fixRoundingError(this.portfolioConfig.withdrawalRate * 100),
      [Validators.min(0), Validators.max(100)]);
    this.saveOnCloud = new FormControl(this.appConfig.saveOnCloud);
    this.passwordProtect = new FormControl(this.encryptionEnabled);
    this.configPassword = new FormControl('');

    this.settingsForm = new FormGroup({
      baseCurrencyCtl: this.baseCurrencyCtl,
      enable2FA: this.enable2FA,
      withdrawalRate: this.withdrawalRate,
      goals: this.goals,
      portfolioAllocation: this.portfolioAllocation,
      saveOnCloud: this.saveOnCloud,
      passwordProtect: this.passwordProtect,
      configPassword: this.configPassword,
    });

    this.onDataLoaded();

  }

  private onGoalsUpdated() {
    this.cdr.markForCheck();
  }

  private onDataLoaded() {
    this.dataLoaded = true;
    this.cdr.markForCheck();
  }
}


