import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  userInfo: any = {};

  constructor(private apiService: ApiService) {}

ngOnInit() {
  this.apiService.getUserInfo().subscribe({
    next: (user) => {
      this.userInfo = user;

      // 🔁 Now get live balance using the username
      this.apiService.getUserBalance(user.username).subscribe({
        next: (balanceData) => {
          console.log('✅ Balance response:', balanceData); // ✅ LOG IT
          this.userInfo.balance = balanceData.closingBalance;
        },
        error: (err) => {
          console.error('❌ Error fetching balance:', err);
        }
      });
      
    },
    error: (error) => {
      console.error('Error fetching user info:', error);
    }
  });
}

}