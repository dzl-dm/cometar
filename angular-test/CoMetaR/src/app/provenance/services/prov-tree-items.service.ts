import { Injectable } from '@angular/core';
import { ReplaySubject, BehaviorSubject, Observable, of } from 'rxjs';
import { TreeItemAttributes } from 'src/app/core/services/queries/treeitems.service';
import { ProvTreeItemsQueryService, ProvTreeItemAttributes } from './queries/prov-tree-items-query.service';
import { TreeStyleService, TreeItemIcon, TreeItemStyle } from 'src/app/core/services/tree-style.service';
import { TreeDataService } from 'src/app/core/services/tree-data.service';

@Injectable({
  providedIn: 'root'
})
export class ProvTreeItemsService {

  constructor(
    private provItemsQueryService: ProvTreeItemsQueryService,
    private treeStyleService: TreeStyleService,
    private treeDataService: TreeDataService
  ) { 
    this.treeStyleService.addTreeItemStyles(this.treeItemStyles$);
    this.provItemsQueryService.get().subscribe((ptias) => {
        this.addedTreeItems=[];
        this.movedTreeItems=[];
        this.removedTreeItems=[];
        let tempElement;
        let tempRemovedTreeItems:ProvParentOperation[] = [];
        let tempAddedTreeItems:ProvParentOperation[] = [];
        let tempMovedTreeItems:ProvParentOperation[] = [];
        ptias.forEach(ptia => {
            let label = ptia.label&&ptia.label.value||ptia.lastlabel&&ptia.lastlabel.value;
            if (!tempElement || ptia.element.value != tempElement) {
                this.concatProvTreeItems(tempAddedTreeItems,tempMovedTreeItems,tempRemovedTreeItems);
                tempRemovedTreeItems = [];
                tempAddedTreeItems = [];
                tempMovedTreeItems = [];
                tempElement = ptia.element.value;
            }
            if (ptia.addorremove.value == "http://purl.org/vocab/changeset/schema#addition") {
                let negationremove = tempRemovedTreeItems.filter(r => r.oldparent == ptia.parent.value);
                let negationmove = tempMovedTreeItems.filter(r => r.oldparent == ptia.parent.value);
                if (negationremove.length > 0) tempRemovedTreeItems.splice(tempRemovedTreeItems.indexOf(negationremove[0]),1);
                else if (negationmove.length > 0) {
                    tempAddedTreeItems.push({
                        element: tempElement,
                        newparent: negationmove[0].newparent,
                        date: negationmove[0].date,
                        label,
                        newparentlabel: negationmove[0].newparentlabel
                    });
                    tempMovedTreeItems.splice(tempMovedTreeItems.indexOf(negationmove[0]),1);
                }
                else if (tempRemovedTreeItems.length > 0){
                    let lastremove;
                    if (tempMovedTreeItems.length > 0) lastremove = tempMovedTreeItems[0];
                    else lastremove = tempRemovedTreeItems[tempRemovedTreeItems.length-1];
                    tempMovedTreeItems[0]={
                        element: tempElement,
                        newparent: ptia.parent.value,
                        oldparent: lastremove.oldparent,
                        date: ptia.date.value.toLocaleDateString(),
                        label,
                        newparentlabel: ptia.parentlabel&&ptia.parentlabel.value,
                        oldparentlabel: lastremove.oldparentlabel
                    };
                    tempRemovedTreeItems.splice(tempRemovedTreeItems.length-1,1);
                }
                else tempAddedTreeItems.push({
                    element: tempElement,
                    newparent: ptia.parent.value,
                    date: ptia.date.value.toLocaleDateString(),
                    label,
                    newparentlabel: ptia.parentlabel&&ptia.parentlabel.value
                })
            }
            if (ptia.addorremove.value == "http://purl.org/vocab/changeset/schema#removal") {
                let negation = tempAddedTreeItems.filter(r => r.newparent == ptia.parent.value);
                let negationmove = tempMovedTreeItems.filter(r => r.newparent == ptia.parent.value);
                if (negation.length > 0) tempAddedTreeItems.splice(tempAddedTreeItems.indexOf(negation[0]),1); 
                else if (negationmove.length > 0) {
                    tempRemovedTreeItems.push({
                        element: tempElement,
                        oldparent: negationmove[0].oldparent,
                        date: negationmove[0].date,
                        label,
                        oldparentlabel: negationmove[0].oldparentlabel
                    });
                    tempMovedTreeItems.splice(tempMovedTreeItems.indexOf(negationmove[0]),1);
                }                   
                else if (tempAddedTreeItems.length > 0){
                    let lastadd;
                    if (tempMovedTreeItems.length > 0) lastadd = tempMovedTreeItems[0];
                    else lastadd = tempAddedTreeItems[tempAddedTreeItems.length-1];
                    tempMovedTreeItems[0]={
                        element: tempElement,
                        newparent: lastadd.newparent,
                        oldparent: ptia.parent.value,
                        date: ptia.date.value.toLocaleDateString(),
                        label,
                        newparentlabel: lastadd.newparentlabel,
                        oldparentlabel: ptia.parentlabel&&ptia.parentlabel.value
                    };
                    tempAddedTreeItems.splice(tempAddedTreeItems.length-1,1);
                }
                else tempRemovedTreeItems.push({
                    element: tempElement,
                    oldparent: ptia.parent.value,
                    date: ptia.date.value.toLocaleDateString(),
                    label,
                    oldparentlabel: ptia.parentlabel&&ptia.parentlabel.value
                })
            }
        });
        this.concatProvTreeItems(tempAddedTreeItems,tempMovedTreeItems,tempRemovedTreeItems);
        this.treeItemStyles = [];
        this.treeDataService.setGhostTreeItems(this.removedTreeItems.concat(this.movedTreeItems).map(r=>{
            return {
                element: {value: r.element},
                hasChildren: {value:false},
                isModifier: {value:false},
                label: {value:r.label||r.element,"xml:lang":'en'},
                type: {value:"http://www.w3.org/2004/02/skos/core#Concept"},
                ghostItemParent: r.oldparent
            }})
        );
        let addBubbleIcon:TreeItemIcon = {
            type: "dot",
            id: "prov_addition_bubble",
            "background-color": "#71E161",
            description: "There were COUNTER sub-elements added."
        };
        let moveBubbleIcon:TreeItemIcon = {
            type: "dot",
            id: "prov_move_bubble",
            "background-color": "#FFEB0F",
            description: "There were COUNTER sub-elements moved."
        }
        let removeBubbleIcon:TreeItemIcon = {
            type: "dot",
            id: "prov_removal_bubble",
            "background-color": "#FFBFBF",
            description: "There were COUNTER sub-elements removed."
        }

        this.treeItemStyles = this.treeItemStyles.concat(this.addedTreeItems.map(a => {
            let style = this.treeStyleService.getEmptyStyle(a.element);
            style.icons = [{
                id: "prov_addition",
                type: "chip",
                "background-color": "#71E161",
                text: "added",
                "bubble-up": addBubbleIcon,
                description: "This item has been added on "+a.date+"."
            }]
            return style;
        }));

        this.treeItemStyles = this.treeItemStyles.concat(this.movedTreeItems.map(m => {
            let style = this.treeStyleService.getEmptyStyle(m.element);
            style.icons = [{
                id: "prov_move",
                type: "chip",
                "background-color": "#FFEB0F",
                text: "moved",
                "bubble-up": moveBubbleIcon,
                description: "This item has been moved"+(m.oldparentlabel?" from \""+m.oldparentlabel+"\"":"")+(m.newparentlabel?" to \""+m.newparentlabel+"\"":"")+" on "+m.date+"."
            }]
            return style;
        }));

        this.treeItemStyles = this.treeItemStyles.concat(this.removedTreeItems.map(r => {
            let style = this.treeStyleService.getEmptyStyle(r.element);
            style["text-decoration"] = "line-through";
            style.icons = [{
                type: "chip",
                text: "removed",
                "background-color": "#FFBFBF",
                id: "prov_removal",
                "bubble-up": removeBubbleIcon,
                description: "This item has been removed on "+r.date+"."
            }]
            return style;
        }));

        this.treeItemStyles$.next(this.treeItemStyles);
    });
  }

