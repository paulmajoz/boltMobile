import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../header/header.component';
import { PurchaseService } from '../../services/purchase.service';
import { ToastrService } from 'ngx-toastr';

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

  constructor(
    private purchaseService: PurchaseService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.fetchElectricityProducts();
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

    try {
      const result = await this.purchaseService.purchaseElectricity(
        this.meterNumber,
        this.amountInRands*100,
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
    }
  }

  copyTokenToClipboard(): void {
    if (this.token) {
      navigator.clipboard.writeText(this.token).then(() => {
        this.toastr.success('Token copied to clipboard!', 'Copied');
      });
    }
  }
}
