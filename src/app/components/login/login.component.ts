import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  email: string = '';
  password: string = '';

  constructor(private apiService: ApiService, private router: Router) {}

  onSubmit() {
    this.apiService.login({ email: this.email, password: this.password })
      .subscribe({
        next: (response) => {
          // Handle successful login
          this.router.navigate(['/home']);
        },
        error: (error) => {
          this.router.navigate(['/home']);
          console.error('Login failed:', error);
        }
      });
  }
}