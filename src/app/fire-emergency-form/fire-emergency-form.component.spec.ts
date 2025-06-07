import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FireEmergencyFormComponent } from './fire-emergency-form.component';

describe('FireEmergencyFormComponent', () => {
  let component: FireEmergencyFormComponent;
  let fixture: ComponentFixture<FireEmergencyFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FireEmergencyFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FireEmergencyFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
