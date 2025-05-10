import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  userInfo: any = {};

  constructor(
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit() {
    const employeeNumber = this.userService.getUser();
    if (employeeNumber) {
      this.userInfo.employeeNumber = employeeNumber;

      let closingBalance = 0; // ✅ Default to 0

      this.userService.getUserBalance().subscribe({
        next: (balanceData) => {
          closingBalance = (balanceData?.closingBalance ?? 0) * 0.01;
          this.userInfo.amountDue = closingBalance * (1 + 0.1 * 1.15);
          fetchAirtimeLimit(); // proceed once balance is retrieved
        },
        error: (err) => {
          console.error('❌ Error fetching balance, defaulting to 0:', err);
          closingBalance = 0;
          this.userInfo.amountDue = 0;
          fetchAirtimeLimit(); // still proceed with airtimeLimit call
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
}
