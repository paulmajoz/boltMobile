import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../header/header.component';
import { PurchaseService } from '../../services/purchase.service';
import { ToastrService } from 'ngx-toastr';
import { UserService } from '../../services/user.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-electricity',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  templateUrl: './electricity.component.html',
  styleUrls: ['./electricity.component.scss']
})
export class ElectricityComponent implements OnInit {
  electricityProducts: any[] = [];
  selectedElectricityProduct = {
    product_type: 'electricity',
    product_list_hash: 'ae368a3d821db81dbd888b670f3d49a2e596715c13573',
    product_code: '44',
    product_description: 'Buy Electricity',
    product_category: 'Electricity',
    product_value: '0.0'
  };
  meterNumber = '';
  amountInRands = 0;
  customReference = '';
  token: string | null = null;
  availableAirtimeLimit: number = 0;
  employeeNumber = '';
  mobileNumbers: string[] = [];
  electricityMeters: string[] = [];
  newMobile = '';
  newMeter = '';
  isLoading = false;


  constructor(
    private purchaseService: PurchaseService,
    private userService: UserService,
    private toastr: ToastrService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const employeeNumber = localStorage.getItem('employeeNumber');
    if (!employeeNumber) return;
    this.employeeNumber = employeeNumber;

    this.loadProfileData();
    this.fetchElectricityProducts();

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

    this.userService.getUserBalance().subscribe({
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

  fetchElectricityProducts(): void {
    this.purchaseService.getAirtimeProducts().subscribe(response => {
      this.electricityProducts = response.product_list;
      this.selectedElectricityProduct = this.electricityProducts[0];
    });
  }

  async purchaseElectricity(): Promise<void> {
    if (!this.selectedElectricityProduct || !this.meterNumber || !this.amountInRands) {
      this.toastr.warning('Please fill in all required fields.', 'Incomplete Form');
      return;
    }
  
    this.isLoading = true;
  
    try {
      const result = await this.purchaseService.purchaseElectricity(
        this.meterNumber,
        this.amountInRands * 100,
        this.customReference
      );
  
      console.log('✅ Final Electricity Purchase Flow Result:', result);
      this.toastr.success('Electricity purchase and confirmation successful!', 'Success');
  
      const token = result?.transactionResponse?.data?.elec_data?.std_tokens?.[0]?.code;
  
      if (token) {
        this.token = token;
        console.log('token :>> ', token);
        this.toastr.success('Token received!', 'Token Ready');
      } else {
        this.token = null;
        this.toastr.warning('No token received in response.', 'Missing Token');
      }
    } catch (error) {
      console.error('❌ Electricity purchase failed:', error);
      this.toastr.error('Electricity purchase failed. Please try again.', 'Error');
    } finally {
      this.isLoading = false;
    }
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
    this.meterNumber = meter;
    this.toastr.success('Meter selected!', 'Selected');
  }

  deleteMeter(meter: string): void {
    this.userService.deleteElectricityMeter(this.employeeNumber, meter).subscribe({
      next: () => {
        this.toastr.success('Meter deleted', 'Success');
        this.electricityMeters = this.electricityMeters.filter((m) => m !== meter);
      },
      error: () => {
        this.toastr.error('Failed to delete meter', 'Error');
      }
    });
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
}
