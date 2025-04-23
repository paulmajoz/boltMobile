import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../enviroments/enviroment';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UserService {
  private apiUrl = environment._umsukaApi;
  private currentUser: string | null = null;

  constructor(private http: HttpClient) {}

  // Set current user
  setUser(employeeNumber: string) {
    this.currentUser = employeeNumber;
    localStorage.setItem('employeeNumber', employeeNumber);
  }

  // Get current user
  getUser(): string | null {
    return this.currentUser || localStorage.getItem('employeeNumber');
  }

  // Logout
  logout() {
    this.currentUser = null;
    localStorage.removeItem('employeeNumber');
  }

  // Get user balance
  getUserBalance(employeeNumber?: string): Observable<{ employeeNumber: string; closingBalance: number }> {
    const id = employeeNumber || this.getUser();
    if (!id) {
      throw new Error('Employee number not available');
    }

    return this.http.get<{ employeeNumber: string; closingBalance: number }>(
      `${this.apiUrl}/user-credits/balance/${id}`
    );
  }

  getTransactionsByEmployee(employeeNumber: any): Observable<any[]> {
    console.log('emplo :>> ', employeeNumber)
    return this.http.get<any[]>(`${this.apiUrl}/transactions/employee/${employeeNumber}`);
  }

}
