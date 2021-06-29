import {ComponentFixture, TestBed} from '@angular/core/testing';

import {SubProjectComponent} from './sub-project.component';

describe('SubProjectComponent', () => {
  let component: SubProjectComponent;
  let fixture: ComponentFixture<SubProjectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SubProjectComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SubProjectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
