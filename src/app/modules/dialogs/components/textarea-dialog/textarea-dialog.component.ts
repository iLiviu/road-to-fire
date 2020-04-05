import { Component, OnInit, Inject, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

/**
 * Component to display a dialog with a text area, allowing user to copy a given text
 */
@Component({
  selector: 'app-textarea-dialog',
  templateUrl: './textarea-dialog.component.html',
  styleUrls: ['./textarea-dialog.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TextareaDialogComponent implements OnInit {

  constructor(public dialogRef: MatDialogRef<TextareaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: string) { }

  ngOnInit() {
  }

  copyToClipboard(inputElement: HTMLInputElement) {
    inputElement.select();
    document.execCommand('copy');
    inputElement.setSelectionRange(0, 0);
  }

}
