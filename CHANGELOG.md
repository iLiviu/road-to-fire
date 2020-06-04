## 1.2.0 (2020-06-04)

### Features
* Manually edit unrealized P/L history entries
* Add option to filter transactions
* Display bond/deposit interest & principal payment transactions in scheduled transactions list

### Bug fixes
* Fix executing multiple due interest/principal payment transactions for a bond

## 1.1.0 (2020-01-27)

### Features
* Add option to select from multiple date and currency formats.
* Display loan-to-value ratio in account overview tab

## 1.0.2 (2020-01-15)

### UI Changes
* Display tooltips of nearest point when hovering history charts, not only when hovering the exact point location.

### Bug Fixes
* Correctly set currency symbol when a cash asset is selected by default in asset trade dialog

## 1.0.1 (2020-01-05)

### Features
* Add action buttons on each asset-category tab of the account page, to quickly add/buy an asset.

### UI Changes
* Hide amount field for P2P and Real Estate, as it's irrelevant for these assets.
* Allow editing of cash asset for bonds and P2P loans
* Automatically fill cash asset field with default value on Cost, Dividend and Interest transaction dialogs.

### Bug Fixes
* Update previous payment date on bonds and P2P loans when manually adding an interest payment.

## 1.0.0 (2020-01-03)

### Features
* Disable browser's default pull-to-refresh gesture to avoid entire app refresh when user swipes down
* Manually add a bond principal payment
* Support for P2P loans

### Bug fixes
* Do not update bond principal value when the transaction is just pending.
* Truncate long asset titles in lists, that hide current price.

## 1.0.0-beta.2 (2019-12-16)

### Features
* require user to confirm password before disabling encryption
* when enabling encryption from settings page, display a second password confirmation field to avoid mistyping password.
* allow user to change the current unit price when editing a tradeable asset.
* add a close button to the "Connect your storage" popup when not connected to a backend, so user can quickly disable cloud sync.
* add autocomplete for symbol when adding/editing a commodity to suggest supported commodities.

## 1.0.0-beta (2019-12-10)

Initial public release