import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VisitService } from '../../services/visit.service';

@Component({
  selector: 'app-host-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './host-notification.component.html',
  styleUrl: './host-notification.component.css'
})
export class HostNotificationComponent {
  private visitService = inject(VisitService);

  readonly latestPending = this.visitService.latestPendingVisit;
  readonly latestApproved = this.visitService.latestApprovedVisit;

  getHostName(id: string): string {
    const h = this.visitService.getHostById(id);
    return h ? `${h.name} (${h.id})` : id;
  }

  approve(id: string): void {
    this.visitService.approveVisit(id);
  }

  reject(id: string): void {
    this.visitService.rejectVisit(id);
  }
}
