import { Injectable } from '@angular/core';
import { Subject, ReplaySubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProgressService {

  private tasksToDo = 0;
  private tasksDone = 0;
  public progress=new ReplaySubject<number>(1);

  constructor() { 
    this.progress.next(0);
  }

  public addTask(amount=1){
    this.tasksToDo+=amount;
    this.onChange();
  }
  public taskDone(amount=1){
    this.tasksDone+=amount;
    this.onChange();
  }
  private onChange(){
    this.progress.next(Math.floor(this.tasksDone/this.tasksToDo*100));
  
    if (this.tasksDone >= this.tasksToDo){
      this.tasksDone = 0;
      this.tasksToDo = 0;
    }
  }
}