  private concatProvTreeItems(tempAddedTreeItems: ProvParentOperation[], tempMovedTreeItems: ProvParentOperation[], tempRemovedTreeItems:ProvParentOperation[]){
    this.removedTreeItems = this.removedTreeItems.concat(tempRemovedTreeItems.filter((value, index, self) => {
        return self.map(a => a.element).indexOf(value.element) === index;
    }));
    this.addedTreeItems = this.addedTreeItems.concat(tempAddedTreeItems.filter((value, index, self) => {
        return self.map(a => a.element).indexOf(value.element) === index;
    }));
    this.movedTreeItems = this.movedTreeItems.concat(tempMovedTreeItems.filter((value, index, self) => {
        return self.map(a => a.element).indexOf(value.element) === index;
    }));
  }

  private removedTreeItems:ProvParentOperation[] = [];
  private addedTreeItems:ProvParentOperation[] = [];
  private movedTreeItems:ProvParentOperation[] = [];

  private treeItemStyles:TreeItemStyle[];
  private treeItemStyles$ = new BehaviorSubject<TreeItemStyle[]>([]);

  public setProvTreeItemAttributes(from?:Date, until?:Date, commits?:string[]) {
    from =from || new Date(Date.now());
    until=until || new Date(Date.now());
    until.setHours(0);until.setSeconds(0);until.setMilliseconds(0);until.setMinutes(0); //else it refreshes endlessly
    this.provItemsQueryService.setDate(from);
  }
}

export interface ProvParentOperation {
    element:string,
    label?:string,
    oldparent?:string,
    oldparentlabel?:string,
    newparent?:string,
    newparentlabel?:string,
    date:string
}
