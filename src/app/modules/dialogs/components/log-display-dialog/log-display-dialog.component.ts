import { Component, OnInit, Inject, ChangeDetectionStrategy, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { LogLevel, LoggerService } from 'src/app/core/services/logger.service';

export interface LogDisplayDialogData {
  capturedLogLevels: LogLevel[];
  allowClose: boolean;
}

/**
 * Component to display a dialog that captures & display application logs while it is open
 */
@Component({
  selector: 'app-log-display-dialog',
  templateUrl: './log-display-dialog.component.html',
  styleUrls: ['./log-display-dialog.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LogDisplayDialogComponent implements OnInit, OnDestroy {

  private componentDestroyed$ = new Subject();
  public logData = "";

  constructor(public dialogRef: MatDialogRef<LogDisplayDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: LogDisplayDialogData, private logger: LoggerService, 
    private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    this.logger.asObservable()
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe(event => {
        if (event.level in this.data.capturedLogLevels) {
          // no UI interaction here, queue the event
          setTimeout(() => {
            this.logMessage(event.message, event.level);
          });
        }
      });
  }

  private logMessage(message: string, level: LogLevel) {
    let levelStr = "";
    switch (level) {
      case LogLevel.Error: levelStr = 'error'; break;
      case LogLevel.Info: levelStr = 'info'; break;
      case LogLevel.Warn: levelStr = 'warning'; break;
    }
    const timeStr = new Date().toLocaleString();
    this.logData += `[${timeStr}] (${levelStr})> ${message}\n`;
    this.cdr.markForCheck();
  }


  ngOnDestroy() {
    this.componentDestroyed$.next();
    this.componentDestroyed$.unsubscribe();
  }

  copyToClipboard(inputElement: HTMLInputElement) {
    navigator.clipboard.writeText(this.logData);
  }

}
