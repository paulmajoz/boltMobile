import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { UserService } from '../../services/user.service';

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
  private userhash = '123';

  constructor(
    private readonly apiService: ApiService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly userService: UserService
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      const hash = params.get('field1');
      if (hash) {
        this.userhash = hash;
      }
    });
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
