import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../header/header.component';
import { PurchaseService } from '../../services/purchase.service';
import { ToastrService } from 'ngx-toastr';
import { UserService } from '../../services/user.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-airtime',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  templateUrl: './airtime.component.html',
  styleUrls: ['./airtime.component.scss']
})
export class AirtimeComponent implements OnInit {
  airtimeProducts: any[] = [];
  selectedAirtimeProduct: any;
  airtimeMobileNumber = '';
  airtimeInputValue = 0;
  buttonDisabled = false;
  availableAirtimeLimit: number = 0;
  mobileNumbers: string[] = [];
  newMobile = '';
  employeeNumber = '';
  isLoading = false;


  constructor(
    private purchaseService: PurchaseService,
    private userService: UserService,
    private toastr: ToastrService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.fetchAirtimeProducts();

    this.employeeNumber = localStorage.getItem('employeeNumber') || '';
    if (!this.employeeNumber) return;

    this.userService.getUserProfile(this.employeeNumber).subscribe({
      next: (user) => {
        this.mobileNumbers = user.mobileNumbers || [];
      },
      error: () => this.toastr.error('Failed to load mobile numbers', 'Error'),
    });

    let closingBalance = 0;

    const fetchAirtimeLimit = () => {
      this.userService.getAppParam('airtimeLimit').subscribe({
        next: (paramData) => {
          const airtimeLimit = parseFloat(paramData.value);
          this.availableAirtimeLimit = airtimeLimit - closingBalance;
        },
        error: (err) => console.error('Error fetching airtimeLimit:', err)
      });
    };

    this.userService.getUserBalance(this.employeeNumber).subscribe({
      next: (balanceData) => {
        closingBalance = (balanceData?.closingBalance ?? 0) * 0.01;
        fetchAirtimeLimit();
      },
      error: (err) => {
        console.error('Error fetching user balance, defaulting to 0:', err);
        fetchAirtimeLimit();
      }
    });
  }

  fetchAirtimeProducts(): void {
    this.purchaseService.getAirtimeProducts().subscribe(response => {
      console.log('response :>> ', response);
      if (response.success && response.product_list.length > 0) {
        this.airtimeProducts = response.product_list;
        this.selectedAirtimeProduct = this.airtimeProducts[0];
      }
    });
  }

  purchaseAirtime(): void {
    if (!this.selectedAirtimeProduct || !this.airtimeMobileNumber || !this.airtimeInputValue) {
      this.toastr.warning('Please complete all fields.', 'Missing Info');
      return;
    }
  
    this.buttonDisabled = true;
    this.isLoading = true;
  
    const amountInCents = this.airtimeInputValue * 100;
  
    this.purchaseService.purchaseAirtime(
      this.selectedAirtimeProduct.product_code,
      this.airtimeMobileNumber,
      amountInCents
    ).subscribe({
      next: (response) => {
        console.log('✅ Airtime purchase response:', response);
        if (response && response.reference) {
          this.toastr.success('Airtime purchase successful.', 'Success');
          setTimeout(() => window.location.reload(), 500);
        } else {
          this.toastr.error('Purchase went through but no reference received.', 'Missing Reference');
        }
      },
      error: (error) => {
        this.toastr.error('Airtime purchase failed. Please try again.', 'Error');
        console.error('❌ Airtime purchase failed:', error);
      },
      complete: () => {
        this.buttonDisabled = false;
        this.isLoading = false;
      }
    });
  }
  

  saveMobiles(): void {
    this.userService.updateMobileNumbers(this.employeeNumber, this.mobileNumbers).subscribe({
      next: () => this.toastr.success('Mobile numbers updated', 'Success'),
      error: () => this.toastr.error('Failed to update mobile numbers', 'Error'),
    });
  }

  addMobile(): void {
    if (this.newMobile && !this.mobileNumbers.includes(this.newMobile)) {
      this.mobileNumbers.push(this.newMobile);
      this.saveMobiles();
      this.newMobile = '';
    }
  }

  selectMobile(mobile: string): void {
    this.airtimeMobileNumber = mobile;
    this.toastr.success('Mobile selected!', 'Selected');
  }

  deleteMobile(mobile: string): void {
    this.userService.deleteMobileNumber(this.employeeNumber, mobile).subscribe({
      next: () => {
        this.toastr.success('Mobile number deleted', 'Success');
        this.mobileNumbers = this.mobileNumbers.filter((m) => m !== mobile);
      },
      error: () => {
        this.toastr.error('Failed to delete mobile number', 'Error');
      }
    });
  }
  

  goHome(): void {
    this.router.navigate(['/home']);
  }
}
