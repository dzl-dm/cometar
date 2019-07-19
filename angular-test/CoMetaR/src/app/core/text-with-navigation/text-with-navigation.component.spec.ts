import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TextWithNavigationComponent } from './text-with-navigation.component';

describe('TextWithNavigationComponent', () => {
  let component: TextWithNavigationComponent;
  let fixture: ComponentFixture<TextWithNavigationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TextWithNavigationComponent ]
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
