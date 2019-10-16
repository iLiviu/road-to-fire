import { NgModule } from '@angular/core';
import {
  MatDialogModule, MatFormFieldModule, MatIconModule, MatButtonModule, MatInputModule, MatProgressSpinnerModule,
  MatCheckboxModule
} from '@angular/material';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { DialogsService } from './dialogs.service';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import { InputDialogComponent } from './components/input-dialog/input-dialog.component';
import { MessageDialogComponent } from './components/message-dialog/message-dialog.component';
import { LoadingScreenDialogComponent } from './components/loading-screen-dialog/loading-screen-dialog.component';
import { FlexLayoutModule } from '@angular/flex-layout';
import { TextareaDialogComponent } from './components/textarea-dialog/textarea-dialog.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    FlexLayoutModule,
  ],
  exports: [
  ],
  declarations: [
    ConfirmDialogComponent,
    InputDialogComponent,
    MessageDialogComponent,
    LoadingScreenDialogComponent,
    TextareaDialogComponent,
  ],
  providers: [
    DialogsService,
  ],
  entryComponents: [
    ConfirmDialogComponent,
    InputDialogComponent,
    MessageDialogComponent,
    LoadingScreenDialogComponent,
    TextareaDialogComponent
  ],
})
export class DialogsModule { }
