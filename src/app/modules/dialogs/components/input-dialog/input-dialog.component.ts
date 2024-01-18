import { Component, OnInit, Inject, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, UntypedFormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export enum InputDialogType {
  TEXT,
  NUMBER,
  PASSWORD
}

export interface InputDialogData {
  title: string;
  prompt: string;
  response: string;
  inputType?: InputDialogType;
  regexPattern?: string;
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
  inputForm: UntypedFormGroup;
  inputField: FormControl<string>;

  constructor(public dialogRef: MatDialogRef<InputDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: InputDialogData) {

    switch (data.inputType) {
      case InputDialogType.NUMBER: this.inputType = 'number'; break;
      case InputDialogType.TEXT: this.inputType = 'text'; break;
      case InputDialogType.PASSWORD: this.inputType = 'password'; break;
      default: this.inputType = 'text';
    }
  }
  async ngOnInit() {
    this.inputField = new FormControl<string>(this.data.response);
    this.inputForm = new UntypedFormGroup({
      inputField: this.inputField,
    });
  }

}


