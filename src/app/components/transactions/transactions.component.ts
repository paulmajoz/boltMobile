import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header.component';
import { PurchaseService } from '../../services/purchase.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  template: `
    <div class="min-h-screen bg-gray-50">
      <app-header></app-header>
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 class="text-2xl font-bold text-gray-900">Transactions</h2>
        <div *ngIf="transactions.length; else noData">
          <table class="min-w-full divide-y divide-gray-200 mt-6">
            <thead class="bg-gray-100">
              <tr>
                <th class="text-left px-4 py-2">Product Code</th>
                <th class="text-left px-4 py-2">Amount</th>
                <th class="text-left px-4 py-2">Mobile/Meter</th>
                <th class="text-left px-4 py-2">Reference</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr *ngFor="let txn of transactions">
                <td class="px-4 py-2">{{ txn.productCode }}</td>
                <td class="px-4 py-2">R{{ txn.amount / 100 | number:'1.2-2' }}</td>
                <td class="px-4 py-2">{{ txn.mobileNumber }}</td>
                <td class="px-4 py-2">{{ txn.reference || '-' }}</td>
                <td class="px-4 py-2">
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <ng-template #noData>
          <p class="mt-4 text-gray-600">No transactions found.</p>
        </ng-template>
      </main>
    </div>
  `
})
export class TransactionsComponent implements OnInit {
  transactions: any[] = [];

  constructor(
    private userService: UserService
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
}
