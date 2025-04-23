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

      this.userService.getUserBalance().subscribe({
        next: (balanceData) => {
          console.log('✅ Balance response:', balanceData);
          this.userInfo.balance = balanceData.closingBalance * 0.01;
        },
        error: (err) => {
          console.error('❌ Error fetching balance:', err);
        }
      });
    }
  }

  logout() {
    this.userService.logout();
    this.router.navigate(['/login']);
  }
}
