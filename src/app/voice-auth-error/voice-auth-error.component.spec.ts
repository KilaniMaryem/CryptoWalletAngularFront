import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VoiceAuthErrorComponent } from './voice-auth-error.component';

describe('VoiceAuthErrorComponent', () => {
  let component: VoiceAuthErrorComponent;
  let fixture: ComponentFixture<VoiceAuthErrorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VoiceAuthErrorComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VoiceAuthErrorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
