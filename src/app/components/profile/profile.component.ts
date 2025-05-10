import { Component, OnInit } from '@angular/core';

import { ToastrService } from 'ngx-toastr';
import { UserService } from '../../services/user.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../header/header.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  imports: [CommonModule,FormsModule,HeaderComponent],
  standalone: true,
  templateUrl: './profile.component.html',
})
export class ProfileComponent implements OnInit {
  employeeNumber = '';
  mobileNumbers: string[] = [];
  electricityMeters: string[] = [];
  newMobile = '';
  newMeter = '';

  constructor(
    private userService: UserService,
    private toastr: ToastrService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const user = this.userService.getUser();
if (!user) {
  this.toastr.error('No employee number found. Please log in again.');
  return;
}
this.employeeNumber = user;

    this.loadProfileData();
  }
  

  loadProfileData(): void {
    this.userService.getUserProfile(this.employeeNumber).subscribe({
      next: (user) => {
        console.log('user :>> ', user);
        this.mobileNumbers = user.mobileNumbers || [];
        this.electricityMeters = user.electricityMeters || [];
      },
      error: () => this.toastr.error('Failed to load profile data', 'Error'),
    });

  }

  addMobile(): void {
    if (this.newMobile && !this.mobileNumbers.includes(this.newMobile)) {
      this.mobileNumbers.push(this.newMobile);
      this.saveMobiles();
      this.newMobile = '';
    }
  }

  addMeter(): void {
    if (this.newMeter && !this.electricityMeters.includes(this.newMeter)) {
      this.electricityMeters.push(this.newMeter);
      this.saveMeters();
      this.newMeter = '';
    }
  }

  saveMobiles(): void {
    this.userService.updateMobileNumbers(this.employeeNumber, this.mobileNumbers).subscribe({
      next: () => this.toastr.success('Mobile numbers updated', 'Success'),
      error: () => this.toastr.error('Failed to update mobile numbers', 'Error'),
    });
  }

  saveMeters(): void {
    this.userService.updateElectricityMeters(this.employeeNumber, this.electricityMeters).subscribe({
      next: () => this.toastr.success('Meter numbers updated', 'Success'),
      error: () => this.toastr.error('Failed to update meter numbers', 'Error'),
    });
  }

  copyToClipboard(value: string): void {
    navigator.clipboard.writeText(value).then(() => {
      this.toastr.success('Copied to clipboard', 'Copied');
    });
  }

  goHome(): void {
    this.router.navigate(['/home']);
  }
  
}
