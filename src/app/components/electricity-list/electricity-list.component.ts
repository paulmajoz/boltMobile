import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header.component';
import { UserService } from '../../services/user.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-electricity-list',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './electricity-list.component.html'
})
export class ElectricityListComponent implements OnInit {
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
        console.log('transactions :>> ', transactions);
      },
      error: () => {
        // Optional: Toastr or error notification
      }
    });
  }

  goHome(): void {
    this.router.navigate(['/home']);
  }
}
