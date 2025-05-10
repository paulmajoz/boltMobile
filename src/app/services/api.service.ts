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

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly apiUrl = environment._umsukaApi;

  /** ⚠️ Mock user data — remove in production */
  private readonly mockUserInfo = {
    username: 'umsuka-wemali-test',
    firstName: 'John',
    lastName: 'Doe',
    balance: 1250.50
  };

  constructor(private http: HttpClient) {}

  /** Login user with credentials */
  login(credentials: { employeeNumber: string; nationalId: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/login`, credentials);
  }

  /** Get mock user info (used for header/testing) */
  getUserInfo(): Observable<any> {
    return of(this.mockUserInfo);
  }

  /** Fetch all transactions */
  getTransactions(): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(`${this.apiUrl}/transactions`);
  }

  /** Add a new transaction */
  addTransaction(transaction: Omit<Transaction, 'id'>): Observable<Transaction> {
    return this.http.post<Transaction>(`${this.apiUrl}/transactions`, transaction);
  }

  /** Fetch all active benefits */
  getBenefits(): Observable<Benefit[]> {
    return this.http.get<Benefit[]>(`${this.apiUrl}/benefits`);
  }

  /** Update user profile */
  updateProfile(profileData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/profile`, profileData);
  }

  /** Get user account details */
  getAccountDetails(): Observable<any> {
    return this.http.get(`${this.apiUrl}/account`);
  }

  /** Get recent user activity */
  getRecentActivity(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/activity`);
  }
}
