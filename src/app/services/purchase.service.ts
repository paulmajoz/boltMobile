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
              if (response && response.reference) {
                console.log('response :>> ', response);
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
    console.log('success updateTransactionReference:>> ', success);
  
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
    const productCode = '226';
    const employeeNumber = this.userService.getUser();
    const headers = new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' });
  
    console.log('🔌 Starting electricity purchase flow...');
    console.log('👤 Employee Number:', employeeNumber);
    console.log('📟 Meter Number:', meterNumber);
    console.log('💰 Amount:', amount);
  
    const transactionPayload = {
      productCode,
      mobileNumber: meterNumber,
      amount,
      employeeNumber,
      createdAt: new Date().toISOString()
    };
    console.log('📝 Saving transaction:', transactionPayload);
  
    const transaction = await firstValueFrom(
      this.http.post<any>(`${this.nestApiUrl}/transactions/save-transaction`, transactionPayload)
    );
    console.log('✅ Transaction saved:', transaction);
  
    const purchaseBody = new HttpParams()
      .set('vUsername', this.vUsername)
      .set('vPassword', this.vPassword)
      .set('vProductCode', productCode)
      .set('vMeterNumber', meterNumber)
      .set('vAmount', amount.toString())
      .set('vCustomReference', customReference);
  
    console.log('⚡ Sending purchase request:', purchaseBody.toString());
  
    const purchaseResponse = await firstValueFrom(
      this.http.post<any>(`${this.baseUrl}/vas/v1/purchase/electricity`, purchaseBody.toString(), { headers })
    );
    console.log('⚡ Purchase Response:', purchaseResponse);
  
    const transactionRef = purchaseResponse?.reference;
    console.log('📌 Transaction Reference:', transactionRef);
  
    if (transactionRef) {
      await firstValueFrom(
        this.http.patch(`${this.nestApiUrl}/transactions/update-reference/${transaction._id}`, {
          reference: transactionRef,
          success: purchaseResponse.success
        })
      );
      console.log('🔄 Transaction updated with reference and success.');
    }
  
    const buildResponseParams = (ref: string): HttpParams =>
      new HttpParams()
        .set('vUsername', this.vUsername)
        .set('vPassword', this.vPassword)
        .set('vReference', ref);
  
    const pollTransactionResponse = async (ref: string): Promise<any> => {
      const responseBody = buildResponseParams(ref);
      console.log('responseBody :>> ', responseBody);
      for (let attempt = 1; attempt <= 10; attempt++) {
        console.log(`📡 Polling attempt ${attempt} for reference: ${ref}...`);
        const res = await firstValueFrom(
          this.http.post<any>(`${this.baseUrl}/vas/v1/transaction/response`, responseBody.toString(), { headers })
        );
        console.log('📦 Transaction Poll Response:', res);
  
        if (res?.data?.confirmation_number) return res;
        if (res?.data?.elec_data?.std_tokens?.[0]?.code) return res;
  
        console.log('⏳ Waiting 3s before next poll...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
      throw new Error('Polling timed out. No valid response received.');
    };
  
    let transactionResponse = await pollTransactionResponse(transactionRef);
  
    let confirmationResponse = null;
    if (transactionResponse?.data?.confirmation_number) {
      console.log('⚠️ Confirmation required. Sending confirmation...');
      const confirmBody = new HttpParams()
        .set('vUsername', this.vUsername)
        .set('vPassword', this.vPassword)
        .set('vProductCode', productCode)
        .set('vConfirmationNumber', transactionResponse.data.confirmation_number)
        .set('vAmount', amount.toString());
  
      confirmationResponse = await firstValueFrom(
        this.http.post<any>(`${this.baseUrl}/vas/v1/confirm`, confirmBody.toString(), { headers })
      );
      console.log('✅ Confirmation Response:', confirmationResponse);
  
      const confirmRef = confirmationResponse?.reference || transactionRef;
      console.log('📡 Polling again with confirmation reference:', confirmRef);
      transactionResponse = await pollTransactionResponse(confirmRef);
    }
  
    const token = transactionResponse?.data?.elec_data?.std_tokens?.[0]?.code;
    if (token) {
      console.log('🎁 Electricity token received:', token);
      await firstValueFrom(
        this.http.post(`${this.nestApiUrl}/user-credits`, {
          employeeNumber,
          amount,
          reference: confirmationResponse?.reference || transactionRef,
          createdAt: new Date().toISOString()
        })
      );
      console.log('💳 Credit recorded for employee.');
    } else {
      console.warn('⚠️ No token found in transaction response.');
    }
  
    console.log('✅ Electricity purchase flow complete.');
  
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
