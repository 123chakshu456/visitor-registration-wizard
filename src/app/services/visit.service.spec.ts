import { TestBed } from '@angular/core/testing';
import { VisitService } from './visit.service';

describe('VisitService - State Machine & Data Store', () => {
  let service: VisitService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VisitService);
    service.resetAll();
  });

  it('should initialize with mock visitor V-3301 in PENDING state', () => {
    const visits = service.visits();
    expect(visits.length).toBe(1);
    expect(visits[0].id).toBe('V-3301');
    expect(visits[0].visitor.name).toBe('Priya Sharma');
    expect(visits[0].visitor.contact).toBe('+91-9812341234');
    expect(visits[0].purpose).toBe('Vendor meeting');
    expect(visits[0].hostEmployee).toBe('EMP-77');
    expect(visits[0].state).toBe('PENDING');
  });

  it('should provide the 3 seed hosts', () => {
    const hosts = service.hosts();
    expect(hosts.length).toBe(3);
    expect(hosts.map(h => h.id)).toEqual(['EMP-77', 'EMP-31', 'EMP-52']);
  });

  describe('Legal State Transitions', () => {
    it('PENDING -> APPROVED', () => {
      const ok = service.approveVisit('V-3301');
      expect(ok).toBe(true);
      const visit = service.visits().find(v => v.id === 'V-3301');
      expect(visit?.state).toBe('APPROVED');
    });

    it('PENDING -> DENIED', () => {
      const ok = service.rejectVisit('V-3301');
      expect(ok).toBe(true);
      const visit = service.visits().find(v => v.id === 'V-3301');
      expect(visit?.state).toBe('DENIED');
    });

    it('APPROVED -> CHECKED_IN', () => {
      service.approveVisit('V-3301');
      const ok = service.checkInVisit('V-3301');
      expect(ok).toBe(true);
      const visit = service.visits().find(v => v.id === 'V-3301');
      expect(visit?.state).toBe('CHECKED_IN');
    });

    it('CHECKED_IN -> CHECKED_OUT', () => {
      service.approveVisit('V-3301');
      service.checkInVisit('V-3301');
      const ok = service.checkOutVisit('V-3301');
      expect(ok).toBe(true);
      const visit = service.visits().find(v => v.id === 'V-3301');
      expect(visit?.state).toBe('CHECKED_OUT');
    });
  });

  describe('Illegal State Transitions (Blocked by FSM)', () => {
    it('should block PENDING -> CHECKED_IN directly', () => {
      const ok = service.checkInVisit('V-3301');
      expect(ok).toBe(false);
      expect(service.visits()[0].state).toBe('PENDING');
    });

    it('should block DENIED -> APPROVED', () => {
      service.rejectVisit('V-3301');
      expect(service.visits()[0].state).toBe('DENIED');

      const ok = service.approveVisit('V-3301');
      expect(ok).toBe(false);
      expect(service.visits()[0].state).toBe('DENIED');
    });

    it('should block CHECKED_OUT -> APPROVED or CHECKED_IN', () => {
      service.approveVisit('V-3301');
      service.checkInVisit('V-3301');
      service.checkOutVisit('V-3301');
      expect(service.visits()[0].state).toBe('CHECKED_OUT');

      expect(service.approveVisit('V-3301')).toBe(false);
      expect(service.checkInVisit('V-3301')).toBe(false);
      expect(service.visits()[0].state).toBe('CHECKED_OUT');
    });

    it('should block APPROVED -> DENIED', () => {
      service.approveVisit('V-3301');
      const ok = service.rejectVisit('V-3301');
      expect(ok).toBe(false);
      expect(service.visits()[0].state).toBe('APPROVED');
    });
  });

  describe('Stretch Goal: Live Tab Counts and Filtering', () => {
    it('should calculate live counts accurately across transitions', async () => {
      expect(service.allCount()).toBe(1);
      expect(service.pendingCount()).toBe(1);
      expect(service.onPremisesCount()).toBe(0);

      // Register second visitor
      const second = await service.registerVisit({
        name: 'Alex Johnson',
        contact: '9988776655',
        purpose: 'Interview',
        hostEmployee: 'EMP-31'
      });

      expect(service.allCount()).toBe(2);
      expect(service.pendingCount()).toBe(2);
      expect(service.onPremisesCount()).toBe(0);

      // Approve second visitor and check them in (On premises)
      service.approveVisit(second.id);
      service.checkInVisit(second.id);

      expect(service.allCount()).toBe(2);
      expect(service.pendingCount()).toBe(1);
      expect(service.onPremisesCount()).toBe(1);

      // Check out second visitor
      service.checkOutVisit(second.id);
      expect(service.onPremisesCount()).toBe(0);
      expect(service.checkedOutCount()).toBe(1);
    });

    it('should filter visits according to active filter tab', () => {
      service.setFilter('PENDING');
      expect(service.filteredVisits().length).toBe(1);

      service.setFilter('ON_PREMISES');
      expect(service.filteredVisits().length).toBe(0);

      // Approve and check in V-3301
      service.approveVisit('V-3301');
      service.checkInVisit('V-3301');

      expect(service.filteredVisits().length).toBe(1);
      expect(service.filteredVisits()[0].id).toBe('V-3301');
    });
  });
});
