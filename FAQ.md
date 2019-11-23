
# Frequently Asked Questions
- [Where is my app data stored?](#where-is-my-app-data-stored)
- [Can i use the app without an internet connection?](#can-i-use-the-app-without-an-internet-connection)
- [Can i use my fingerprint to restrict access to the app?](#can-i-use-my-fingerprint-to-restrict-access-to-the-app)
- [How do i manually access/delete the files stored on my cloud account?](#how-do-i-manually-access-the-files-stored-on-my-cloud-account)
- [Can i retrieve my app data if i forget my password?](#can-i-retrieve-my-app-data-if-i-forget-my-password)
- [For what commodities can the app automatically get quotes?](#for-what-commodities-can-the-app-automatically-get-quotes)

## Where is my app data stored?
The application's data is stored in your browser's local storage by default. This means that if you uninstall your browser, switch to another browser or device, or clear your browsing data, the application's data will be lost. To avoid this, you can let the app store the data on your cloud storage account. This way, you will be able to switch between devices, and your data will be automatically synced between them. You can use your RemoteStorage, Dropbox or Google Drive account (we recommend RemoteStorage as it works the best with the app. You can either [host your own RemoteStorage server](https://wiki.remotestorage.io/Servers), or use a free service like [5apps](https://5apps.com/storage)).

## Can i use the app without an internet connection?
After you open the application for the first time using an internet connection, the latest versions of almost all modern browsers should support running the application even without an internet connection the next time you run it.

## Can i use my fingerprint to restrict access to the app?
Yes, as long as you are running the app from a device and browser that supports fingerprint authentication (the latest versions of Chrome and Firefox should support it). To enable fingerprint authentication you need to go to **Settings** page, enable **Password protect application data** option and after that, check the **Enable biometric authentication** option. (**NOTE: to enable this option, your password will actually be stored in your local browser's storage, you won't be able to restrict an experienced user from accessing your data**).

## How do i manually access the files stored on my cloud account?
- **Google Drive**: Go to [https://drive.google.com](https://drive.google.com/), login with your Google account, and inside the **remotestorage** folder, you can find the **roadtofire** and **asset-portfolio** folders where the app stores the data
- **Dropbox**: Go to [https://dropbox.com](https://dropbox.com/), login with your Dropbox account, and inside the **remotestorage** folder, you can find the **roadtofire** and **asset-portfolio** folders where the app stores the data
- **RemoteStorage**: You can use the free **Inspektor** app  at [https://inspektor.5apps.com](https://inspektor.5apps.com) to connect to your cloud storage account and manually browse the **roadtofire** and **asset-portfolio** folders where the app stores the data

## Can i retrieve my app data if i forget my password?
No, if you forget your password, the app data is lost. You will need to reset the app (click **Forgot Password** button) and manually delete the app files from your cloud storage account (see [How do i manually access/delete the files stored on my cloud account?](#how-do-i-manually-access-the-files-stored-on-my-cloud-account))

## For what commodities can the app automatically get quotes?
The app currently supports the following (use the symbol in brackets): Aluminium(`AL`), Gold(`AU`), Platinum(`PT`), Silver(`AG`), Copper(`CU`), Palladium(`PD`), Corn(`ZC`), Soybean(`ZS`), Live Cattle(`LE`), Wheat(`ZW`), Crude Oil(`CL`), Brent Oil(`BZ`), Gasoline(`RB`), Natural Gas(`NG`)