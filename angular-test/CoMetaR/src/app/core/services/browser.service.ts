import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { TreeStyleService } from './tree-style.service';
import { DataService } from 'src/app/services/data.service';

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
