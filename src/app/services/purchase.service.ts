import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, switchMap, catchError, of, firstValueFrom } from 'rxjs';
import { environment } from '../../enviroments/enviroment';
import { UserService } from './user.service';


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

  constructor(
    private http: HttpClient,
    private userService: UserService
  ) {}

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
              console.log('response :>> ', response);
              if (response.success && response.reference) {
                return this.updateTransactionReference(transaction._id, response.reference, amount, response.success);
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
    const employeeNumber = this.userService.getUser();
    const transactionPayload = {
      productCode,
      mobileNumber,
      amount,
      employeeNumber, // Replaces username
      createdAt: new Date().toISOString()
    };
  
    return this.http.post(`${this.nestApiUrl}/transactions/save-transaction`, transactionPayload);
  }
  

  private updateTransactionReference(transactionId: string, reference: string, amount: number, success: boolean): Observable<any> {
    const employeeNumber = this.userService.getUser();
  
    return this.http.patch(`${this.nestApiUrl}/transactions/update-reference/${transactionId}`, { reference, success })
      .pipe(
        switchMap(() => {
          return this.addUserCreditRecord(employeeNumber!, amount, reference);
        })
      );
  }
  
  

  private addUserCreditRecord(employeeNumber: string, amount: number, reference: string): Observable<any> {
    const creditPayload = {
      employeeNumber,
      amount,
      reference,
      createdAt: new Date().toISOString()
    };
  
    return this.http.post(`${this.nestApiUrl}/user-credits`, creditPayload);
  }
  

  async purchaseElectricity(
    meterNumber: string,
    amount: number,
    customReference: string
  ): Promise<any> {
    const productCode = '226'; // Fixed for electricity
    const employeeNumber = this.userService.getUser();
    const headers = new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' });
  
    // 📝 Save initial transaction
    const transactionPayload = {
      productCode,
      mobileNumber: meterNumber,
      amount,
      employeeNumber,
      createdAt: new Date().toISOString()
    };
  console.log('transactionPayload :>> ', transactionPayload);
    const transaction = await firstValueFrom(
      this.http.post<any>(`${this.nestApiUrl}/transactions/save-transaction`, transactionPayload)
    );
  
    // ⚡ Call external purchase API
    const purchaseBody = new HttpParams()
      .set('vUsername', this.vUsername)
      .set('vPassword', this.vPassword)
      .set('vProductCode', productCode)
      .set('vMeterNumber', meterNumber)
      .set('vAmount', amount.toString())
      .set('vCustomReference', customReference);
  console.log('purchaseBody :>> ', purchaseBody);
    const purchaseResponse = await firstValueFrom(
      this.http.post<any>(`${this.baseUrl}/vas/v1/purchase/electricity`, purchaseBody.toString(), { headers })
    );
  
    console.log('⚡ Purchase Response:', purchaseResponse);
  
    // ✅ Confirm if applicable
    let confirmationResponse = null;
    if (purchaseResponse?.reference) {
      const confirmBody = new HttpParams()
        .set('vUsername', this.vUsername)
        .set('vPassword', this.vPassword)
        .set('vProductCode', productCode)
        .set('vConfirmationNumber', purchaseResponse.reference)
        .set('vAmount', amount.toString());
  
      confirmationResponse = await firstValueFrom(
        this.http.post<any>(`${this.baseUrl}/vas/v1/confirm`, confirmBody.toString(), { headers })
      );
  
      console.log('✅ Confirmation Response:', confirmationResponse);
    }
  
    // 📝 Update transaction + add credits if successful
    if (purchaseResponse?.reference) {
      await firstValueFrom(
        this.http.patch(`${this.nestApiUrl}/transactions/update-reference/${transaction._id}`, {
          reference: purchaseResponse.reference,
          success: purchaseResponse.success
        })
      );
  
      await firstValueFrom(
        this.http.post(`${this.nestApiUrl}/user-credits`, {
          employeeNumber,
          amount,
          reference: purchaseResponse.reference,
          createdAt: new Date().toISOString()
        })
      );
    }
  
    // ⏳ Wait 10s for transaction to register
    await new Promise(resolve => setTimeout(resolve, 10000));
  
    // 📦 Get transaction response
    let transactionResponse = null;
    if (purchaseResponse?.reference) {
      console.log('purchaseResponse HERE:>> ', purchaseResponse);
      const responseBody = new HttpParams()
        .set('vUsername', this.vUsername)
        .set('vPassword', this.vPassword)
        .set('vReference', purchaseResponse.reference);
  console.log('responseBody :>> ', responseBody);
      transactionResponse = await firstValueFrom(
        this.http.post<any>(`${this.baseUrl}/vas/v1/transaction/response`, responseBody.toString(), { headers })
      );
  
      console.log('📦 Transaction Response:', transactionResponse);
    }
  
    return {
      purchase: purchaseResponse,
      confirmation: confirmationResponse,
      transactionResponse,
    };
  }
  
  
  
  confirmPurchase(reference: string, productCode: string, amount: number): Observable<any> {
    const body = new HttpParams()
      .set('vUsername', this.vUsername)
      .set('vPassword', this.vPassword)
      .set('vProductCode', 226)
      .set('vConfirmationNumber', reference)
      .set('vAmount', amount.toString());
  console.log('bodyconfirm  :>> ', body );
    const headers = new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' });
  
    return this.http.post(`${this.baseUrl}/vas/v1/confirm`, body.toString(), { headers });
  }
  
  
  getTransactionResponse(reference: string): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' });
  
    const body = new HttpParams()
      .set('vUsername', this.vUsername)
      .set('vPassword', this.vPassword)
      .set('vReference', reference);
  
    return this.http.post(`${this.baseUrl}/vas/v1/transaction/response`, body.toString(), { headers });
  }
  
}
