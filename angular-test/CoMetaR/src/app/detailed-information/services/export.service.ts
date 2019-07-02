import { Injectable } from '@angular/core';
import { Observable, combineLatest, Subject, of, Subscription, BehaviorSubject } from 'rxjs';
import { map, flatMap, single, first, combineAll } from 'rxjs/operators';
import { InformationQueryService, OntologyElementDetails } from './queries/information-query.service';
import { OntologyAccessService } from 'src/app/core/services/ontology-access.service';
import { TreeItem } from 'src/app/core/classes/tree-item';

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  private exportItem:ExportItem;

  constructor(
    private informationQueryService:InformationQueryService,
    private ontologyAccessService: OntologyAccessService
  ) { }

  public get(iri:string, callback:(exportString: string)=>void):void {
    let o = this.ontologyAccessService.getSubItems$(iri).pipe(first()).subscribe(tis => {
      this.exportItem = { treeItem: tis[0], subExportItems: [], ontologyElementDetails: [] };
      this.getRecursive(this.exportItem).subscribe(next => {
        if (next == false) return;
        let s = "label;status;codes;units;is modifier\n";
        let exportString = this.writeExport(this.exportItem, s, 0);
        callback(exportString);
      });
    });
  }

  private writeExport(ei:ExportItem, s:string, level:number):string {
    let distinctFilter = (value, index, self) => {
      return self.indexOf(value) === index;
    };
    let intent="";
    for(let i = 0; i < level; i++) intent+= "  ";
    let label = ei.treeItem.label.value;
    let status = ei.treeItem.status?ei.treeItem.status.value:"";
    let isMod = ei.treeItem.isModifier && ei.treeItem.isModifier.value == true?"true":"false";
    let notations = ei.ontologyElementDetails.map(oed => oed.notation && oed.notation.value).filter(a => a != undefined).filter(distinctFilter).join(",");
    let units = ei.ontologyElementDetails.map(oed => oed.unit && oed.unit.value).filter(a => a != undefined).filter(distinctFilter).join(",");
    s +=  [intent+label,status,notations,units,isMod].join(";") + "\n";
    ei.subExportItems.forEach(eis => s = this.writeExport(eis,s,level+1));
    return s;
  }

  private getRecursive(ei:ExportItem):BehaviorSubject<boolean>{   
    let s = new BehaviorSubject<boolean>(false);
    this.informationQueryService.get(ei.treeItem.element.value).pipe(first()).subscribe(i => ei.ontologyElementDetails = i);
    this.ontologyAccessService.getSubItems$(ei.treeItem.element.value).pipe(first()).subscribe(tias => {
      let subs: Subject<boolean>[] = [];
      tias.forEach(t => {
        let newEi:ExportItem = {
          treeItem:t, 
          ontologyElementDetails:[],
          subExportItems:[]
        };
        ei.subExportItems.push(newEi);
        subs.push(this.getRecursive(newEi));
      });
      combineLatest(subs).subscribe(next => {
        if (!next.includes(false)) s.next(true);
      });
      if (tias.length == 0) s.next(true);
    }); 
    return s;
  }
}

export interface ExportItem {
  treeItem: TreeItem,
  ontologyElementDetails: OntologyElementDetails[],
  subExportItems: ExportItem[]
}