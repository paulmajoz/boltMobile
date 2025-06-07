import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../enviroments/enviroment';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FireEmergencyService {
  private readonly apiUrl = environment._umsukaApi;

  constructor(private http: HttpClient) {}

  /** Submit fire emergency form */
  submitEmergencyForm(data: {
    fireSource: string;
    location: string;
    coordinates: string;
    trappedOrInjured: string;
    fireSize: string;
    safeToStay: string;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/fire-emergency`, data);
  }
}
