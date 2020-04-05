import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';

import { RStorageWidgetCloseButtonComponent } from './rstoragewidget-close-button.component';
import { MockStorageService } from '../../mocks/storage.service.mock';
import { MockConfigService } from '../../mocks/config.service.mock';
import { MockDialogsService } from 'src/app/modules/dialogs/mocks/dialogs.service.mock';
import { DialogsService } from 'src/app/modules/dialogs/dialogs.service';
import { ConfigService } from '../../services/config.service';
import { StorageService } from '../../services/storage.service';

describe('RStorageWidgetCloseButtonComponent', () => {
  let component: RStorageWidgetCloseButtonComponent;
  let fixture: ComponentFixture<RStorageWidgetCloseButtonComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        MatIconModule,
      ],
      providers: [
        { provide: StorageService, useClass: MockStorageService },
        { provide: ConfigService, useClass: MockConfigService },
        { provide: DialogsService, useClass: MockDialogsService },
      ],
      declarations: [ RStorageWidgetCloseButtonComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RStorageWidgetCloseButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
