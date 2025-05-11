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
    const hash = fullUrl.split('#')[1];
    if (hash) {
      this.userhash = hash;
    } else {
      // this.router.navigate(['/unauthorized']); // optional
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