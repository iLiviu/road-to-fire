import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export enum LogLevel {
  Info,
  Warn,
  Error
}

export interface LoggerEvent {
  level: LogLevel;
  message: string;
  error?: any;
}

/**
 * Abstract logger service
 */
@Injectable({
  providedIn: 'root'
})
export abstract class LoggerService {

  /**
   * Logs an info message
   * @param msg log message
   */
  abstract info(msg: string): void;

  /**
   * Logs a warning message
   * @param msg log message
   */
  abstract warn(msg: string): void;

  /**
   * Logs an error message
   * @param msg log message
   * @param error error object
   */
  abstract error(msg: string, error?: any): void;

  abstract asObservable(): Observable<LoggerEvent>;

  constructor() { }
}
