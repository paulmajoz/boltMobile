import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { Subscription } from 'rxjs';
import { HeaderRefreshService } from '../../services/header-refresh.service'; // 👈 Import it

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {
  userInfo: any = {};
  private refreshSub!: Subscription;

  constructor(
    private userService: UserService,
    private router: Router,
    private headerRefreshService: HeaderRefreshService // 👈 Inject it
  ) {}

  ngOnInit() {
    this.loadHeaderData();

    // 👇 Subscribe to refresh trigger
    this.refreshSub = this.headerRefreshService.refreshHeader$.subscribe(() => {
      this.loadHeaderData();
    });
  }

  loadHeaderData(): void {
    const employeeNumber = this.userService.getUser();
    if (employeeNumber) {
      this.userInfo.employeeNumber = employeeNumber;

      let closingBalance = 0;

      this.userService.getUserBalance().subscribe({
        next: (balanceData) => {
          closingBalance = (balanceData?.closingBalance ?? 0) * 0.01;
          this.userInfo.amountDue = closingBalance * 1.115;
          fetchAirtimeLimit();
        },
        error: (err) => {
          console.error('❌ Error fetching balance:', err);
          closingBalance = 0;
          this.userInfo.amountDue = 0;
          fetchAirtimeLimit();
        }
      });

      const fetchAirtimeLimit = () => {
        this.userService.getAppParam('airtimeLimit').subscribe({
          next: (paramData) => {
            const airtimeLimit = parseFloat(paramData.value);
            this.userInfo.availableAirtime = airtimeLimit - closingBalance;
          },
          error: (err) => {
            console.error('❌ Error fetching airtimeLimit:', err);
          }
        });
      };
    }
  }

  logout() {
    this.userService.logout();
    this.router.navigate(['/login']);
  }

  ngOnDestroy(): void {
    this.refreshSub?.unsubscribe();
  }
}
