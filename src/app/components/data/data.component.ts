import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../header/header.component';
import { PurchaseService } from '../../services/purchase.service';
import { ToastrService } from 'ngx-toastr';
import { UserService } from '../../services/user.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-data',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  templateUrl: './data.component.html',
  styleUrls: ['./data.component.scss']
})
export class DataComponent implements OnInit {
  dataProducts: any[] = [];
  selectedDataProduct: any;
  dataMobileNumber = '';
  dataInputValue = 0;
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
    this.fetchDataProducts();

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

  fetchDataProducts(): void {
    this.purchaseService.getDataProducts().subscribe(response => {
      if (response.success && response.product_list.length > 0) {
        this.dataProducts = response.product_list;
        this.selectedDataProduct = this.dataProducts[0];
        this.dataInputValue = this.dataProducts[0].product_value;
      } else {
        this.toastr.warning('No data products available.', 'Warning');
      }
    }, error => {
      this.toastr.error('Failed to load data products.', 'Error');
      console.error('❌ Error fetching data products:', error);
    });
  }

  onProductChange(): void {
    if (this.selectedDataProduct) {
      this.dataInputValue = this.selectedDataProduct.product_value;
    }
  }

  purchaseData(): void {
    if (!this.selectedDataProduct || !this.dataMobileNumber || !this.dataInputValue) {
      this.toastr.warning('Please enter all fields to proceed.', 'Incomplete Form');
      return;
    }
  
    this.isLoading = true;
  
    this.purchaseService.purchaseData(
      this.selectedDataProduct.product_code,
      this.dataMobileNumber,
      this.dataInputValue * 100
    ).subscribe({
      next: (response) => {
        this.toastr.success('Data purchase successful!', 'Success');
        console.log('✅ Data purchase successful:', response);
      },
      error: (error) => {
        this.toastr.error('Data purchase failed. Please try again.', 'Error');
        console.error('❌ Data purchase failed:', error);
      },
      complete: () => {
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
    this.dataMobileNumber = mobile;
    this.toastr.success('Mobile selected!', 'Selected');
  }

  deleteMobile(mobile: string): void {
    this.userService.deleteMobileNumber(this.employeeNumber, mobile).subscribe({
      next: () => {
        this.toastr.success('Mobile number deleted', 'Success');
        this.mobileNumbers = this.mobileNumbers.filter(m => m !== mobile);
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
