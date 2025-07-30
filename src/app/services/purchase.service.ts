import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../enviroments/enviroment';
import { UserService } from './user.service';

interface Product {
  product_type: string;
  product_code: string;
  product_description: string;
  product_category: string;
  product_value: string;
}

@Injectable({ providedIn: 'root' })
export class PurchaseService {
  private readonly nestApiUrl = environment._umsukaApi;

  constructor(private http: HttpClient, private userService: UserService) {}

  getAirtimeProducts(): Observable<{ success: boolean; product_list: Product[] }> {
    return this.http.post<{ success: boolean; product_list: Product[] }>(
      `https://my-imali-vas.appspot.com/vas/v1/products/airtime`,
      new URLSearchParams({ vUsername: environment._vasUser }).toString(),
      { headers: new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' }) }
    );
  }

  getDataProducts(): Observable<{ success: boolean; product_list: Product[] }> {
    return this.http.post<{ success: boolean; product_list: Product[] }>(
      `https://my-imali-vas.appspot.com/vas/v1/products/data`,
      new URLSearchParams({ vUsername: environment._vasUser }).toString(),
      { headers: new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' }) }
    );
  }

  purchaseAirtime(productCode: string, mobileNumber: string, amount: number): Observable<any> {
    const employeeNumber = this.userService.getUser();
    const payload = { productCode, mobileNumber, amount, employeeNumber };
    return this.http.post(`${this.nestApiUrl}/vas/purchase/airtime`, payload);
  }

  purchaseData(productCode: string, mobileNumber: string, amount: number): Observable<any> {
    const employeeNumber = this.userService.getUser();
    const payload = { productCode, mobileNumber, amount, employeeNumber };
    return this.http.post(`${this.nestApiUrl}/vas/purchase/data`, payload);
  }

  purchaseElectricity(meterNumber: string, amount: number, customReference: string): Observable<any> {
    const employeeNumber = this.userService.getUser();
    const payload = { meterNumber, amount, customReference, employeeNumber };
    return this.http.post(`${this.nestApiUrl}/vas/purchase/electricity`, payload);
  }
}
