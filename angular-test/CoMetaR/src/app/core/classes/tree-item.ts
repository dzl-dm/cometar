import { JSONResponsePartUriString, JSONResponsePartLangString, JSONResponsePartBoolean, JSONResponsePartString, JSONResponsePartArray } from 'src/app/services/data.service';
import { TreeItemInformation } from '../services/ontology-data.service';

export class TreeItem {
    constructor(is:TreeItemInformation){
        this.element = is.element;
        this.label = is.label;
        this.notations = is.notations;
        this.type = is.type;
        this.isModifier = is.isModifier;
        this.status = is.status;
    }
    element:JSONResponsePartUriString;
    type:JSONResponsePartUriString;
    label:JSONResponsePartLangString;
    isModifier:JSONResponsePartBoolean;
    notations:JSONResponsePartArray;
    status?:JSONResponsePartString;
    isGhostItem:boolean=false;
    children:TreeItem[]=[];
    parents:TreeItem[]=[];

    public hasChildren(){
        return this.children.length>0;
    }
}
