import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  template: `
    <div class="min-h-screen bg-gray-50">
      <app-header></app-header>
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 class="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p class="mt-4">Dashboard content goes here</p>

        <section class="mt-12">
          <h3 class="text-xl font-semibold mb-4">🎮 Play 2048</h3>
          <div class="grid grid-cols-4 gap-4 max-w-xs">
            <div
              *ngFor="let row of board"
              class="contents"
            >
              <div
                *ngFor="let cell of row"
                class="w-20 h-20 bg-gray-200 text-center flex items-center justify-center font-bold text-xl rounded"
                [ngClass]="{
                  'bg-yellow-200': cell === 2,
                  'bg-yellow-300': cell === 4,
                  'bg-yellow-400': cell === 8,
                  'bg-orange-400': cell === 16,
                  'bg-orange-500': cell === 32,
                  'bg-orange-600': cell === 64,
                  'bg-red-400': cell >= 128
                }"
              >
                {{ cell || '' }}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  board: number[][] = [];

  ngOnInit(): void {
    this.resetBoard();
    this.addRandomTile();
    this.addRandomTile();

    window.addEventListener('keydown', this.handleKey.bind(this));
  }

  resetBoard() {
    this.board = Array(4)
      .fill(null)
      .map(() => Array(4).fill(0));
  }

  handleKey(event: KeyboardEvent) {
    const key = event.key;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
      // Future: Add full movement logic here
      this.addRandomTile();
    }
  }

  addRandomTile() {
    const empty: [number, number][] = [];
    for (let i = 0; i < 4; i++)
      for (let j = 0; j < 4; j++)
        if (!this.board[i][j]) empty.push([i, j]);

    if (empty.length) {
      const [i, j] = empty[Math.floor(Math.random() * empty.length)];
      this.board[i][j] = Math.random() < 0.9 ? 2 : 4;
    }
  }
}
