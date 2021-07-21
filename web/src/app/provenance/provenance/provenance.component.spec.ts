import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ProvenanceComponent } from './provenance.component';
import { CoreModule } from 'src/app/core/core.module';
import { ProvenanceModule } from '../provenance.module';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('ProvenanceComponent', () => {
  let component: ProvenanceComponent;
  let fixture: ComponentFixture<ProvenanceComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [  ],
      imports: [ CoreModule, ProvenanceModule, HttpClientTestingModule, RouterTestingModule, BrowserAnimationsModule ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProvenanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
