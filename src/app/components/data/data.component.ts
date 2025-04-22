import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../header/header.component';
import { PurchaseService } from '../../services/purchase.service';
import { ToastrService } from 'ngx-toastr';

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

  constructor(
    private purchaseService: PurchaseService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.fetchDataProducts();
  }

  fetchDataProducts(): void {
    this.purchaseService.getDataProducts().subscribe(response => {
      if (response.success && response.product_list.length > 0) {
        this.dataProducts = response.product_list;
        this.selectedDataProduct = this.dataProducts[0];
        this.dataInputValue = this.dataProducts[0].product_value; // ✅ Auto-set amount
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
      this.dataInputValue = this.selectedDataProduct.product_value; // ✅ Update amount on change
    }
  }

  purchaseData(): void {
    if (!this.selectedDataProduct || !this.dataMobileNumber || !this.dataInputValue) {
      this.toastr.warning('Please enter all fields to proceed.', 'Incomplete Form');
      return;
    }

    this.purchaseService.purchaseData(
      this.selectedDataProduct.product_code,
      this.dataMobileNumber,
      this.dataInputValue*100
    ).subscribe({
      next: (response) => {
        this.toastr.success('Data purchase successful!', 'Success');
        console.log('✅ Data purchase successful:', response);
      },
      error: (error) => {
        this.toastr.error('Data purchase failed. Please try again.', 'Error');
        console.error('❌ Data purchase failed:', error);
      }
    });
  }
}
