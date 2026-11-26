import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VisitService } from '../../services/visit.service';
import { FilterTab, Host, Visit, VisitState } from '../../models/visit.model';

@Component({
  selector: 'app-status-board',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-board.component.html',
  styleUrl: './status-board.component.css'
})
export class StatusBoardComponent {
  readonly visitService = inject(VisitService);

  readonly currentFilter = this.visitService.currentFilter;
  readonly filteredVisits = this.visitService.filteredVisits;

  // Live count computed signals for filter tabs
  readonly allCount = this.visitService.allCount;
  readonly pendingCount = this.visitService.pendingCount;
  readonly onPremisesCount = this.visitService.onPremisesCount;

  setFilter(tab: FilterTab): void {
    this.visitService.setFilter(tab);
  }

  getHost(hostId: string): Host | undefined {
    return this.visitService.getHostById(hostId);
  }

  // Legal transitions triggered only by permitted buttons
  onApprove(visit: Visit): void {
    if (visit.state === 'PENDING') {
      this.visitService.approveVisit(visit.id);
    }
  }

  onReject(visit: Visit): void {
    if (visit.state === 'PENDING') {
      this.visitService.rejectVisit(visit.id);
    }
  }

  onCheckIn(visit: Visit): void {
    if (visit.state === 'APPROVED') {
      this.visitService.checkInVisit(visit.id);
    }
  }

  onCheckOut(visit: Visit): void {
    if (visit.state === 'CHECKED_IN') {
      this.visitService.checkOutVisit(visit.id);
    }
  }

  // Seed sample visitors to easily test and demonstrate all state transitions
  seedSampleData(): void {
    const service = this.visitService;
    // Add an approved visitor
    service.registerVisit({
      name: 'Amit Patel',
      contact: '9876543210',
      purpose: 'Interview',
      hostEmployee: 'EMP-31'
    }).then(v => {
      service.approveVisit(v.id);
    });

    // Add a checked in visitor
    service.registerVisit({
      name: 'Sneha Rao',
      contact: '+91-9123456789',
      purpose: 'Delivery',
      hostEmployee: 'EMP-52'
    }).then(v => {
      service.approveVisit(v.id);
      service.checkInVisit(v.id);
    });
  }

  resetData(): void {
    this.visitService.resetAll();
  }
}
