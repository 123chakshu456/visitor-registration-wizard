import { Injectable, computed, signal } from '@angular/core';
import {
  Visit,
  Host,
  VisitState,
  SEED_HOSTS,
  ALLOWED_TRANSITIONS,
  FilterTab
} from '../models/visit.model';

@Injectable({
  providedIn: 'root'
})
export class VisitService {
  private idCounter = 3301;

  // Seed with mock visitor from assignment instructions
  private readonly initialVisits: Visit[] = [
    {
      id: 'V-3301',
      visitor: {
        name: 'Priya Sharma',
        contact: '+91-9812341234'
      },
      purpose: 'Vendor meeting',
      hostEmployee: 'EMP-77',
      state: 'PENDING',
      createdAt: new Date()
    }
  ];

  // Primary state signals
  readonly visits = signal<Visit[]>([...this.initialVisits]);
  readonly hosts = signal<Host[]>([...SEED_HOSTS]);
  readonly currentFilter = signal<FilterTab>('ALL');

  // Computed signals for counts
  readonly allCount = computed(() => this.visits().length);
  readonly pendingCount = computed(() => this.visits().filter(v => v.state === 'PENDING').length);
  readonly onPremisesCount = computed(() => this.visits().filter(v => v.state === 'CHECKED_IN').length);
  readonly approvedCount = computed(() => this.visits().filter(v => v.state === 'APPROVED').length);
  readonly deniedCount = computed(() => this.visits().filter(v => v.state === 'DENIED').length);
  readonly checkedOutCount = computed(() => this.visits().filter(v => v.state === 'CHECKED_OUT').length);

  // Filtered visits for the status board
  readonly filteredVisits = computed(() => {
    const list = this.visits();
    const filter = this.currentFilter();

    switch (filter) {
      case 'PENDING':
        return list.filter(v => v.state === 'PENDING');
      case 'ON_PREMISES':
        return list.filter(v => v.state === 'CHECKED_IN');
      case 'ALL':
      default:
        return list;
    }
  });

  // Recent host notification signal (for the wireframe's host notification card)
  readonly latestPendingVisit = computed(() => {
    const pendings = this.visits().filter(v => v.state === 'PENDING');
    return pendings.length > 0 ? pendings[pendings.length - 1] : null;
  });

  // Most recently approved visit (for QR pass preview)
  readonly latestApprovedVisit = computed(() => {
    const approved = this.visits().filter(v => v.state === 'APPROVED' || v.state === 'CHECKED_IN');
    return approved.length > 0 ? approved[approved.length - 1] : null;
  });

  setFilter(filter: FilterTab): void {
    this.currentFilter.set(filter);
  }

  getHostById(hostId: string): Host | undefined {
    return this.hosts().find(h => h.id === hostId);
  }

  // Register new visit with async simulation
  async registerVisit(data: {
    name: string;
    contact: string;
    purpose: string;
    hostEmployee: string;
  }): Promise<Visit> {
    // Simulate async operation (e.g. 350ms) as per assignment instructions
    await new Promise(resolve => setTimeout(resolve, 350));

    this.idCounter += 1;
    const newVisit: Visit = {
      id: `V-${this.idCounter}`,
      visitor: {
        name: data.name.trim(),
        contact: data.contact.trim()
      },
      purpose: data.purpose,
      hostEmployee: data.hostEmployee,
      state: 'PENDING',
      createdAt: new Date()
    };

    this.visits.update(current => [newVisit, ...current]);
    return newVisit;
  }

  // Transition state machine with strict validation
  transition(visitId: string, targetState: VisitState): boolean {
    const visit = this.visits().find(v => v.id === visitId);
    if (!visit) {
      console.error(`Visit ${visitId} not found.`);
      return false;
    }

    const allowed = ALLOWED_TRANSITIONS[visit.state];
    if (!allowed.includes(targetState)) {
      console.error(`Illegal transition: Cannot move from ${visit.state} to ${targetState}`);
      return false;
    }

    this.visits.update(allVisits =>
      allVisits.map(v =>
        v.id === visitId
          ? { ...v, state: targetState, updatedAt: new Date() }
          : v
      )
    );
    return true;
  }

  approveVisit(visitId: string): boolean {
    return this.transition(visitId, 'APPROVED');
  }

  rejectVisit(visitId: string): boolean {
    return this.transition(visitId, 'DENIED');
  }

  checkInVisit(visitId: string): boolean {
    return this.transition(visitId, 'CHECKED_IN');
  }

  checkOutVisit(visitId: string): boolean {
    return this.transition(visitId, 'CHECKED_OUT');
  }

  resetAll(): void {
    this.idCounter = 3301;
    this.visits.set([
      {
        id: 'V-3301',
        visitor: {
          name: 'Priya Sharma',
          contact: '+91-9812341234'
        },
        purpose: 'Vendor meeting',
        hostEmployee: 'EMP-77',
        state: 'PENDING',
        createdAt: new Date()
      }
    ]);
    this.currentFilter.set('ALL');
  }
}
