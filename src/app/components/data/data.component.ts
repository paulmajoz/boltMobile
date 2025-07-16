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

interface DataProduct {
  product_code: string;
  product_description: string;
  product_value: string;
}

@Component({
  selector: 'app-data',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, HeaderComponent],
  templateUrl: './data.component.html',
  styleUrls: ['./data.component.scss']
})
export class DataComponent implements OnInit {
  dataForm!: FormGroup;
  dataProducts: DataProduct[] = [];
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
    this.dataForm = this.fb.group({
      dataProduct: [null, Validators.required],
      dataMobileNumber: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      dataAmount: [{ value: null, disabled: true }, [Validators.required, Validators.min(2)]]
    });
  }

  private loadData(): void {
    this.fetchDataProducts();
    this.loadMobileNumbers();
    this.calculateAvailableLimit();
  }

  private fetchDataProducts(): void {
    this.purchaseService.getDataProducts().subscribe({
      next: (response) => {
        if (response.success && response.product_list.length > 0) {
          this.dataProducts = response.product_list;
          const firstProduct = this.dataProducts[0];
          this.dataForm.patchValue({
            dataProduct: firstProduct,
            dataAmount: firstProduct.product_value
          });
        }
      },
      error: () => this.toastr.error('Failed to load data products', 'Error')
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

/** True when the form amount is above the current limit */
get isAmountExceedingLimit(): boolean {
  const amount = Number(this.dataForm.get('dataAmount')?.value);
  return !isNaN(amount) && amount > this.availableAirtimeLimit;
}


  onProductChange(): void {
    const selected = this.dataForm.get('dataProduct')?.value;
    if (selected) {
      this.dataForm.patchValue({ dataAmount: selected.product_value });
    }
  }

  purchaseData(): void {
    // quick check before anything else
    if (this.isAmountExceedingLimit) {
      this.toastr.error('Amount exceeds your available limit', 'Insufficient funds');
      return;
    }
  
    this.dataForm.disable();
    // no need to call calculateAvailableLimit() here – it updates asynchronously
    // and you just passed the guard using the latest cached value.
  
    if (this.dataForm.invalid) {
      this.dataForm.markAllAsTouched();
      this.toastr.warning('Please correct the form before submitting.', 'Invalid Input');
      this.dataForm.enable();
      return;
    }
  
    const { dataProduct, dataMobileNumber, dataAmount } = this.dataForm.value;
    const amountInCents = Number(dataAmount) * 100;   // ensure number
  
    this.isLoading = true;
  
    this.purchaseService
        .purchaseData(dataProduct.product_code, dataMobileNumber, amountInCents)
        .subscribe({
          next: (res) => {
            if (res?.data.success) {
              this.toastr.success('Data purchase successful.', 'Success');
              this.headerRefreshService.triggerRefresh();
              this.dataForm.reset();
              this.fetchDataProducts();
              this.calculateAvailableLimit();
            } else {
              this.toastr.error(res?.data?.provider_response?.response_message ?? 'Unknown error', 'Error');
            }
          },
          error: () => this.toastr.error('Data purchase failed. Please try again.', 'Error'),
          complete: () => {
            this.dataForm.enable();
            this.isLoading = false;
          }
        });
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
    this.dataForm.patchValue({ dataMobileNumber: mobile });
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
}
