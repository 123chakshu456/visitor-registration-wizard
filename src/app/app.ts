import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WizardComponent } from './components/wizard/wizard.component';
import { StatusBoardComponent } from './components/status-board/status-board.component';
import { StateDiagramComponent } from './components/state-diagram/state-diagram.component';
import { HostNotificationComponent } from './components/host-notification/host-notification.component';
import { VisitService } from './services/visit.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    WizardComponent,
    StatusBoardComponent,
    StateDiagramComponent,
    HostNotificationComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private visitService = inject(VisitService);

  readonly allCount = this.visitService.allCount;
  readonly pendingCount = this.visitService.pendingCount;
  readonly onPremisesCount = this.visitService.onPremisesCount;
  readonly approvedCount = this.visitService.approvedCount;
}
