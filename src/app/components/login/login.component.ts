import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  employeeNumber: string = '';
  nationalId: string = '';
  errorMessage: string = '';
  private userhash: string = '';

  constructor(
    private apiService: ApiService,
    private router: Router,
    private route: ActivatedRoute,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.userhash = '123';
    this.route.queryParamMap.subscribe(params => {
      const field1 = params.get('field1');
      if (field1) {
        this.userhash = field1;
        console.log('✅ userhash from query param:', this.userhash);
      } else {
        console.warn('❌ No userhash in query params');
      }
    });
  }
  
  onSubmit(): void {
    const credentials = {
      employeeNumber: this.employeeNumber,
      nationalId: this.nationalId,
      userhash: this.userhash 
    };
    console.log('credentials :>> ', credentials);
  
    this.apiService.login(credentials).subscribe({
      next: (response) => {
        this.userService.setUser(this.employeeNumber);
        console.log('✅ Login successful. Navigating to /home...',response);
        this.router.navigate(['/home'], { relativeTo: null });
      },
      error: (error) => {
        this.errorMessage = 'Login failed. Check your employee number or nationalId.';
        console.error('❌ Login failed:', error);
      }
    });
  }
  
}