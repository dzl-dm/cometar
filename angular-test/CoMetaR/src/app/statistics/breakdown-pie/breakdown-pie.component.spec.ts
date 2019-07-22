import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BreakdownPieComponent } from './breakdown-pie.component';
import { StatisticsModule } from '../statistics.module';

describe('BreakdownPieComponent', () => {
  let component: BreakdownPieComponent;
  let fixture: ComponentFixture<BreakdownPieComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [ StatisticsModule ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BreakdownPieComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
