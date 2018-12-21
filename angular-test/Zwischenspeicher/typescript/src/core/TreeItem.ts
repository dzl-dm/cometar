import getTreeItemInformation from "../queries/getTreeItemInformation";
import c from "../Configuration";

class TreeItem {
    iri:string;
    private subTreeItems:TreeItem[] = [];
    private loadingStatus:JQuery.jqXHR;
    private label="";
    private hasChildren=false;
    private isModifier=false;
    private status="";

    getNewDomo(){
        let domo = $(`<div class='treeItem ${this.isModifier?`isModifier'`:``} ${this.hasChildren?`collapsed`:``}' rdf-iri='${this.iri}'>
            <div class='treeItemHeadingDiv'>
                <div class='treeItemExpandLineDiv'/>
                <div class='treeItemExpandDiv'/>
                <div class='treeItemTitleDiv'>${this.label}</div>
                <div class='treeItemStatusDiv ${this.status}'>${this.status}</div>
            </div>
            <div class='treeItemDescriptionDiv'/>
            <div class='treeItemList'>
                <div class='treeItemExpandLineDiv'/>
            </div>
        </div>`);
        domo.children(".treeItemList").hide();
        return domo;
    }
    constructor(iri){
        this.iri = iri;
    }

    public fillTreeItemInformation(){
        if (this.loadingStatus) return;
        this.loadingStatus = getTreeItemInformation(this.iri,(r)=> this.setInformation(r));
    }

    public getDomo() { return $(`.treeItem[rdf-iri='${this.iri}']`) };
    
    /**
     * 
     * @param {string} information.label
     * @param {boolean} information.hasChildren
     * @param {boolean} information.isModifier
     * @param {string} information.status
     */
    private setInformation(information){
        let {label,hasChildren,isModifier,status} = information;
        if (label) {
            this.label = label;
            this.getDomo().find('.treeItemTitleDiv:first').append(label);
        }
        if (isModifier){
            this.isModifier=true;
            this.getDomo().addClass("isModifier");
        }
        if (status){
            this.status = status;
            this.getDomo().find('.treeItemStatusDiv:first').addClass(status).html(status);
        }
        if (hasChildren){
            this.hasChildren=true;
            this.getDomo().not(".expanded").addClass("collapsed");
        }
    }

    public putSubTreeItem(ti){
        if (this.subTreeItems.includes(ti)) return;
        this.subTreeItems.push(ti);
        this.setInformation({hasChildren:true});
    }
    public getDomoTree(){
        let domo = this.getNewDomo();
        for (let ti of this.subTreeItems){
            domo.children(".treeItemList").append(ti.getDomoTree());
        }
        return domo;
    }

    private static expand(tidomo:JQuery<any>){
        if (tidomo.hasClass("collapsed")){
            tidomo
                .removeClass("collapsed")
                .addClass("expanded")
                .children(".treeItemList")
                .toggleClass("fading")
                .show(200,function(){$(this).toggleClass("fading")});
            return true;
        }
        return false;
    }
    private static collapse(tidomo:JQuery<any>){
        if (tidomo.hasClass("expanded")){
            tidomo
                .removeClass("expanded")
                .addClass("collapsed")
                .children(".treeItemList")
                .toggleClass("fading")
                .hide(200,function(){$(this).toggleClass("fading")});
            return true;
        }
        return false;
    }
    public static applyEvents(tidomos:JQuery<any>){
        $.each(tidomos,(index,element)=> {
            element = $(element);
            element.click((e)=>{
                e.stopPropagation();
                this.expand(element) || this.collapse(element);
            })
            .find(".treeItemTitleDiv:first").click((e)=>{
                e.stopPropagation();
                //this.expand(element);

                let newhash = element.attr("rdf-iri");
                $.each(c.urlShorts,(key,value)=>newhash = newhash.replace(new RegExp(key, "g"), value));
                location.hash = newhash;
            })
        });
    }
}

export default TreeItem;