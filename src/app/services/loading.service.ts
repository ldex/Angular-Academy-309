import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, concatMap, finalize } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {

  private loadingSubject = new BehaviorSubject<boolean>(false);
  loading$: Observable<boolean> = this.loadingSubject.asObservable();

  constructor() { }

  showLoaderUntilCompleted<T>(obs$: Observable<T>): void {
    of(null)
        .pipe(
            tap(() => this.loadingOn()),
            concatMap(() => obs$),
            finalize(() => this.loadingOff())
        ).subscribe();
  }

  loadingOn() {
    this.loadingSubject.next(true);
  }

  loadingOff() {
    this.loadingSubject.next(false);
  }
}
