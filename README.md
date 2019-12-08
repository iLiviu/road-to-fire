# Road To FIRE
Road To FIRE is a portfolio manager app for your stocks, ETFs, mutual funds, bonds, cryptocurrencies, commodities and real estate. It runs in your browser, so you don't need to install anything. Privacy is important, so all data is stored in your local browser (or your cloud storage account, if you provide one in order to sync data across your devices). The only data sent to the app server are the symbols for your assets, in order to get their current quotes.

> ### :warning: WARNING
> Please do not consider `Road To FIRE` production ready. You MUST expect that it will eat your data and take precautions against this (keep your portfolio data in another format like a spreadsheet).

## Key Features:
* Manage your stock, ETF, mutual funds, bonds, cryptocurrencies, commodities and real estate portfolio in one app. 
* Automatically get quotes for stocks, mutual funds, bonds, commodities and cryptocurrencies.
* Summary charts showing percentage left to the goals you set, historic portfolio value, portfolio allocation by asset type, asset geographic allocation, cash allocation by currency, monthly spending limit based on your Safe Withdrawal Rate (SWR).
* Steps required to rebalance your portfolio to reach desired allocation.
* Multiple currencies supported, and the value is converted to your base currency using latest forex quotes.
* Track unrealized profit-loss.
* Capital gains statements.
* Automatic interest calculation and payment.
* Track dividend, rent payments and capital costs (for real estate) to get total return.
* Support for recurring transactions that can execute automatically or only after user approval.
* Transaction history.
* Sync across multiple devices using a cloud storage account (Dropbox, Google Drive and RemoteStorage account are supported).
* Privacy focused. All data is stored in your browser local storage or your own cloud storage account. 
* Encryption is available for additional privacy, so your data can't be read even if someone has access to your device or cloud storage account.
* Restrict access to application using biometric authentication (fingerprint, face ID, etc) on supported devices.
* Works offline.
* Can optionally be installed as an app (supported by most mobile and some desktop modern browsers).
* Backup / Restore application data.

## Frequently Asked Questions (FAQ)
See [FAQ.md](FAQ.md)

## Quick-start (recommended)
Go to [roadtofire.iliviu.me](https://roadtofire.iliviu.me). The app will shortly load and you can start using it.

## Build & Run
### 1. Requirements
Make sure you have [git](https://git-scm.com/) and [node.js (version 10.x or newer)](https://nodejs.org/) installed. The app is written in [Typescript](https://www.typescriptlang.org/) and uses the [Angular](https://angular.io/) framework.

### 2. Clone repository:
```
git clone https://github.com/iLiviu/road-to-fire
cd road-to-fire
```

### 3. Install dependencies:
```
npm install
```

### 4. Configuration
The application works without any additional development configuration. However, if you do not want to use the default API keys and services that the app offers, then open the `src/app/config/app.constants.ts` file with your favorite editor and edit the following:
* `STORAGE_API_KEYS` to set custom API keys for Dropbox and Google integration. 
* `QUOTE_SERVICE_BASE_URL` the base path to the asset quote provider. This service is used to get updated quotes for tradeable assets (stocks, bonds, mutual funds, cryptocurrencies and commodities). The source code for the service is freely available on github: [github.com/iLiviu/asset-quote-service](https://github.com/iLiviu/asset-quote-service)

### 5.a Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

### 5.b Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## License
Published under [GNU General Public License v3.0](https://www.gnu.org/licenses/gpl-3.0.en.html).