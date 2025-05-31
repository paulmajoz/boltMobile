import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, switchMap, catchError, of, firstValueFrom, from, map } from 'rxjs';
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
  
        return this.http.post<any>(endpoint, purchaseBody.toString(), { headers }).pipe(
          switchMap(purchaseResponse => {
            const reference = purchaseResponse?.reference;
  
            if (!reference) {
              console.warn('⚠️ No reference returned from purchase');
              return of(transaction); // Stop if no reference
            }
  
            // Only poll if reference exists
            const pollBody = new HttpParams()
              .set('vUsername', this.vUsername)
              .set('vPassword', this.vPassword)
              .set('vReference', reference);
  
            return from((async () => {
              for (let attempt = 1; attempt <= 10; attempt++) {
                console.log(`⏳ Polling attempt ${attempt} for reference ${reference}`);
                try {
                  const res = await firstValueFrom(
                    this.http.post<any>(`${this.baseUrl}/vas/v1/transaction/response`, pollBody.toString(), { headers })
                  );
                  console.log(`📥 Response on attempt ${attempt}:`, res);
  
                  if (
                    res?.data?.confirmation_number ||
                    res?.data?.reference ||
                    res?.data?.elec_data?.std_tokens?.[0]?.code
                  ) {
                    return res;
                  }
                } catch (err) {
                  console.warn(`⚠️ Polling failed on attempt ${attempt}`, err);
                }
  
                await new Promise(resolve => setTimeout(resolve, 3000));
              }
  
              throw new Error('Polling timed out. No valid response received.');
            })()).pipe(
              switchMap(finalResponse => {
                console.log('✅ Final confirmed response:', finalResponse.data);
                return this.updateTransactionReference({
                  transactionId: transaction._id,
                  reference: finalResponse?.data.reference,
                  amount,
                  success: finalResponse?.data.success
                }).pipe(
                  map(() => finalResponse)
                );
              }),
              catchError(err => {
                console.error('❌ Polling failed:', err);
                return of(transaction);
              })
            );
          }),
          catchError(err => {
            console.error('❌ Error in purchase:', err);
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

  private updateTransactionReference({
    transactionId,
    reference,
    amount,
    success
  }: {
    transactionId: string;
    reference: string;
    amount: number;
    success: boolean;
  }): Observable<any> {
    const employeeNumber = this.userService.getUser();
  
    console.log('reference, success :>> ', reference, success);
  
    if (success) {
      return this.http.patch(`${this.nestApiUrl}/transactions/update-reference/${transactionId}`, {
        reference,
        success
      }).pipe(
        switchMap(() => {
          if (employeeNumber) {
            return this.addUserCreditRecord(employeeNumber, amount, reference);
          } else {
            console.warn('⚠️ No employee number found, skipping credit record');
            return of({ warning: 'No employee number found' });
          }
        })
      );
    }
  
    // Return an observable even when not successful
    return of({ message: 'Transaction not successful. No update performed.' });
  }
  
  

  private addUserCreditRecord(employeeNumber: string, amount: number, reference: string): Observable<any> {
    const creditPayload = { employeeNumber, amount, reference, createdAt: new Date().toISOString() };
    return this.http.post(`${this.nestApiUrl}/user-credits`, creditPayload);
  }

  async purchaseElectricity(meterNumber: string, amount: number, customReference: string): Promise<any> {
    
    const employeeNumber = this.userService.getUser();
    const headers = new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' });
    
    const electrictyProductBody = new HttpParams()
    .set('vUsername', this.vUsername)
    // .set('vPassword', this.vPassword)
    // .set('vProductCode', productCode)
    // .set('vMeterNumber', meterNumber)
    // .set('vAmount', amount.toString())
    // .set('vCustomReference', customReference);
    
    console.log('📤 Sending purchase request to VAS API...');
    const electrictyProduct = await firstValueFrom(
      this.http.post<any>(`${this.baseUrl}/vas/v1/products/electricity`, electrictyProductBody.toString(), { headers })
    );
    console.log('🛒 ProductList response:', electrictyProduct);
    
    console.log('⚡ Starting electricity purchase...');
    console.log('🧾 Employee Number:', employeeNumber);
    console.log('📟 Meter Number:', meterNumber);
    console.log('💰 Amount:', amount);
    console.log('🔖 Custom Reference:', customReference);

    const productCode = electrictyProduct.product_list?.[0].product_code
    console.log('ProductCode :>> ', productCode.product_list?.[0].product_code);
  
    const transactionPayload = {
      productCode,
      mobileNumber: meterNumber,
      amount,
      employeeNumber,
      createdAt: new Date().toISOString(),
      success: false
    };
    console.log('📝 Saving transaction to backend:', transactionPayload);
  
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
  
    console.log('📤 Sending purchase request to VAS API...');
    const purchaseResponse = await firstValueFrom(
      this.http.post<any>(`${this.baseUrl}/vas/v1/purchase/electricity`, purchaseBody.toString(), { headers })
    );
    console.log('🛒 Purchase response:', purchaseResponse);
  
    const transactionRef = purchaseResponse?.reference;
    console.log('🔗 Transaction Reference:', transactionRef);
  
    if (transactionRef) {
      console.log('🛠 Updating backend transaction with reference and success status...');
      await firstValueFrom(
        this.http.patch(`${this.nestApiUrl}/transactions/update-reference/${transaction._id}`, {
          reference: transactionRef,
        })
      );
    }
  
    const pollTransactionResponse = async (ref: string): Promise<any> => {
      console.log(`📡 Starting polling for transaction response: ${ref}`);
      const body = new HttpParams()
        .set('vUsername', this.vUsername)
        .set('vPassword', this.vPassword)
        .set('vReference', ref);
  
      for (let attempt = 1; attempt <= 10; attempt++) {
        console.log(`⏳ Polling attempt ${attempt}...`);
        const res = await firstValueFrom(
          this.http.post<any>(`${this.baseUrl}/vas/v1/transaction/response`, body.toString(), { headers })
        );
        console.log(`📥 Response on attempt ${attempt}:`, res);
        if (res?.data?.confirmation_number || res?.data?.reference || res?.data?.elec_data?.std_tokens?.[0]?.code) return res;
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
      throw new Error('Polling timed out. No valid response received.');
    };
  
    let transactionResponse = await pollTransactionResponse(transactionRef);
    console.log('🔁 Initial transaction response:', transactionResponse);
  
    let confirmationResponse = null;
  
    if (transactionResponse?.data?.confirmation_number) {
      console.log('✅ Confirmation number found:', transactionResponse.data.confirmation_number);
      const confirmBody = new HttpParams()
        .set('vUsername', this.vUsername)
        .set('vPassword', this.vPassword)
        .set('vProductCode', productCode)
        .set('vConfirmationNumber', transactionResponse.data.confirmation_number)
        .set('vAmount', amount.toString());
  
      console.log('📤 Sending confirmation request...');
      confirmationResponse = await firstValueFrom(
        this.http.post<any>(`${this.baseUrl}/vas/v1/confirm`, confirmBody.toString(), { headers })
      );
      console.log('📩 Confirmation response:', confirmationResponse);
  
      const confirmRef = confirmationResponse?.reference || transactionRef;
      console.log('🔁 Polling again with confirmation reference:', confirmRef);
      transactionResponse = await pollTransactionResponse(confirmRef);
      console.log('📥 Final transaction response after confirmation:', transactionResponse);
    }
  
    const token = transactionResponse?.data?.elec_data?.std_tokens?.[0]?.code;
    console.log('🔑 Electricity Token:', token);
  
    if (token) {
      console.log('💾 Posting credit info to backend...');
      await firstValueFrom(
        this.http.post(`${this.nestApiUrl}/user-credits`, {
          employeeNumber,
          amount,
          reference: token,
          createdAt: new Date().toISOString(),
          success: true
        })
      );
      console.log('✅ Credit info saved.');
      console.log('🛠 Updating backend transaction with reference and success status...');
      await firstValueFrom(
        this.http.patch(`${this.nestApiUrl}/transactions/update-reference/${transaction._id}`, {
          reference: token,
          success: true,
          token:token,
        })
      );
    }
    // const response_message = transactionResponse?.data.provider_response?.response_message;
    // console.log('🔑 response_message', response_message);
  
    // if (response_message) {
    //   // console.log('💾 Posting credit info to backend...');
    //   // await firstValueFrom(
    //   //   this.http.post(`${this.nestApiUrl}/user-credits`, {
    //   //     employeeNumber,
    //   //     amount,
    //   //     reference: token,
    //   //     createdAt: new Date().toISOString(),
    //   //     success: true
    //   //   })
    //   // );
    //   // console.log('✅ Credit info saved.');
    //   // console.log('🛠 Updating backend transaction with reference and success status...');
    //   // await firstValueFrom(
    //   //   this.http.patch(`${this.nestApiUrl}/transactions/update-reference/${transaction._id}`, {
    //   //     reference: token,
    //   //     success: true,
    //   //     token:token,
    //   //   })
    //   // );
    // }

  
    console.log('🎉 Purchase process completed successfully.');
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
