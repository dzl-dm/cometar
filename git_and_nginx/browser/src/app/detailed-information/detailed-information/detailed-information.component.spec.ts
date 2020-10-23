import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailedInformationComponent } from './detailed-information.component';
import { CoreModule } from 'src/app/core/core.module';
import { MatIconRegistry } from '@angular/material/icon';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('DetailedInformationComponent', () => {
  let component: DetailedInformationComponent;
  let fixture: ComponentFixture<DetailedInformationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DetailedInformationComponent ],
      imports: [ CoreModule, HttpClientTestingModule, RouterTestingModule, BrowserAnimationsModule ],
      providers: [MatIconRegistry]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DetailedInformationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
