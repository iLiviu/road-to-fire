import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import { InputDialogComponent, InputDialogType } from './components/input-dialog/input-dialog.component';
import { MessageDialogComponent, MessageDialogData, MessageDialogType } from './components/message-dialog/message-dialog.component';
import { LoadingScreenDialogComponent } from './components/loading-screen-dialog/loading-screen-dialog.component';
import { TextareaDialogComponent } from './components/textarea-dialog/textarea-dialog.component';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

/**
 * Service to open various informational and prompt dialogs
 */
@Injectable()
export class DialogsService {

  private isHandset: boolean;

  constructor(public dialog: MatDialog, private breakpointObserver: BreakpointObserver) {
    // listen for screen-size changes as we need to know if we should display mobile or desktop styled dialogs
    this.breakpointObserver.observe([Breakpoints.Small, Breakpoints.XSmall])
      .subscribe((state) => {
        this.isHandset = state.matches;
      });

  }

  /**
   * Displays a dialog box asking user to confirm an action
   * @param question question for action that user needs to confirm
   * @param title optional dialog title
   * @return promise that is fulfilled with the user action when the dialog closes
   */
  confirm(question: string, title?: string): Promise<boolean> {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: { title: title, question: question }
    });
    return dialogRef.afterClosed().toPromise();
  }

  /**
   * Displays a dialog box with a a message
   * @param message message to display
   * @param title optional dialog title
   * @param dialogType the dialog icon to display
   * @param displayDontShowAgain if `true` displays a checkbox allowing the user to specify that he doesn't want to see this message again
   * @return promise that is fulfilled when the dialog closes with `true` if user has chosen to not display the message again,
   *         or `false` otherwise
   */
  private messageBox(message: string, title?: string, dialogType?: MessageDialogType, displayDontShowAgain?: boolean): Promise<boolean> {
    const dialogRef = this.dialog.open(MessageDialogComponent, {
      data: <MessageDialogData>{ title: title, message: message, type: dialogType, displayDontShowAgain: displayDontShowAgain }
    });
    return dialogRef.afterClosed().toPromise();
  }


  /**
   * Displays a dialog box that prompts the user for input
   * @param prompt text to display in the dialog box
   * @param title optional dialog title
   * @param defaultValue the value that will appear in the input when dialog opens
   * @param inputType the type of value that user has to input
   * @return promise that is fulfilled when the dialog closes with the value of the users's input
   */
  input(prompt: string, title?: string, defaultValue?: string, inputType?: InputDialogType): Promise<string> {
    const dialogRef = this.dialog.open(InputDialogComponent, {
      data: { title: title, prompt: prompt, response: defaultValue || '', inputType: inputType }
    });

    return dialogRef.afterClosed().toPromise();
  }

  /**
   * Displays a dialog box with a custom message
   * @param message message to display
   * @param title optional dialog title
   * @return promise that is fulfilled when the dialog closes with `true` if user has chosen to not display the message again,
   *         or `false` otherwise
   */
  message(message: string, title?: string, displayDontShowAgain?: boolean): Promise<boolean> {
    return this.messageBox(message, title, MessageDialogType.CUSTOM, displayDontShowAgain);
  }

  /**
   * Displays a dialog box with an informational message
   * @param message message to display
   * @param title optional dialog title
   * @return promise that is fulfilled when the dialog closes with `true` if user has chosen to not display the message again,
   *         or `false` otherwise
   */
  info(message: string, title?: string, displayDontShowAgain?: boolean): Promise<boolean> {
    return this.messageBox(message, title, MessageDialogType.INFO, displayDontShowAgain);
  }

  /**
   * Displays a dialog box with a warning message
   * @param message message to display
   * @param title optional dialog title
   * @param displayDontShowAgain if `true` displays a checkbox allowing the user to specify that he doesn't want to see this message again
   * @return promise that is fulfilled when the dialog closes with `true` if user has chosen to not display the message again,
   *         or `false` otherwise
   */
  warn(message: string, title?: string, displayDontShowAgain?: boolean): Promise<boolean> {
    return this.messageBox(message, title, MessageDialogType.WARNING, displayDontShowAgain);
  }

  /**
   * Displays a dialog box with an error message
   * @param message message to display
   * @param title optional dialog title
   * @return promise that is fulfilled when the dialog closes with `true` if user has chosen to not display the message again,
   *         or `false` otherwise
   */
  error(message: string, title?: string, displayDontShowAgain?: boolean): Promise<boolean> {
    return this.messageBox(message, title, MessageDialogType.ERROR, displayDontShowAgain);
  }

  /**
   * Displays a loading screen on the entire screen, with an informational message
   * @param message message to display
   * @param title optional dialog title
   * @return reference to the opened dialog
   */
  loadingScreen(message: string) {
    return this.dialog.open(LoadingScreenDialogComponent, {
      disableClose: true,
      panelClass: 'full-screen-dialog',
      data: { message: message }
    });
  }

  textarea(content: string) {
    return this.dialog.open(TextareaDialogComponent, {
      data: content
    });
  }

  /**
   * Displays a component as a full screen dialog
   * @param dialogComponent the component to display
   * @param data the data to pass to the component
   * @return reference to the opened dialog
   */
  openFullScreenDialog(dialogComponent: any, data: any) {
    return this.dialog.open(dialogComponent, {
      disableClose: true,
      panelClass: 'full-screen-dialog',
      data: data
    });
  }

  /**
   * Displays a component as a full screen dialog and waits for it to close
   * @param dialogComponent the component to display
   * @param data the data to pass to the component
   * @return promise that is fulfilled after the dialog closes
   */
  showFullScreenModal(dialogComponent: any, data: any) {
    const dialogRef = this.openFullScreenDialog(dialogComponent, data);
    return dialogRef.afterClosed().toPromise();
  }

  /**
   * Displays a component in a dialog and wait for it to close
   * @param dialogComponent the component to display
   * @param data the data to pass to the component
   * @param disableClose if `true` does not hide dialog when user clicks outside of it or presses Escape key (default value is `true`).
   * @return promise that is fulfilled after the dialog closes
   */
  showModal(dialogComponent: any, data: any, disableClose: boolean = true) {
    const dialogRef = this.dialog.open(dialogComponent, {
      disableClose,
      data: data
    });
    return dialogRef.afterClosed().toPromise();
  }

  show(dialogComponent: any, data: any) {
    const dialogRef = this.dialog.open(dialogComponent, {
      data: data
    });
    return dialogRef;
  }

  /**
   * Opens a dialog with a style adapted to the device the user is viewing from and waits for it to close.
   * On mobile, it displays a full screen dialog. On desktop, it displays a regular dialog.
   * @param dialogComponent dialog component to display
   * @param data data to pass to the dialog component on initialization
   * @return Promise that resolves when the dialog is closed.
   */
  async showAdaptableScreenModal(dialogComponent: any, data: any): Promise<any> {
    const dialogRef = this.openAdaptableScreenDialog(dialogComponent, data);
    const promise = await dialogRef.afterClosed().toPromise();
    return promise;
  }


  /**
   * Opens a dialog with a style adapted to the device the user is viewing from.
   * On mobile, it displays a full screen dialog. On desktop, it displays a regular dialog.
   * @param dialogComponent dialog component to display
   * @param data data to pass to the dialog component on initialization
   */
  private openAdaptableScreenDialog(dialogComponent: any, data: any) {
    return this.dialog.open(dialogComponent, {
      disableClose: true,
      panelClass: this.isHandset ? 'full-screen-dialog' : 'desktop-dialog',
      data: data
    });
  }



}
