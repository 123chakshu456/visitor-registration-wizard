import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { VisitService } from '../../services/visit.service';
import { Host, VISIT_PURPOSES } from '../../models/visit.model';

@Component({
  selector: 'app-wizard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './wizard.component.html',
  styleUrl: './wizard.component.css'
})
export class WizardComponent {
  private visitService = inject(VisitService);

  readonly currentStep = signal<1 | 2 | 3>(1);
  readonly isSubmitting = signal<boolean>(false);
  readonly submissionSuccess = signal<string | null>(null);

  readonly purposes = VISIT_PURPOSES;
  readonly hosts = this.visitService.hosts;

  // Host search query for the type-to-filter picker
  readonly hostSearchQuery = signal<string>('');
  readonly isHostDropdownOpen = signal<boolean>(false);

  // Contact regex: accepts 10 digits with optional +91 prefix (+91, +91-, +91 )
  // Rejects invalid patterns like 9 digits or hyphens in between (e.g. 98123-41234)
  private readonly phonePattern = /^(?:\+91[\s-]?)?[0-9]{10}$/;

  readonly wizardForm = new FormGroup({
    visitor: new FormGroup({
      name: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(3)]
      }),
      contact: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.pattern(this.phonePattern)]
      })
    }),
    visit: new FormGroup({
      purpose: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required]
      }),
      hostEmployee: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required]
      })
    })
  });

  // Filtered hosts based on search query
  readonly filteredHosts = computed(() => {
    const query = this.hostSearchQuery().trim().toLowerCase();
    const allHosts = this.hosts();
    if (!query) {
      return allHosts;
    }
    return allHosts.filter(
      h =>
        h.name.toLowerCase().includes(query) ||
        h.id.toLowerCase().includes(query) ||
        (h.department && h.department.toLowerCase().includes(query))
    );
  });

  // Selected host display
  readonly selectedHost = computed<Host | undefined>(() => {
    const hostId = this.wizardForm.get('visit.hostEmployee')?.value;
    if (!hostId) return undefined;
    return this.hosts().find(h => h.id === hostId);
  });

  // Per-step validity helpers
  get isStep1Valid(): boolean {
    const visitorGroup = this.wizardForm.get('visitor');
    return !!visitorGroup && visitorGroup.valid;
  }

  get isStep2Valid(): boolean {
    const visitGroup = this.wizardForm.get('visit');
    return !!visitGroup && visitGroup.valid;
  }

  // Getters for form controls
  get nameControl() {
    return this.wizardForm.get('visitor.name') as FormControl;
  }

  get contactControl() {
    return this.wizardForm.get('visitor.contact') as FormControl;
  }

  get purposeControl() {
    return this.wizardForm.get('visit.purpose') as FormControl;
  }

  get hostControl() {
    return this.wizardForm.get('visit.hostEmployee') as FormControl;
  }

  // Navigation
  goToStep(step: 1 | 2 | 3): void {
    if (step === 2 && !this.isStep1Valid) {
      this.nameControl.markAsTouched();
      this.contactControl.markAsTouched();
      return;
    }
    if (step === 3 && (!this.isStep1Valid || !this.isStep2Valid)) {
      this.purposeControl.markAsTouched();
      this.hostControl.markAsTouched();
      return;
    }
    this.currentStep.set(step);
    this.submissionSuccess.set(null);
  }

  nextFromStep1(): void {
    if (this.isStep1Valid) {
      this.currentStep.set(2);
    } else {
      this.nameControl.markAsTouched();
      this.contactControl.markAsTouched();
    }
  }

  backToStep1(): void {
    // Step 2 values are preserved in the form state
    this.currentStep.set(1);
  }

  nextFromStep2(): void {
    if (this.isStep2Valid) {
      this.currentStep.set(3);
    } else {
      this.purposeControl.markAsTouched();
      this.hostControl.markAsTouched();
    }
  }

  backToStep2(): void {
    this.currentStep.set(2);
  }

  // Host picker interaction
  onHostInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.hostSearchQuery.set(input.value);
    this.isHostDropdownOpen.set(true);
  }

  openHostDropdown(): void {
    this.isHostDropdownOpen.set(true);
  }

  selectHost(host: Host): void {
    this.hostControl.setValue(host.id);
    this.hostControl.markAsDirty();
    this.hostControl.markAsTouched();
    this.hostSearchQuery.set(host.name);
    this.isHostDropdownOpen.set(false);
  }

  clearHostSelection(): void {
    this.hostControl.setValue('');
    this.hostSearchQuery.set('');
    this.isHostDropdownOpen.set(true);
  }

  // Submit visit
  async onSubmit(): Promise<void> {
    if (!this.wizardForm.valid) {
      return;
    }

    this.isSubmitting.set(true);
    const formVal = this.wizardForm.getRawValue();

    try {
      const created = await this.visitService.registerVisit({
        name: formVal.visitor.name,
        contact: formVal.visitor.contact,
        purpose: formVal.visit.purpose,
        hostEmployee: formVal.visit.hostEmployee
      });

      this.submissionSuccess.set(`Visitor ${created.visitor.name} (${created.id}) registered successfully as PENDING.`);

      // Reset wizard back to Step 1 with empty fields
      this.wizardForm.reset({
        visitor: { name: '', contact: '' },
        visit: { purpose: '', hostEmployee: '' }
      });
      this.hostSearchQuery.set('');
      this.isHostDropdownOpen.set(false);
      this.currentStep.set(1);
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
