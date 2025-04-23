import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../header/header.component';
import { PurchaseService } from '../../services/purchase.service';
import { ToastrService } from 'ngx-toastr';

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
  buttonDisabled = false; // ✅ New flag

  constructor(
    private purchaseService: PurchaseService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.fetchAirtimeProducts();
  }

  fetchAirtimeProducts(): void {
    this.purchaseService.getAirtimeProducts().subscribe(response => {
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
    this.buttonDisabled = true; // ✅ Disable button
    setTimeout(() => (this.buttonDisabled = false), 10000); 
const amountInCents = this.airtimeInputValue * 100;

    this.purchaseService.purchaseAirtime(
      this.selectedAirtimeProduct.product_code,
      this.airtimeMobileNumber,
      this.airtimeInputValue* 100
    ).subscribe({
      next: (response) => {
        console.log('✅ Airtime purchase response:', response);
        if (response && response.reference) {
          this.toastr.success('Airtime purchase successful.', 'Success');
        } else {
          this.toastr.error('Purchase went through but no reference received.', 'Missing Reference');
        }
      },
      error: (error) => {
        this.toastr.error('Airtime purchase failed. Please try again.', 'Error');
        console.error('❌ Airtime purchase failed:', error);
      }
    });
  }
}
