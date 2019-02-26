import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ConceptInformationComponent } from './concept-information.component';

describe('ConceptInformationComponent', () => {
  let component: ConceptInformationComponent;
  let fixture: ComponentFixture<ConceptInformationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ConceptInformationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConceptInformationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
