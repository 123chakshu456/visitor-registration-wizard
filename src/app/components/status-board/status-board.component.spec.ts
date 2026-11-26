import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatusBoardComponent } from './status-board.component';
import { VisitService } from '../../services/visit.service';

describe('StatusBoardComponent - State Machine Transitions & Stretch Filters', () => {
  let component: StatusBoardComponent;
  let fixture: ComponentFixture<StatusBoardComponent>;
  let visitService: VisitService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusBoardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(StatusBoardComponent);
    component = fixture.componentInstance;
    visitService = TestBed.inject(VisitService);
    visitService.resetAll();
    fixture.detectChanges();
  });

  it('Register Priya -> board shows PENDING with Approve/Reject buttons', () => {
    const chip = fixture.nativeElement.querySelector('#chip-V-3301');
    expect(chip?.textContent).toContain('PENDING');
    expect(chip?.classList.contains('chip-amber')).toBe(true);

    const approveBtn = fixture.nativeElement.querySelector('#approve-btn-V-3301');
    const rejectBtn = fixture.nativeElement.querySelector('#reject-btn-V-3301');
    expect(approveBtn).toBeTruthy();
    expect(rejectBtn).toBeTruthy();

    const checkInBtn = fixture.nativeElement.querySelector('#checkin-btn-V-3301');
    expect(checkInBtn).toBeFalsy();
  });

  it('Approve -> chip flips APPROVED, buttons become just Check in', () => {
    const approveBtn = fixture.nativeElement.querySelector('#approve-btn-V-3301') as HTMLButtonElement;
    approveBtn.click();
    fixture.detectChanges();

    const chip = fixture.nativeElement.querySelector('#chip-V-3301');
    expect(chip?.textContent).toContain('APPROVED');
    expect(chip?.classList.contains('chip-green')).toBe(true);

    // Approve & Reject buttons are gone
    expect(fixture.nativeElement.querySelector('#approve-btn-V-3301')).toBeFalsy();
    expect(fixture.nativeElement.querySelector('#reject-btn-V-3301')).toBeFalsy();

    // Now Check in button is present
    const checkInBtn = fixture.nativeElement.querySelector('#checkin-btn-V-3301');
    expect(checkInBtn).toBeTruthy();
    expect(checkInBtn?.textContent).toContain('Check in');
  });

  it('Reject a visitor -> DENIED, no buttons remain on that row', () => {
    const rejectBtn = fixture.nativeElement.querySelector('#reject-btn-V-3301') as HTMLButtonElement;
    rejectBtn.click();
    fixture.detectChanges();

    const chip = fixture.nativeElement.querySelector('#chip-V-3301');
    expect(chip?.textContent).toContain('DENIED');
    expect(chip?.classList.contains('chip-red')).toBe(true);

    // No buttons remain
    expect(fixture.nativeElement.querySelector('#approve-btn-V-3301')).toBeFalsy();
    expect(fixture.nativeElement.querySelector('#reject-btn-V-3301')).toBeFalsy();
    expect(fixture.nativeElement.querySelector('#checkin-btn-V-3301')).toBeFalsy();
    expect(fixture.nativeElement.querySelector('#checkout-btn-V-3301')).toBeFalsy();
  });

  it('APPROVED -> Check in renders CHECKED_IN (blue) and Check out button', () => {
    // Transition to APPROVED
    visitService.approveVisit('V-3301');
    fixture.detectChanges();

    const checkInBtn = fixture.nativeElement.querySelector('#checkin-btn-V-3301') as HTMLButtonElement;
    checkInBtn.click();
    fixture.detectChanges();

    const chip = fixture.nativeElement.querySelector('#chip-V-3301');
    expect(chip?.textContent).toContain('CHECKED_IN');
    expect(chip?.classList.contains('chip-blue')).toBe(true);

    // Now only Check out button remains
    const checkOutBtn = fixture.nativeElement.querySelector('#checkout-btn-V-3301');
    expect(checkOutBtn).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#checkin-btn-V-3301')).toBeFalsy();
  });

  it('CHECKED_IN -> Check out renders CHECKED_OUT (gray) and no buttons remain', () => {
    visitService.approveVisit('V-3301');
    visitService.checkInVisit('V-3301');
    fixture.detectChanges();

    const checkOutBtn = fixture.nativeElement.querySelector('#checkout-btn-V-3301') as HTMLButtonElement;
    checkOutBtn.click();
    fixture.detectChanges();

    const chip = fixture.nativeElement.querySelector('#chip-V-3301');
    expect(chip?.textContent).toContain('CHECKED_OUT');
    expect(chip?.classList.contains('chip-gray')).toBe(true);

    // Terminal state - no buttons remain
    expect(fixture.nativeElement.querySelector('#checkout-btn-V-3301')).toBeFalsy();
  });

  describe('Stretch Goal Filter Tabs', () => {
    it('switches tabs and filters visitors with live counts', async () => {
      // Add second visitor and check them in
      const v2 = await visitService.registerVisit({
        name: 'Rahul Verma',
        contact: '9898989898',
        purpose: 'Maintenance',
        hostEmployee: 'EMP-52'
      });
      visitService.approveVisit(v2.id);
      visitService.checkInVisit(v2.id);
      fixture.detectChanges();

      // Check tab counts
      const tabAll = fixture.nativeElement.querySelector('#tab-all');
      const tabPending = fixture.nativeElement.querySelector('#tab-pending');
      const tabOnPremises = fixture.nativeElement.querySelector('#tab-on-premises');

      expect(tabAll?.textContent).toContain('All');
      expect(tabAll?.textContent).toContain('2');

      expect(tabPending?.textContent).toContain('Pending');
      expect(tabPending?.textContent).toContain('1');

      expect(tabOnPremises?.textContent).toContain('On premises');
      expect(tabOnPremises?.textContent).toContain('1');

      // Click "On premises" tab
      tabOnPremises.click();
      fixture.detectChanges();

      // Only Rahul should be visible
      expect(fixture.nativeElement.querySelector('#visit-row-' + v2.id)).toBeTruthy();
      expect(fixture.nativeElement.querySelector('#visit-row-V-3301')).toBeFalsy();
    });
  });
});
