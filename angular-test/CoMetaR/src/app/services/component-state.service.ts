import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ComponentStateService {

  private states = {};
  constructor() { }

  public saveState(name:string, state:{}){
    this.states[name]=state;
  }
  public getState(name){
    return this.states[name];
  }
}
