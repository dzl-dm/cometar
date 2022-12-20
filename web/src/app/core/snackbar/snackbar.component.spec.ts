import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SnackbarComponent } from './snackbar.component';
import { MatLegacySnackBar as MatSnackBar, MAT_LEGACY_SNACK_BAR_DATA as MAT_SNACK_BAR_DATA } from '@angular/material/legacy-snack-bar';
import { CoreModule } from '../core.module';

describe('SnackbarComponent', () => {
  let component: SnackbarComponent;
  let fixture: ComponentFixture<SnackbarComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [  ],
      imports: [ CoreModule ],
      providers: [MatSnackBar,{
        provide: MAT_SNACK_BAR_DATA,
        useValue: {}
      }]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SnackbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
