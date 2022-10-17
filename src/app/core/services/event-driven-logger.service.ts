import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { LoggerService, LoggerEvent, LogLevel } from './logger.service';

export let isDebugMode = !environment.production;

/**
 * Implementation of LoggerService that emits the logs as events.
 * If app is running in development mode, it also sends the logs to
 * the console.
 */
@Injectable()
export class EventDrivenLoggerService implements LoggerService {


  private eventsSource = new Subject<LoggerEvent>();

  private readonly events$ = this.eventsSource.asObservable();

  info(msg: string) {
    this.eventsSource.next({
      level: LogLevel.Info,
      message: msg
    });
    if (isDebugMode) {
      // eslint-disable-next-line no-console
      console.info(msg);
    }
  }

  warn(msg: string) {
    this.eventsSource.next({
      level: LogLevel.Warn,
      message: msg
    });
    if (isDebugMode) {
      // eslint-disable-next-line no-console
      console.warn(msg);
    }
  }

  error(msg: string, error?: any) {
    this.eventsSource.next({
      level: LogLevel.Error,
      message: msg,
      error: error
    });
    if (isDebugMode) {
      // eslint-disable-next-line no-console
      console.error(msg);
      if (error) {
        // eslint-disable-next-line no-console
        console.error(error);
      }
    }
  }

  asObservable(): Observable<LoggerEvent> {
    return this.events$;
  }

}
