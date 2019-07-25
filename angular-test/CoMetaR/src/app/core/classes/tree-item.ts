import { JSONResponsePartUriString, JSONResponsePartLangString, JSONResponsePartBoolean, JSONResponsePartString, JSONResponsePartArray } from 'src/app/services/data.service';
import { TreeItemInformation } from '../services/ontology-data.service';

export class TreeItem {
    constructor(is:TreeItemInformation){
        this.element = is.element;
        this.label = is.label;
        this.displayLabel = is.displaylabel? is.displaylabel : is.label;
        this.notations = is.notations;
        this.type = is.type;
        this.isModifier = is.isModifier;
        this.status = is.status;
    }
    element:JSONResponsePartUriString;
    type:JSONResponsePartUriString;
    label:JSONResponsePartLangString;
    displayLabel:JSONResponsePartLangString;
    isModifier:JSONResponsePartBoolean;
    notations:JSONResponsePartArray;
    status?:JSONResponsePartString;
    ghostParents:JSONResponsePartUriString[]=[];
    children:TreeItem[]=[];
    parents:TreeItem[]=[];

    public hasChildren(){
        return this.children.length>0;
    }
}
