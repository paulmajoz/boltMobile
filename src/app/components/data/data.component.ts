import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../header/header.component';
import { PurchaseService } from '../../services/purchase.service';
import { ToastrService } from 'ngx-toastr';
import { UserService } from '../../services/user.service';
import { Router } from '@angular/router';
import { HeaderRefreshService } from '../../services/header-refresh.service'; // ✅ Import

@Component({
  selector: 'app-data',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, HeaderComponent],
  templateUrl: './data.component.html',
  styleUrls: ['./data.component.scss']
})
export class DataComponent implements OnInit {
  dataForm!: FormGroup;
  dataProducts: any[] = [];
  mobileNumbers: string[] = [];
  newMobile = '';
  employeeNumber = '';
  availableAirtimeLimit = 0;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private purchaseService: PurchaseService,
    private userService: UserService,
    private toastr: ToastrService,
    private router: Router,
    private headerRefreshService: HeaderRefreshService // ✅ Inject
  ) {}

  ngOnInit(): void {
    this.employeeNumber = localStorage.getItem('employeeNumber') || '';
    if (!this.employeeNumber) return;

    this.dataForm = this.fb.group({
      dataProduct: [null, Validators.required],
      dataMobileNumber: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      dataAmount: [null, [Validators.required, Validators.min(1)]]
    });

    this.fetchDataProducts();
    this.loadMobileNumbers();
    this.calculateAvailableLimit();
  }

  fetchDataProducts(): void {
    this.purchaseService.getDataProducts().subscribe({
      next: (response) => {
        if (response.success && response.product_list.length > 0) {
          this.dataProducts = response.product_list;
          this.dataForm.patchValue({
            dataProduct: this.dataProducts[0],
            dataAmount: this.dataProducts[0].product_value
          });
        } else {
          this.toastr.warning('No data products available.', 'Warning');
        }
      },
      error: () => {
        this.toastr.error('Failed to load data products.', 'Error');
      }
    });
  }

  loadMobileNumbers(): void {
    this.userService.getUserProfile(this.employeeNumber).subscribe({
      next: (user) => {
        this.mobileNumbers = user.mobileNumbers || [];
      },
      error: () => this.toastr.error('Failed to load mobile numbers', 'Error')
    });
  }

  calculateAvailableLimit(): void {
    let closingBalance = 0;
    const fetchLimit = () => {
      this.userService.getAppParam('airtimeLimit').subscribe({
        next: (paramData) => {
          const airtimeLimit = parseFloat(paramData.value);
          this.availableAirtimeLimit = airtimeLimit - closingBalance;
        },
        error: () => console.error('Error fetching airtimeLimit')
      });
    };

    this.userService.getUserBalance(this.employeeNumber).subscribe({
      next: (balanceData) => {
        closingBalance = (balanceData?.closingBalance ?? 0) * 0.01;
        fetchLimit();
      },
      error: () => {
        console.error('Error fetching user balance, defaulting to 0');
        fetchLimit();
      }
    });
  }

  onProductChange(): void {
    const selected = this.dataForm.get('dataProduct')?.value;
    if (selected) {
      this.dataForm.patchValue({ dataAmount: selected.product_value });
    }
  }

  purchaseData(): void {
    if (this.dataForm.invalid) {
      this.dataForm.markAllAsTouched();
      this.toastr.warning('Please complete the form correctly.', 'Validation Error');
      return;
    }

    const { dataProduct, dataMobileNumber, dataAmount } = this.dataForm.value;
    const amountInCents = dataAmount * 100;

    this.isLoading = true;

    this.purchaseService.purchaseData(dataProduct.product_code, dataMobileNumber, amountInCents).subscribe({
      next: () => {
        this.toastr.success('Data purchase successful!', 'Success');
        this.headerRefreshService.triggerRefresh(); // ✅ Refresh header
        this.dataForm.reset();
        this.fetchDataProducts();
        this.calculateAvailableLimit();
      },
      error: () => {
        this.toastr.error('Data purchase failed. Please try again.', 'Error');
      },
      complete: () => {
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

  saveMobiles(): void {
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
        this.mobileNumbers = this.mobileNumbers.filter(m => m !== mobile);
        this.toastr.success('Mobile number deleted', 'Success');
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
