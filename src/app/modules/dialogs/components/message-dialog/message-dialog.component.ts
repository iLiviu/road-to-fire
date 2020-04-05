import { Component, OnInit, Inject, ChangeDetectionStrategy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export enum MessageDialogType {
  CUSTOM,
  INFO,
  WARNING,
  ERROR
}

export interface MessageDialogData {
  title: string;
  message: string;
  displayDontShowAgain?: boolean;
  type?: MessageDialogType;
}

/**
 * A component displaying a dialog with a given message
 */
@Component({
  selector: 'app-message-dialog',
  templateUrl: './message-dialog.component.html',
  styleUrls: ['./message-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MessageDialogComponent implements OnInit {

  icon: string;
  dontShowAgain: boolean;

  constructor(public dialogRef: MatDialogRef<MessageDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MessageDialogData) {

    switch (data.type) {
      case MessageDialogType.ERROR: this.icon = 'error'; break;
      case MessageDialogType.INFO: this.icon = 'info'; break;
      case MessageDialogType.WARNING: this.icon = 'warning'; break;
      default:
        this.icon = '';
    }

  }

  ngOnInit() {
  }

}
