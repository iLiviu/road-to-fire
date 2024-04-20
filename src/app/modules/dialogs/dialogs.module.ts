import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { DialogsService } from './dialogs.service';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import { InputDialogComponent } from './components/input-dialog/input-dialog.component';
import { MessageDialogComponent } from './components/message-dialog/message-dialog.component';
import { LoadingScreenDialogComponent } from './components/loading-screen-dialog/loading-screen-dialog.component';
import { FlexLayoutModule } from '@angular/flex-layout';
import { TextareaDialogComponent } from './components/textarea-dialog/textarea-dialog.component';
import { LogDisplayDialogComponent } from './components/log-display-dialog/log-display-dialog.component';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatButtonModule,
        MatCheckboxModule,
        MatProgressSpinnerModule,
        FlexLayoutModule,
    ],
    exports: [],
    declarations: [
        ConfirmDialogComponent,
        InputDialogComponent,
        MessageDialogComponent,
        LoadingScreenDialogComponent,
        TextareaDialogComponent,
        LogDisplayDialogComponent,
    ],
    providers: [
        DialogsService,
    ]
})
export class DialogsModule { }
