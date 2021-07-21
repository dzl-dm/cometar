import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TextWithNavigationComponent } from './text-with-navigation.component';
import { CoreModule } from '../core.module';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('TextWithNavigationComponent', () => {
  let component: TextWithNavigationComponent;
  let fixture: ComponentFixture<TextWithNavigationComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [  ],
      imports: [ CoreModule, RouterTestingModule, HttpClientTestingModule ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TextWithNavigationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
