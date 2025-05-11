import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HeaderComponent } from '../header/header.component';
import { PurchaseService } from '../../services/purchase.service';
import { ToastrService } from 'ngx-toastr';
import { UserService } from '../../services/user.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-electricity',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HeaderComponent],
  templateUrl: './electricity.component.html',
  styleUrls: ['./electricity.component.scss']
})
export class ElectricityComponent implements OnInit {
  electricityForm!: FormGroup;
  electricityProducts: any[] = [];
  token: string | null = null;
  availableAirtimeLimit = 0;
  employeeNumber = '';
  electricityMeters: string[] = [];
  newMeter = '';
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private readonly purchaseService: PurchaseService,
    private readonly userService: UserService,
    private readonly toastr: ToastrService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.employeeNumber = localStorage.getItem('employeeNumber') || '';
    if (!this.employeeNumber) return;

    this.electricityForm = this.fb.group({
      selectedElectricityProduct: [null, Validators.required],
      meterNumber: ['', [Validators.required]],
      amountInRands: [null, [Validators.required, Validators.min(2)]],
      customReference: ['']
    });

    this.loadProfileData();
    this.fetchElectricityProducts();
    this.calculateAvailableLimit();
  }

  fetchElectricityProducts(): void {
    this.purchaseService.getAirtimeProducts().subscribe({
      next: (response) => {
        if (response.success && response.product_list.length > 0) {
          this.electricityProducts = response.product_list;
          this.electricityForm.patchValue({ selectedElectricityProduct: response.product_list[0] });
        }
      },
      error: () => this.toastr.error('Failed to load electricity products', 'Error')
    });
  }

  async purchaseElectricity(): Promise<void> {
    if (this.electricityForm.invalid) {
      this.electricityForm.markAllAsTouched();
      this.toastr.warning('Please correct the form before submitting.', 'Invalid Input');
      return;
    }

    const { selectedElectricityProduct, meterNumber, amountInRands, customReference } = this.electricityForm.value;

    this.isLoading = true;
    try {
      const result = await this.purchaseService.purchaseElectricity(
        meterNumber,
        amountInRands * 100,
        customReference
      );

      const token = result?.transactionResponse?.data?.elec_data?.std_tokens?.[0]?.code;
      this.token = token || null;

      if (token) {
        this.toastr.success('Electricity purchase and confirmation successful!', 'Success');
        this.toastr.success('Token received!', 'Token Ready');
      } else {
        this.toastr.warning('No token received in response.', 'Missing Token');
      }
    } catch {
      this.toastr.error('Electricity purchase failed. Please try again.', 'Error');
    } finally {
      this.isLoading = false;
    }
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

  loadProfileData(): void {
    this.userService.getUserProfile(this.employeeNumber).subscribe({
      next: (user) => {
        this.electricityMeters = user.electricityMeters || [];
      },
      error: () => this.toastr.error('Failed to load profile data', 'Error')
    });
  }

  addMeter(): void {
    if (this.newMeter && !this.electricityMeters.includes(this.newMeter)) {
      this.electricityMeters.push(this.newMeter);
      this.saveMeters();
      this.newMeter = '';
    }
  }

  saveMeters(): void {
    this.userService.updateElectricityMeters(this.employeeNumber, this.electricityMeters).subscribe({
      next: () => this.toastr.success('Meter numbers updated', 'Success'),
      error: () => this.toastr.error('Failed to update meter numbers', 'Error'),
    });
  }

  selectMeter(meter: string): void {
    this.electricityForm.patchValue({ meterNumber: meter });
    this.toastr.success('Meter selected!', 'Selected');
  }

  deleteMeter(meter: string): void {
    this.userService.deleteElectricityMeter(this.employeeNumber, meter).subscribe({
      next: () => {
        this.electricityMeters = this.electricityMeters.filter((m) => m !== meter);
        this.toastr.success('Meter deleted', 'Success');
      },
      error: () => this.toastr.error('Failed to delete meter', 'Error')
    });
  }

  copyTokenToClipboard(): void {
    if (this.token) {
      navigator.clipboard.writeText(this.token).then(() => {
        this.toastr.success('Token copied to clipboard!', 'Copied');
      });
    }
  }

  goHome(): void {
    this.router.navigate(['/home']);
  }
}
