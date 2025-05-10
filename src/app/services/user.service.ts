import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../enviroments/enviroment';
import { Observable } from 'rxjs';

interface AppParam {
  key: string;
  value: string;
}

interface UserBalance {
  employeeNumber: string;
  closingBalance: number;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly apiUrl = environment._umsukaApi;
  private currentUser: string | null = null;

  constructor(private http: HttpClient) {}

  /** Set user and store in localStorage */
  setUser(employeeNumber: string): void {
    this.currentUser = employeeNumber;
    localStorage.setItem('employeeNumber', employeeNumber);
  }

  /** Get current user from memory or localStorage */
  getUser(): string | null {
    return this.currentUser || localStorage.getItem('employeeNumber');
  }

  /** Clear stored user */
  logout(): void {
    this.currentUser = null;
    localStorage.removeItem('employeeNumber');
  }

  /** Fetch closing balance for user */
  getUserBalance(employeeNumber?: string): Observable<UserBalance> {
    const id = employeeNumber || this.getUser();
    if (!id) throw new Error('Employee number not available');
    return this.http.get<UserBalance>(`${this.apiUrl}/user-credits/balance/${id}`);
  }

  /** Get transactions by employee number */
  getTransactionsByEmployee(employeeNumber: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/transactions/employee/${employeeNumber}`);
  }

  /** Get a specific app config param */
  getAppParam(key: string): Observable<AppParam> {
    return this.http.get<AppParam>(`${this.apiUrl}/app-params/${key}`);
  }

  /** Get detailed user profile */
  getUserProfile(employeeNumber: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/users/${employeeNumber}`);
  }

  /** Update saved mobile numbers for user */
  updateMobileNumbers(employeeNumber: string, mobileNumbers: string[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/update-mobiles/${employeeNumber}`, { mobileNumbers });
  }

  /** Update saved electricity meters for user */
  updateElectricityMeters(employeeNumber: string, electricityMeters: string[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/update-meters/${employeeNumber}`, { electricityMeters });
  }

  /** Delete one mobile number */
  deleteMobileNumber(employeeNumber: string, numberToDelete: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/delete-mobile/${employeeNumber}`, { numberToDelete });
  }

  /** Delete one meter number */
  deleteElectricityMeter(employeeNumber: string, meterToDelete: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/delete-meter/${employeeNumber}`, { meterToDelete });
  }
}
