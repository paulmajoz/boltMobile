import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header.component';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  template: `
  
    <div class="min-h-screen bg-gray-50">
      <app-header></app-header>
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 class="text-2xl font-bold text-gray-900">Transactions</h2>
        <p class="mt-4">Transactions content goes here</p>
      </main>
    </div>
  `
})
export class TransactionsComponent {}