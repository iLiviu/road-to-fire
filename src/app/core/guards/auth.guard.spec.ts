import { TestBed, async, inject } from '@angular/core/testing';

import { AuthGuard } from './auth.guard';
import { StorageService } from '../services/storage.service';
import { MockStorageService } from '../mocks/storage.service.mock';
import { AuthService } from '../services/auth.service';
import { MockAuthService } from '../mocks/auth.service.mock';
import { RouterTestingModule } from '@angular/router/testing';

describe('AuthGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule.withRoutes([]),
      ],
      providers: [
        AuthGuard,
        { provide: StorageService, useClass: MockStorageService },
        { provide: AuthService, useClass: MockAuthService },
      ]
    });
  });

  it('should instantiate', inject([AuthGuard], (guard: AuthGuard) => {
    expect(guard).toBeTruthy();
  }));
});
