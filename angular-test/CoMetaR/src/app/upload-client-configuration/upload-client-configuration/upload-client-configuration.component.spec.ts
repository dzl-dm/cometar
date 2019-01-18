import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadClientConfigurationComponent } from './upload-client-configuration.component';

describe('UploadClientConfigurationComponent', () => {
  let component: UploadClientConfigurationComponent;
  let fixture: ComponentFixture<UploadClientConfigurationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UploadClientConfigurationComponent ]
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
