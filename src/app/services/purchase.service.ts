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

@Injectable({ providedIn: 'root' })
export class PurchaseService {
  private readonly baseUrl = environment._vasApi;
  private readonly nestApiUrl = environment._umsukaApi;
  private readonly vUsername = environment._vasUser;
  private readonly vPassword = environment._vasPassword;

  constructor(private http: HttpClient, private userService: UserService) {}

  getAirtimeProducts(): Observable<{ success: boolean; product_list: Product[] }> {
    return this.fetchProducts(`${this.baseUrl}/vas/v1/products/airtime`);
  }

  getDataProducts(): Observable<{ success: boolean; product_list: Product[] }> {
    return this.fetchProducts(`${this.baseUrl}/vas/v1/products/data`);
  }

  private fetchProducts(endpoint: string): Observable<{ success: boolean; product_list: Product[] }> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' });
    const body = new HttpParams().set('vUsername', this.vUsername);
  
    return this.http.post<{ success: boolean; product_list: Product[] }>(endpoint, body.toString(), { headers });
  }
  

  purchaseAirtime(productCode: string, mobileNumber: string, amount: number): Observable<any> {
    return this.processPurchase(`${this.baseUrl}/vas/v1/purchase/airtime`, productCode, mobileNumber, amount);
  }

  purchaseData(productCode: string, mobileNumber: string, amount: number): Observable<any> {
    return this.processPurchase(`${this.baseUrl}/vas/v1/purchase/data`, productCode, mobileNumber, amount);
  }

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

        return this.http.post<{ success: boolean; reference: string }>(endpoint, purchaseBody.toString(), { headers }).pipe(
          switchMap(response => {
            if (response?.reference) {
              return this.updateTransactionReference(transaction._id, response.reference, amount, response.success);
            }
            return of(transaction);
          }),
          catchError(err => {
            console.error('❌ Purchase failed:', err);
            return of(transaction);
          })
        );
      })
    );
  }

  private saveTransaction(productCode: string, mobileNumber: string, amount: number): Observable<any> {
    const transactionPayload = {
      productCode,
      mobileNumber,
      amount,
      employeeNumber: this.userService.getUser(),
      createdAt: new Date().toISOString(),
    };
    return this.http.post(`${this.nestApiUrl}/transactions/save-transaction`, transactionPayload);
  }

  private updateTransactionReference(transactionId: string, reference: string, amount: number, success: boolean): Observable<any> {
    const employeeNumber = this.userService.getUser();
    return this.http.patch(`${this.nestApiUrl}/transactions/update-reference/${transactionId}`, { reference, success })
      .pipe(switchMap(() => this.addUserCreditRecord(employeeNumber!, amount, reference)));
  }

  private addUserCreditRecord(employeeNumber: string, amount: number, reference: string): Observable<any> {
    const creditPayload = { employeeNumber, amount, reference, createdAt: new Date().toISOString() };
    return this.http.post(`${this.nestApiUrl}/user-credits`, creditPayload);
  }

  async purchaseElectricity(meterNumber: string, amount: number, customReference: string): Promise<any> {
    const productCode = '226';
    const employeeNumber = this.userService.getUser();
    const headers = new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' });

    const transactionPayload = {
      productCode,
      mobileNumber: meterNumber,
      amount,
      employeeNumber,
      createdAt: new Date().toISOString()
    };
    const transaction = await firstValueFrom(
      this.http.post<any>(`${this.nestApiUrl}/transactions/save-transaction`, transactionPayload)
    );

    const purchaseBody = new HttpParams()
      .set('vUsername', this.vUsername)
      .set('vPassword', this.vPassword)
      .set('vProductCode', productCode)
      .set('vMeterNumber', meterNumber)
      .set('vAmount', amount.toString())
      .set('vCustomReference', customReference);

    const purchaseResponse = await firstValueFrom(
      this.http.post<any>(`${this.baseUrl}/vas/v1/purchase/electricity`, purchaseBody.toString(), { headers })
    );

    const transactionRef = purchaseResponse?.reference;
    if (transactionRef) {
      await firstValueFrom(
        this.http.patch(`${this.nestApiUrl}/transactions/update-reference/${transaction._id}`, {
          reference: transactionRef,
          success: purchaseResponse.success
        })
      );
    }

    const pollTransactionResponse = async (ref: string): Promise<any> => {
      const body = new HttpParams()
        .set('vUsername', this.vUsername)
        .set('vPassword', this.vPassword)
        .set('vReference', ref);

      for (let attempt = 1; attempt <= 10; attempt++) {
        const res = await firstValueFrom(
          this.http.post<any>(`${this.baseUrl}/vas/v1/transaction/response`, body.toString(), { headers })
        );
        if (res?.data?.confirmation_number || res?.data?.elec_data?.std_tokens?.[0]?.code) return res;
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
      throw new Error('Polling timed out. No valid response received.');
    };

    let transactionResponse = await pollTransactionResponse(transactionRef);
    let confirmationResponse = null;

    if (transactionResponse?.data?.confirmation_number) {
      const confirmBody = new HttpParams()
        .set('vUsername', this.vUsername)
        .set('vPassword', this.vPassword)
        .set('vProductCode', productCode)
        .set('vConfirmationNumber', transactionResponse.data.confirmation_number)
        .set('vAmount', amount.toString());

      confirmationResponse = await firstValueFrom(
        this.http.post<any>(`${this.baseUrl}/vas/v1/confirm`, confirmBody.toString(), { headers })
      );

      const confirmRef = confirmationResponse?.reference || transactionRef;
      transactionResponse = await pollTransactionResponse(confirmRef);
    }

    const token = transactionResponse?.data?.elec_data?.std_tokens?.[0]?.code;
    if (token) {
      await firstValueFrom(
        this.http.post(`${this.nestApiUrl}/user-credits`, {
          employeeNumber,
          amount,
          reference: confirmationResponse?.reference || transactionRef,
          createdAt: new Date().toISOString()
        })
      );
    }

    return {
      purchase: purchaseResponse,
      confirmation: confirmationResponse,
      transactionResponse
    };
  }

  confirmPurchase(reference: string, productCode: string, amount: number): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' });
    const body = new HttpParams()
      .set('vUsername', this.vUsername)
      .set('vPassword', this.vPassword)
      .set('vProductCode', productCode)
      .set('vConfirmationNumber', reference)
      .set('vAmount', amount.toString());
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
