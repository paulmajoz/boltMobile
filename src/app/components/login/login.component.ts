import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { UserService } from '../../services/user.service';
import { Location } from '@angular/common';

interface LoginCredentials {
  employeeNumber: string;
  nationalId: string;
  userhash: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  employeeNumber = '';
  nationalId = '';
  errorMessage = '';
  private userhash = '';

  constructor(
    private readonly apiService: ApiService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly userService: UserService,
    private location: Location
  ) {}

  ngOnInit(): void {
    const fullUrl = this.location.path(true);
  
    // Check if there's a ? in the URL
    if (fullUrl.includes('?')) {
      const rawQuery = fullUrl.split('?')[1]; // Get everything after the ?
  
      // Optionally: log the rawQuery for debugging
      console.log('Raw Query String:', rawQuery);
  
      // Redirect to fire-emergency and pass the raw query string (optional)
      this.router.navigate(['/fire-emergency'], { queryParams: { raw: rawQuery } });
      return;
    }
  
    // fallback: check for # in URL
    const hash = fullUrl.split('#')[1];
    if (hash) {
      this.userhash = hash;
    }
  }
  
  

  onSubmit(): void {
    const credentials: LoginCredentials = {
      employeeNumber: this.employeeNumber,
      nationalId: this.nationalId,
      userhash: this.userhash
    };

    this.apiService.login(credentials).subscribe({
      next: () => {
        this.userService.setUser(this.employeeNumber);
        this.router.navigate(['/home']);
      },
      error: () => {
        this.errorMessage = 'Login failed. Check your employee number or national ID.';
      }
    });
  }
}