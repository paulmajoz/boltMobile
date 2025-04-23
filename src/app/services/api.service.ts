import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../enviroments/enviroment';


export interface Transaction {
  id: string;
  amount: number;
  date: string;
  description: string;
  type: 'credit' | 'debit';
}

export interface Benefit {
  id: string;
  title: string;
  description: string;
  active: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment._umsukaApi;

  // ✅ Mock user data (keep this for login/header)
  private mockUserInfo = {
    username: 'umsuka-wemali-test',
    firstName: 'John',
    lastName: 'Doe',
    balance: 1250.50
  };

  constructor(private http: HttpClient) {}

  // ✅ Authentication
// src/app/services/api.service.ts
// api.service.ts
login(credentials: { employeeNumber: string; nationalId: string }): Observable<any> {
  console.log('Logging in with:', credentials);
  return this.http.post(`${this.apiUrl}/users/login`, credentials);
}



  getUserInfo(): Observable<any> {
    return of(this.mockUserInfo);
  }

  // ✅ Transactions
  getTransactions(): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(`${this.apiUrl}/transactions`);
  }

  addTransaction(transaction: Omit<Transaction, 'id'>): Observable<Transaction> {
    return this.http.post<Transaction>(`${this.apiUrl}/transactions`, transaction);
  }

  // ✅ Benefits
  getBenefits(): Observable<Benefit[]> {
    return this.http.get<Benefit[]>(`${this.apiUrl}/benefits`);
  }

  // ✅ Profile
  updateProfile(profileData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/profile`, profileData);
  }

  // ✅ Account
  getAccountDetails(): Observable<any> {
    return this.http.get(`${this.apiUrl}/account`);
  }

  // ✅ Activity
  getRecentActivity(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/activity`);
  }


}
