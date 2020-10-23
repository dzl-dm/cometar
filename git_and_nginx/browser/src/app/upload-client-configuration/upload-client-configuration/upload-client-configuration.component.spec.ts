import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadClientConfigurationComponent } from './upload-client-configuration.component';
import { CoreModule } from 'src/app/core/core.module';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('UploadClientConfigurationComponent', () => {
  let component: UploadClientConfigurationComponent;
  let fixture: ComponentFixture<UploadClientConfigurationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UploadClientConfigurationComponent ],
      imports: [ CoreModule, FormsModule, RouterTestingModule, HttpClientTestingModule, BrowserAnimationsModule ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UploadClientConfigurationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
