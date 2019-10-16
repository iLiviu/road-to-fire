import { Component, OnInit, Inject, ChangeDetectionStrategy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { Observable } from 'rxjs';


export interface LoadingScreenDialogData {
  message: string;
}

/**
 * A component to display a loading screen dialog
 */
@Component({
  selector: 'app-loading-screen-dialog',
  templateUrl: './loading-screen-dialog.component.html',
  styleUrls: ['./loading-screen-dialog.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoadingScreenDialogComponent implements OnInit {

  constructor(public dialogRef: MatDialogRef<LoadingScreenDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: LoadingScreenDialogData) {

  }

  ngOnInit() {
  }

}
