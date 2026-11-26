import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WizardComponent } from './wizard.component';
import { VisitService } from '../../services/visit.service';

describe('WizardComponent - Multi-step Registration', () => {
  let component: WizardComponent;
  let fixture: ComponentFixture<WizardComponent>;
  let visitService: VisitService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WizardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(WizardComponent);
    component = fixture.componentInstance;
    visitService = TestBed.inject(VisitService);
    visitService.resetAll();
    fixture.detectChanges();
  });

  it('should initialize at Step 1', () => {
    expect(component.currentStep()).toBe(1);
    expect(component.isStep1Valid).toBe(false);
  });

  describe('Step 1 Validation & Worked Examples', () => {
    it('Enter "Pr" in name -> inline "min 3 characters", Next disabled', () => {
      component.nameControl.setValue('Pr');
      component.nameControl.markAsDirty();
      component.nameControl.markAsTouched();
      fixture.detectChanges();

      expect(component.nameControl.errors?.['minlength']).toBeTruthy();
      expect(component.isStep1Valid).toBe(false);

      const nextBtn = fixture.nativeElement.querySelector('#step1-next-btn') as HTMLButtonElement;
      expect(nextBtn.disabled).toBe(true);

      const errorEl = fixture.nativeElement.querySelector('#name-error');
      expect(errorEl?.textContent).toContain('min 3 characters');
    });

    it('Contact like "98123-41234" or 9 digits -> rejected with the format hint', () => {
      // Test hyphen in middle
      component.contactControl.setValue('98123-41234');
      component.contactControl.markAsDirty();
      component.contactControl.markAsTouched();
      fixture.detectChanges();

      expect(component.contactControl.errors?.['pattern']).toBeTruthy();
      expect(component.isStep1Valid).toBe(false);

      const errorEl = fixture.nativeElement.querySelector('#contact-error');
      expect(errorEl?.textContent).toContain('Invalid format');

      // Test 9 digits
      component.contactControl.setValue('981234567');
      expect(component.contactControl.errors?.['pattern']).toBeTruthy();
      expect(component.isStep1Valid).toBe(false);
    });

    it('Priya Sharma + valid phone -> Next enables', () => {
      component.nameControl.setValue('Priya Sharma');
      component.contactControl.setValue('+91-9812341234');
      fixture.detectChanges();

      expect(component.isStep1Valid).toBe(true);
      const nextBtn = fixture.nativeElement.querySelector('#step1-next-btn') as HTMLButtonElement;
      expect(nextBtn.disabled).toBe(false);

      // Also verify pure 10-digit number
      component.contactControl.setValue('9812341234');
      expect(component.isStep1Valid).toBe(true);
      expect(nextBtn.disabled).toBe(false);
    });

    it('advances to Step 2 when Next is clicked with valid Step 1 data', () => {
      component.nameControl.setValue('Priya Sharma');
      component.contactControl.setValue('9812341234');
      fixture.detectChanges();

      component.nextFromStep1();
      fixture.detectChanges();

      expect(component.currentStep()).toBe(2);
    });
  });

  describe('Step 2 Visit Details & Host Picker', () => {
    beforeEach(() => {
      component.nameControl.setValue('Priya Sharma');
      component.contactControl.setValue('+91-9812341234');
      component.nextFromStep1();
      fixture.detectChanges();
    });

    it('Back button must preserve everything entered in Step 1', () => {
      expect(component.currentStep()).toBe(2);

      component.backToStep1();
      fixture.detectChanges();

      expect(component.currentStep()).toBe(1);
      expect(component.nameControl.value).toBe('Priya Sharma');
      expect(component.contactControl.value).toBe('+91-9812341234');
    });

    it('Typing in the host picker with no matches -> "no hosts found" empty state', () => {
      component.hostSearchQuery.set('xyzNonExistent');
      component.isHostDropdownOpen.set(true);
      fixture.detectChanges();

      expect(component.filteredHosts().length).toBe(0);
      const emptyStateEl = fixture.nativeElement.querySelector('.empty-state-hosts');
      expect(emptyStateEl?.textContent).toContain('no hosts found');
    });

    it('filtering and selecting a host marks step 2 as valid', () => {
      component.purposeControl.setValue('Meeting');
      const manish = component.hosts().find(h => h.id === 'EMP-77')!;
      component.selectHost(manish);
      fixture.detectChanges();

      expect(component.hostControl.value).toBe('EMP-77');
      expect(component.isStep2Valid).toBe(true);

      const nextBtn = fixture.nativeElement.querySelector('#step2-next-btn') as HTMLButtonElement;
      expect(nextBtn.disabled).toBe(false);
    });
  });

  describe('Step 3 Review & Submit Round-trip', () => {
    beforeEach(() => {
      component.nameControl.setValue('Priya Sharma');
      component.contactControl.setValue('+91-9812341234');
      component.nextFromStep1();

      component.purposeControl.setValue('Vendor meeting');
      const host = component.hosts().find(h => h.id === 'EMP-77')!;
      component.selectHost(host);
      component.nextFromStep2();
      fixture.detectChanges();
    });

    it('displays summary of all fields on Step 3', () => {
      expect(component.currentStep()).toBe(3);

      const nameReview = fixture.nativeElement.querySelector('#review-name');
      const contactReview = fixture.nativeElement.querySelector('#review-contact');
      const purposeReview = fixture.nativeElement.querySelector('#review-purpose');
      const hostReview = fixture.nativeElement.querySelector('#review-host');

      expect(nameReview?.textContent).toContain('Priya Sharma');
      expect(contactReview?.textContent).toContain('+91-9812341234');
      expect(purposeReview?.textContent).toContain('Vendor meeting');
      expect(hostReview?.textContent).toContain('Manish R');
    });

    it('Edit from Step 3 back to Step 1, change the name, return — Step 2 data must survive the round trip', () => {
      // Click edit on Step 1
      component.goToStep(1);
      fixture.detectChanges();
      expect(component.currentStep()).toBe(1);

      // Change visitor name
      component.nameControl.setValue('Priya Updated');

      // Return to Step 3
      component.goToStep(3);
      fixture.detectChanges();
      expect(component.currentStep()).toBe(3);

      // Step 2 data must survive!
      expect(component.purposeControl.value).toBe('Vendor meeting');
      expect(component.hostControl.value).toBe('EMP-77');

      // Step 1 updated name is reflected
      const nameReview = fixture.nativeElement.querySelector('#review-name');
      expect(nameReview?.textContent).toContain('Priya Updated');
    });

    it('Submit adds the visit as PENDING to the status board and resets the wizard', async () => {
      const initialCount = visitService.visits().length;

      await component.onSubmit();
      fixture.detectChanges();

      // Visit added to board
      expect(visitService.visits().length).toBe(initialCount + 1);
      const newlyAdded = visitService.visits()[0];
      expect(newlyAdded.state).toBe('PENDING');
      expect(newlyAdded.visitor.name).toBe('Priya Sharma');

      // Wizard reset back to step 1
      expect(component.currentStep()).toBe(1);
      expect(component.nameControl.value).toBe('');
      expect(component.contactControl.value).toBe('');
      expect(component.purposeControl.value).toBe('');
      expect(component.hostControl.value).toBe('');
    });
  });
});
