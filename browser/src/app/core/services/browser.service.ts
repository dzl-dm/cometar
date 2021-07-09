import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BrowserService {
  public snackbarNotification: Subject<string[]> = new Subject();
  public resizeSubject = new Subject<any>();
  constructor() { }
  public onResize(){
    this.resizeSubject.next();
  }
}
