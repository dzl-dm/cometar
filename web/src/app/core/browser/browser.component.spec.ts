import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { BrowserComponent } from './browser.component';
import { CoreModule } from '../core.module';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatIconRegistry } from '@angular/material/icon';
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('BrowserComponent', () => {
  let component: BrowserComponent;
  let fixture: ComponentFixture<BrowserComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [  ],
      imports: [ CoreModule, RouterTestingModule, HttpClientTestingModule, BrowserAnimationsModule ],
      providers: [MatSnackBar, MatIconRegistry]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BrowserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
