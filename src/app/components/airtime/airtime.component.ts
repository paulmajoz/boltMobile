import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

import { HeaderComponent } from '../header/header.component';
import { PurchaseService } from '../../services/purchase.service';
import { UserService } from '../../services/user.service';
import { HeaderRefreshService } from '../../services/header-refresh.service';

interface AirtimeProduct {
  product_code: string;
  product_description: string;
  product_value: string;
}

@Component({
  selector: 'app-airtime',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, HeaderComponent],
  templateUrl: './airtime.component.html',
  styleUrls: ['./airtime.component.scss']
})
export class AirtimeComponent implements OnInit {
  airtimeForm!: FormGroup;
  airtimeProducts: AirtimeProduct[] = [];
  mobileNumbers: string[] = [];
  newMobile = '';
  availableAirtimeLimit = 0;
  employeeNumber = '';
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private purchaseService: PurchaseService,
    private userService: UserService,
    private toastr: ToastrService,
    private router: Router,
    private headerRefreshService: HeaderRefreshService
  ) {}

  ngOnInit(): void {
    this.employeeNumber = localStorage.getItem('employeeNumber') || '';
    if (!this.employeeNumber) return;

    this.initForm();
    this.loadData();
  }

  private initForm(): void {
    this.airtimeForm = this.fb.group({
      airtimeProduct: [null, Validators.required],
      airtimeMobileNumber: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      airtimeAmount: [null, [Validators.required, Validators.min(2)]]
    });
  }

  private loadData(): void {
    this.fetchAirtimeProducts();
    this.loadMobileNumbers();
    this.calculateAvailableLimit();
  }

  private fetchAirtimeProducts(): void {
    this.purchaseService.getAirtimeProducts().subscribe({
      next: (response) => {
        if (response.success && response.product_list.length > 0) {
          this.airtimeProducts = response.product_list;
          this.airtimeForm.patchValue({ airtimeProduct: this.airtimeProducts[0] });
        }
      },
      error: () => this.toastr.error('Failed to load airtime products', 'Error')
    });
  }

  private loadMobileNumbers(): void {
    this.userService.getUserProfile(this.employeeNumber).subscribe({
      next: (user) => {
        this.mobileNumbers = user.mobileNumbers || [];
      },
      error: () => this.toastr.error('Failed to load mobile numbers', 'Error')
    });
  }

  private calculateAvailableLimit(): void {
    let closingBalance = 0;

    const fetchLimit = () => {
      this.userService.getAppParam('airtimeLimit').subscribe({
        next: (paramData) => {
          const airtimeLimit = parseFloat(paramData.value);
          this.availableAirtimeLimit = airtimeLimit - closingBalance;
        },
        error: () => console.error('Failed to fetch airtimeLimit')
      });
    };

    this.userService.getUserBalance(this.employeeNumber).subscribe({
      next: (balanceData) => {
        closingBalance = (balanceData?.closingBalance ?? 0) * 0.01;
        fetchLimit();
      },
      error: () => {
        console.error('Failed to fetch user balance, defaulting to 0');
        fetchLimit();
      }
    });
  }

  get isAmountExceedingLimit(): boolean {
    const amount = this.airtimeForm.get('airtimeAmount')?.value;
    return amount && amount > this.availableAirtimeLimit;
  }

  addMobile(): void {
    if (this.newMobile && !this.mobileNumbers.includes(this.newMobile)) {
      this.mobileNumbers.push(this.newMobile);
      this.saveMobiles();
      this.newMobile = '';
    }
  }

  private saveMobiles(): void {
    this.userService.updateMobileNumbers(this.employeeNumber, this.mobileNumbers).subscribe({
      next: () => this.toastr.success('Mobile numbers updated', 'Success'),
      error: () => this.toastr.error('Failed to update mobile numbers', 'Error')
    });
  }

  selectMobile(mobile: string): void {
    this.airtimeForm.patchValue({ airtimeMobileNumber: mobile });
    this.toastr.success('Mobile selected!', 'Selected');
  }

  deleteMobile(mobile: string): void {
    this.userService.deleteMobileNumber(this.employeeNumber, mobile).subscribe({
      next: () => {
        this.mobileNumbers = this.mobileNumbers.filter((m) => m !== mobile);
        this.toastr.success('Mobile number deleted', 'Success');
      },
      error: () => this.toastr.error('Failed to delete mobile number', 'Error')
    });
  }

  goHome(): void {
    this.router.navigate(['/home']);
  }

  purchaseAirtime(): void {
    this.airtimeForm.disable();
    this.calculateAvailableLimit();

    if (this.airtimeForm.invalid) {
      this.airtimeForm.markAllAsTouched();
      this.toastr.warning('Please correct the form before submitting.', 'Invalid Input');
      this.airtimeForm.enable();
      return;
    }

    const { airtimeProduct, airtimeMobileNumber, airtimeAmount } = this.airtimeForm.value;
    const amountInCents = airtimeAmount * 100;
    this.isLoading = true;

    this.purchaseService.purchaseAirtime(
      airtimeProduct.product_code,
      airtimeMobileNumber,
      amountInCents
    ).subscribe({
      next: (response) => {
        if (response?.data.success) {
          this.toastr.success('Airtime purchase successful.', 'Success');
          this.headerRefreshService.triggerRefresh();
          this.airtimeForm.reset();
          this.fetchAirtimeProducts();
          this.calculateAvailableLimit();
        }
        if(!response?.data.success){
          this.toastr.error( response.data.provider_response.response_message, 'Error')
        }
      },
      error: () => this.toastr.error('Airtime purchase failed. Please try again.', 'Error'),
      complete: () => {
        this.airtimeForm.enable();
        this.isLoading = false;
      }
    });
  }
}
