import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TreeItemListComponent } from './tree-item-list.component';

describe('TreeItemListComponent', () => {
  let component: TreeItemListComponent;
  let fixture: ComponentFixture<TreeItemListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TreeItemListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TreeItemListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
