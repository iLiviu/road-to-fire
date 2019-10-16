import { LoggerService, LoggerEvent } from '../services/logger.service';
import { Observable } from 'rxjs';

export class MockLoggerService extends LoggerService {
  info(msg: string): void {
  }
    warn(msg: string): void {
  }
  error(msg: string, error?: any): void {
  }
  asObservable(): Observable<LoggerEvent> {
    throw new Error('Method not implemented.');
  }
}
