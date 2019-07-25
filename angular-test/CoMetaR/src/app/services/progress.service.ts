import { Injectable } from '@angular/core';
import { Subject, ReplaySubject, BehaviorSubject } from 'rxjs';

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

  public treeTaskRunning$ = new BehaviorSubject<boolean>(false);
  public treeTaskProgress$ = new BehaviorSubject<number>(0);
  public addTreeTask(name:string, subtasks:number):Task{
    let t = new Task(name, "tree",subtasks,()=>{
      this.treeTaskRunning$.next(true);
    },()=>{
      this.treeTaskRunning$.next(false);
    });
    t.progress$.subscribe(this.treeTaskProgress$);
    return t;
  }

  public moduleTaskRunning$ = new BehaviorSubject<boolean>(false);
  public moduleTaskProgress$ = new BehaviorSubject<number>(0);
  public addModuleTask(name:string, subtasks:number):Task{
    let t = new Task(name, "module",subtasks,()=>{
      this.moduleTaskRunning$.next(true);
    },()=>{
      this.moduleTaskRunning$.next(false);
    });
    t.progress$.subscribe(this.moduleTaskProgress$);
    return t;
  }
}

export class Task {
  private log:boolean=true;
  private name:string;
  private promise:Promise<any>;
  private type:"tree"|"module";
  private subtasks_done:number=0;
  private subtasks:number=0;
  private onFinish=()=>{};
  public progress$= new BehaviorSubject<number>(0);
  public status:"created"|"running"|"finished"="created";
  constructor(name,type,subtasks:number,onStart:()=>void,onFinish:()=>void){
    this.name=name;
    this.type=type;
    this.subtasks=subtasks;
    this.onFinish=onFinish;
    onStart();
    if(this.log) console.log("Task \""+name+"\" started ("+subtasks+").");
    this.status="running";
  }
  public update(subtasks_done:number,subtasks_left:number){
    if (subtasks_done)this.subtasks_done=subtasks_done;
    if (subtasks_left)this.subtasks=subtasks_left
    if(this.log) console.log("Task \""+this.name+"\" update ("+this.subtasks_done+" of "+this.subtasks+").");
    this.progress$.next(Math.floor(this.subtasks_done/this.subtasks*100));
  }
  public finish(){
    if (this.status == "running"){
      if(this.log) console.log("Task \""+this.name+"\" finished.");
      this.status="finished";
      this.onFinish();
    }
  }
}