import { Component, OnInit, Inject, ChangeDetectionStrategy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

export enum InputDialogType {
  TEXT,
  NUMBER
}

export interface InputDialogData {
  title: string;
  prompt: string;
  response: string;
  inputType?: InputDialogType;
}

/**
 * Component to display a dialog asking user to provide an input
 */
@Component({
  selector: 'app-input-dialog',
  templateUrl: './input-dialog.component.html',
  styleUrls: ['./input-dialog.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InputDialogComponent implements OnInit {

  inputType: string;

  constructor(public dialogRef: MatDialogRef<InputDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: InputDialogData) {

    switch (data.inputType) {
      case InputDialogType.NUMBER: this.inputType = 'number'; break;
      case InputDialogType.TEXT: this.inputType = 'text'; break;
      default: this.inputType = 'text';
    }

  }

  ngOnInit() {
  }

}


