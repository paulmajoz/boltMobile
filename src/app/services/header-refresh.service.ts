import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class HeaderRefreshService {
  private refreshHeaderSubject = new Subject<void>();
  refreshHeader$ = this.refreshHeaderSubject.asObservable();

  triggerRefresh(): void {
    this.refreshHeaderSubject.next();
  }
}
