import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, switchMap, catchError, of } from 'rxjs';
import { environment } from '../../enviroments/enviroment';


interface Product {
  product_type: string;
  product_code: string;
  product_description: string;
  product_category: string;
  product_value: string;
}

@Injectable({
  providedIn: 'root'
})
export class PurchaseService {
  private baseUrl = environment._vasApi;
  private nestApiUrl = environment._umsukaApi; 
  private vUsername = environment._vasUser;
  private vPassword = environment._vasPassword;

  constructor(private http: HttpClient) {}

  // ✅ Fetch Airtime Products
  getAirtimeProducts(): Observable<{ success: boolean; product_list: Product[] }> {
    return this.fetchProducts(`${this.baseUrl}/vas/v1/products/airtime`);
  }

  // ✅ Fetch Data Products
  getDataProducts(): Observable<{ success: boolean; product_list: Product[] }> {
    return this.fetchProducts(`${this.baseUrl}/vas/v1/products/data`);
  }

  // ✅ Fetch Products Helper
  private fetchProducts(endpoint: string): Observable<{ success: boolean; product_list: Product[] }> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' });
    const body = new HttpParams().set('vUsername', this.vUsername);

    return this.http.post<{ success: boolean; product_list: Product[] }>(endpoint, body.toString(), { headers });
  }

  // ✅ Purchase Airtime
  purchaseAirtime(productCode: string, mobileNumber: string, amount: number): Observable<any> {
    return this.processPurchase(`${this.baseUrl}/vas/v1/purchase/airtime`, productCode, mobileNumber, amount);
  }

  // ✅ Purchase Data
  purchaseData(productCode: string, mobileNumber: string, amount: number): Observable<any> {
    return this.processPurchase(`${this.baseUrl}/vas/v1/purchase/data`, productCode, mobileNumber, amount);
  }

  // ✅ Common function for purchases (Airtime & Data)
  private processPurchase(endpoint: string, productCode: string, mobileNumber: string, amount: number): Observable<any> {
    return this.saveTransaction(productCode, mobileNumber, amount).pipe(
      switchMap(transaction => {
        const purchaseBody = new HttpParams()
          .set('vUsername', this.vUsername)
          .set('vPassword', this.vPassword)
          .set('vProductCode', productCode)
          .set('vMobileNumber', mobileNumber)
          .set('vAmount', amount.toString());

        const headers = new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' });

        return this.http.post<{ success: boolean; reference: string }>(endpoint, purchaseBody.toString(), { headers })
          .pipe(
            switchMap(response => {
              if (response.success && response.reference) {
                return this.updateTransactionReference(transaction._id, response.reference, amount);
              }
              return of(transaction); // Return transaction even if no reference
            }),
            catchError(err => {
              console.error('❌ Purchase failed:', err);
              return of(transaction);
            })
          );
      })
    );
  }

  // ✅ Save transaction initially (without reference)
  private saveTransaction(productCode: string, mobileNumber: string, amount: number): Observable<any> {
    const transactionPayload = {
      productCode,
      mobileNumber,
      amount,
      username: this.vUsername,
      createdAt: new Date().toISOString()
    };

    return this.http.post(`${this.nestApiUrl}/transactions/save-transaction`, transactionPayload);
  }

  // ✅ Update transaction reference on success & add ledger record
  private updateTransactionReference(transactionId: string, reference: string, amount: number): Observable<any> {
    return this.http.patch(`${this.nestApiUrl}/transactions/update-reference/${transactionId}`, { reference })
      .pipe(
        switchMap(() => {
          return this.addUserCreditRecord(this.vUsername, amount, reference);
        })
      );
  }

  // ✅ Add user credit record (Ledger Entry)
  private addUserCreditRecord(username: string, amount: number, reference: string): Observable<any> {
    const creditPayload = {
      username,
      amount,
      reference,
      createdAt: new Date().toISOString()
    };

    return this.http.post(`${this.nestApiUrl}/user-credits`, creditPayload);
  }

  purchaseElectricity(
    productCode: string,
    meterNumber: string,
    amount: number,
    customReference: string
  ): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' });
  
    const body = new HttpParams()
      .set('vUsername', this.vUsername)
      .set('vPassword', this.vPassword)
      .set('vProductCode', productCode)
      .set('vMeterNumber', meterNumber)
      .set('vAmount', amount.toString())
      .set('vCustomReference', customReference);
  
    return this.http.post(`${this.baseUrl}/vas/v1/purchase/electricity`, body.toString(), { headers });
  }
  
  confirmPurchase(reference: string, productCode: string, amount: number): Observable<any> {
    const body = new HttpParams()
      .set('vUsername', this.vUsername)
      .set('vPassword', this.vPassword)
      .set('vProductCode', productCode)
      .set('vConfirmationNumber', reference)
      .set('vAmount', amount.toString());
  
    const headers = new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' });
  
    return this.http.post(`${this.baseUrl}/vas/v1/confirm`, body.toString(), { headers });
  }
  
  
  
}
