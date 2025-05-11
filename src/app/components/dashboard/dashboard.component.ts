// 2048 Angular Game: Single Component Version with Keyboard + Swipe + Animations
import { Component, OnInit, Renderer2, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header.component';
import { Router } from '@angular/router';
import 'hammerjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  template: `
    <div class="min-h-screen bg-gray-50">
      <app-header></app-header>
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 class="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>
        <p class="mb-10">Welcome! Play 2048 below.</p>

        <section class="max-w-md mx-auto select-none">
          <div class="text-center text-lg font-medium mb-4">Score: {{ score }}</div>

          <div *ngIf="gameOver" class="text-center text-red-600 font-bold mb-4 text-xl">
            Game Over! Final Score: {{ score }}
          </div>

          <div
            class="grid grid-cols-4 gap-2 bg-gray-300 p-2 rounded-lg shadow-lg"
            (swipeleft)="onSwipe('ArrowLeft')"
            (swiperight)="onSwipe('ArrowRight')"
            (swipeup)="onSwipe('ArrowUp')"
            (swipedown)="onSwipe('ArrowDown')"
          >
            <ng-container *ngFor="let row of board">
              <ng-container *ngFor="let cell of row">
                <div
                  class="w-20 h-20 flex items-center justify-center font-bold text-xl rounded transition-all duration-300"
                  [ngClass]="tileClasses[cell]"
                >
                  {{ cell || '' }}
                </div>
              </ng-container>
            </ng-container>
          </div>

          <div class="flex justify-between mt-6">
            <button
              (click)="resetGame()"
              class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow"
            >
              Reset
            </button>
          </div>
        </section>

        <button
          (click)="goHome()"
          style="bottom: 1rem; left: 1rem;"
          class="fixed bg-green-600 hover:bg-green-700 text-white font-extrabold py-4 px-6 rounded-xl text-sm sm:text-2xl shadow-xl"
        >
          Home
        </button>
      </main>
    </div>
  `,
  styles: []
})
export class DashboardComponent implements OnInit {
  board: number[][] = [];
  score = 0;
  gameOver = false;

  tileClasses: { [key: number]: string } = {
    0: 'bg-gray-200',
    2: 'bg-yellow-100 text-gray-800',
    4: 'bg-yellow-200 text-gray-800',
    8: 'bg-orange-300 text-white',
    16: 'bg-orange-400 text-white',
    32: 'bg-orange-500 text-white',
    64: 'bg-orange-600 text-white',
    128: 'bg-red-400 text-white',
    256: 'bg-red-500 text-white',
    512: 'bg-red-600 text-white',
    1024: 'bg-green-500 text-white',
    2048: 'bg-green-600 text-white'
  };

  constructor(private renderer: Renderer2, private el: ElementRef, private router: Router) {}

  ngOnInit(): void {
    this.resetGame();
    this.renderer.listen('window', 'keydown', (event: KeyboardEvent) => this.onSwipe(event.key));
  }

  goHome(): void {
    this.router.navigate(['/home']);
  }

  resetGame(): void {
    this.board = this.createEmptyBoard();
    this.score = 0;
    this.gameOver = false;
    this.addRandomTile();
    this.addRandomTile();
  }

  createEmptyBoard(): number[][] {
    return Array(4).fill(0).map(() => Array(4).fill(0));
  }

  addRandomTile() {
    const emptyTiles: [number, number][] = [];
    this.board.forEach((row, i) => row.forEach((val, j) => val === 0 && emptyTiles.push([i, j])));
    if (emptyTiles.length) {
      const [x, y] = emptyTiles[Math.floor(Math.random() * emptyTiles.length)];
      this.board[x][y] = Math.random() < 0.9 ? 2 : 4;
    }
  }

  onSwipe(direction: string) {
    if (this.gameOver) return;
    const original = JSON.stringify(this.board);
    switch (direction) {
      case 'ArrowLeft': this.moveLeft(); break;
      case 'ArrowRight': this.moveRight(); break;
      case 'ArrowUp': this.moveUp(); break;
      case 'ArrowDown': this.moveDown(); break;
    }
    if (JSON.stringify(this.board) !== original) {
      this.addRandomTile();
      if (!this.movesAvailable()) {
        this.gameOver = true;
      }
    }
  }

  moveLeft() {
    this.board = this.board.map(row => this.mergeRow(row));
  }

  moveRight() {
    this.board = this.board.map(row => this.mergeRow(row.reverse()).reverse());
  }

  moveUp() {
    for (let col = 0; col < 4; col++) {
      const column = this.board.map(row => row[col]);
      const merged = this.mergeRow(column);
      this.board.forEach((row, i) => row[col] = merged[i]);
    }
  }

  moveDown() {
    for (let col = 0; col < 4; col++) {
      const column = this.board.map(row => row[col]).reverse();
      const merged = this.mergeRow(column);
      merged.reverse();
      this.board.forEach((row, i) => row[col] = merged[i]);
    }
  }

  mergeRow(row: number[]): number[] {
    const filtered = row.filter(v => v);
    for (let i = 0; i < filtered.length - 1; i++) {
      if (filtered[i] === filtered[i + 1]) {
        filtered[i] *= 2;
        this.score += filtered[i];
        filtered[i + 1] = 0;
      }
    }
    return filtered.filter(v => v).concat(Array(4 - filtered.filter(v => v).length).fill(0));
  }

  movesAvailable(): boolean {
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (this.board[i][j] === 0) return true;
        if (i < 3 && this.board[i][j] === this.board[i + 1][j]) return true;
        if (j < 3 && this.board[i][j] === this.board[i][j + 1]) return true;
      }
    }
    return false;
  }
}
