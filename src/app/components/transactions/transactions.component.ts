import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header.component';
import { PurchaseService } from '../../services/purchase.service';
import { UserService } from '../../services/user.service';
import { Router } from '@angular/router'; // ✅ Added

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './transactions.component.html', // ✅ use templateUrl instead of inline template
})

export class TransactionsComponent implements OnInit {
  transactions: any[] = [];

  constructor(
    private userService: UserService,
    private router: Router // ✅ Added
  ) {}

  ngOnInit(): void {
    const employeeNumber = this.userService.getUser();
    this.userService.getTransactionsByEmployee(employeeNumber).subscribe({
      next: (transactions) => {
        console.log('✅ Transactions:', transactions);
        this.transactions = transactions;
      },
      error: (err) => {
        console.error('❌ Failed to fetch transactions:', err);
      }
    });
  }

  goHome(): void {
    this.router.navigate(['/home']);
  }
}
