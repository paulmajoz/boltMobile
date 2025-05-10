import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header.component';
import { UserService } from '../../services/user.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './transactions.component.html'
})
export class TransactionsComponent implements OnInit {
  transactions: any[] = [];

  constructor(
    private readonly userService: UserService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    const employeeNumber = this.userService.getUser();

    if (!employeeNumber) {
      this.router.navigate(['/login']);
      return;
    }

    this.userService.getTransactionsByEmployee(employeeNumber).subscribe({
      next: (transactions) => {
        this.transactions = transactions;
      },
      error: () => {
        // Could add Toastr here if desired
      }
    });
  }

  goHome(): void {
    this.router.navigate(['/home']);
  }
}
