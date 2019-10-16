import { MessageDialogType } from '../components/message-dialog/message-dialog.component';
import { InputDialogType } from '../components/input-dialog/input-dialog.component';

export class MockDialogsService {

  confirmResponse = false;
  messageBoxResponse = false;
  inputResponse = '';
  infoResponse = false;
  warnResponse = false;
  errorResponse = false;
  dialogRef = {};
  modalResponse: any;

  confirm(question: string, title?: string): Promise<boolean> {
    return Promise.resolve(this.confirmResponse);
  }

  private messageBox(message: string, title?: string, dialogType?: MessageDialogType, displayDontShowAgain?: boolean): Promise<boolean> {
    return Promise.resolve(this.messageBoxResponse);
  }


  input(prompt: string, title?: string, defaultValue?: string, inputType?: InputDialogType): Promise<string> {
    return Promise.resolve(this.inputResponse);
  }

  info(message: string, title?: string, displayDontShowAgain?: boolean): Promise<boolean> {
    return Promise.resolve(this.infoResponse);
  }

  warn(message: string, title?: string, displayDontShowAgain?: boolean): Promise<boolean> {
    return Promise.resolve(this.warnResponse);
  }

  error(message: string, title?: string, displayDontShowAgain?: boolean): Promise<boolean> {
    return Promise.resolve(this.errorResponse);
  }

  loadingScreen(message: string) {
    return this.dialogRef;
  }

  textarea(content: string) {
    return this.dialogRef;
  }

  openFullScreenDialog(dialogComponent: any, data: any) {
    return this.dialogRef;
  }

  showFullScreenModal(dialogComponent: any, data: any) {
    return Promise.resolve(this.modalResponse);
  }

  showModal(dialogComponent: any, data: any) {
    return Promise.resolve(this.modalResponse);
  }
}
