import { Injectable } from '@angular/core';
import { first } from 'rxjs/operators';
import { OntologyAccessService } from 'src/app/core/services/ontology-access.service';
import { TreeItem } from 'src/app/core/classes/tree-item';
import { TreeDataService } from 'src/app/core/services/tree-data.service';
import { combineLatest } from 'rxjs';
import { OntologyElementDetails } from './queries/information-query.service';

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  private exportItem:ExportItem;

  constructor(
    public treeDataService: TreeDataService,
    private ontologyAccessService: OntologyAccessService
  ) { }

  private exportString="";
  public get(iri:string, exportOptions:{
    status:boolean,
    isModifier:boolean,
    units:boolean,
    codes:boolean,
    intent:boolean,
    additionalInformation:boolean,
    additionalInformationOnly:boolean
  }, callback:(exportString: string)=>void):void {
    
    let o = this.ontologyAccessService.getTreeItem$(iri).pipe(first()).subscribe(ti => {
      let maxDepth = this.getMaxDepth(ti);
      let intent = ";";
      if (exportOptions.intent){for (let i = 1; i < maxDepth; i++){intent+=";"}}
      this.exportString = "label"+intent;
      if (exportOptions.status){this.exportString += "status;";}
      if (exportOptions.codes){this.exportString += "codes;";}
      if (exportOptions.units){this.exportString += "units;";}
      if (exportOptions.isModifier){this.exportString += "is modifier;";}
      if (exportOptions.additionalInformation){this.exportString += "additional information;";}
      this.exportString+="\n";
      this.writeRecursive(ti,maxDepth,exportOptions);
      callback(this.exportString);
    });
  }

  private getMaxDepth(ti:TreeItem):number{
    let depths = [];
    if (ti.children.length === 0){
      return 1;
    }
    for (let child of ti.children){
      depths.push(this.getMaxDepth(child));
    }
    return Math.max(...depths)+1;
  }

  //TODO: Rewrite the export process. TreeItem has to hold many information (e.g. unit) that are only used here.
  //      units and status are based on values in the config.json
  private writeRecursive(ti: TreeItem, maxDepth:number, options:{
    status:boolean,
    isModifier:boolean,
    units:boolean,
    codes:boolean,
    intent:boolean,
    additionalInformation:boolean,
    additionalInformationOnly:boolean
  }, level:number=0) {
    let newLine = "";
    let intentBefore="";
    let intentAfter="";
    if (options.intent){for(let i = 0; i < level; i++) intentBefore+= ";";}
    if (options.intent){for(let i = level+1; i < maxDepth; i++) intentAfter+= ";";}
    let additionalInformationIntent = intentBefore+intentAfter+";";
    let label = ti.label.value;
    newLine += intentBefore+"\""+label+"\""+intentAfter+";";
    if (options.status){
      let status = ti.status?ti.status.value:"";
      newLine += status + ";";
      additionalInformationIntent+=";";
    }
    if (options.codes){
      let notations = ti.notations && ti.notations.value.join(",") || "";
      newLine += notations + ";";
      additionalInformationIntent+=";";
    }
    if (options.units){
      let units = ti.units && ti.units.value.join(",") || "";
      newLine += units + ";";
      additionalInformationIntent+=";";
    }
    if (options.isModifier){
      let isMod = ti.isModifier && ti.isModifier.value == true?"true":"false";
      newLine += isMod + ";"
      additionalInformationIntent+=";";
    }
    combineLatest(
      this.treeDataService.getTreeItemConceptInformation(ti.element.value),
      this.treeDataService.getSearchMatch$(ti.element.value)
    ).subscribe(([cis,sms]) => {
      if (sms.length > 0 || cis.length > 0 || !options.additionalInformationOnly){
        this.exportString += newLine;
      }
      if (options.additionalInformation){
        if (sms.length > 0) {
          this.exportString += "Search: Property; Search: Value;";
        }
        sms.forEach(sm => {
          this.exportString += "\n";
          this.exportString+=additionalInformationIntent;
          this.exportString+=sm.property.value+";"+"\""+sm.value.value+"\";";
        });
        cis.forEach((ci,index) => {
          if (index > 0){this.exportString+=additionalInformationIntent}
          this.exportString += ci.headings.join(";")+";";
          ci.cells.forEach(row => {
            this.exportString += "\n";
            this.exportString+=additionalInformationIntent;
            this.exportString+=row.join(";")+";";
          });
        });
      }
      if (sms.length > 0 || cis.length > 0 || !options.additionalInformationOnly){
        this.exportString += "\n";
      }
      ti.children.forEach(c=>this.writeRecursive(c,maxDepth,options, level+1));
    }).unsubscribe();
  }

  /*public get(iri:string, callback:(exportString: string)=>void):void {
    
    let o = this.ontologyAccessService.getTreeItem$(iri).pipe(first()).subscribe(tis => {
      console.log(tis);
      this.exportItem = { treeItem: tis, subExportItems: [], ontologyElementDetails: [] };
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
    let informationLoaded$ = new BehaviorSubject<boolean>(false);
    this.informationQueryService.get(ei.treeItem.element.value).pipe(first()).subscribe(i => {
      ei.ontologyElementDetails = i;
      informationLoaded$.next(true);
    });
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
      combineLatest(subs.concat(informationLoaded$)).subscribe(next => {
        if (!next.includes(false)) s.next(true);
      });
    }); 
    return s;
  }*/
}

export interface ExportItem {
  treeItem: TreeItem,
  ontologyElementDetails: OntologyElementDetails[],
  subExportItems: ExportItem[]
}