import getTopElements from "../queries/getTopElements";
import getWholeTree from "../queries/getWholeTree";
import getPathPartsOfMultipleElements from "../queries/getPathPartsOfMultipleElements";
import TreeItem from "./TreeItem";
import Observer from "./Observer";

class Tree {
    private static domo = $(
`<div id='conceptTree'>
	<div id='searchDiv'> 
		<form> 
			<input type='text' id='searchPatternText'/> 
			<input type='submit' value='search' id='searchSubmitButton'/> 
		</form> 
	</div> 
    <div class='treeItemList'/>
</div>`);
    public static loadingStatus = $.Deferred();
    static init(){       
        Observer.observeTree(this.domo, (addedTreeItem)=>{
			TreeItem.applyEvents(addedTreeItem);
			let iri:any = addedTreeItem.attr("rdf-iri");
			this.treeItems[iri].fillTreeItemInformation();
        });

		getWholeTree(({element,subelement}) => {
			if (!this.treeItems[element]) this.treeItems[element] = new TreeItem(element);
			if (!this.treeItems[subelement]) this.treeItems[subelement] = new TreeItem(subelement);
			this.treeItems[element].putSubTreeItem(this.treeItems[subelement]);
		}).then(()=>getTopElements((r) => {
			this.domo.children('.treeItemList').append(this.treeItems[r].getDomoTree());
		})).then(this.loadingStatus.resolve);

		let timeout;
		this.domo.find("#searchSubmitButton").click((e)=>{
			e.stopPropagation();
			clearTimeout(timeout);
			timeout = setTimeout(()=>this.openSelectMark({
				IRIs: this.getSearchResult(),
				hideOtherElements : true
			}),200);
		});
		this.domo.find("#searchPatternText").keyup((e)=>{
			clearTimeout(timeout);
			timeout = setTimeout(()=>this.openSelectMark({
				IRIs: this.getSearchResult(),
				hideOtherElements : true
			}),200);			
		})

        return this.loadingStatus;
	}
	static treeItems:TreeItem[] = [];
    static getDomo(){
        return this.domo;
    }
    static getTreeItemDomo = (iri)=>$(`.treeItem[rdf-iri='${iri}']`);

	private static getSearchResult(){
		let pattern = this.domo.find("#searchPatternText").val().toString().toUpperCase();
		let matchingTreeItemIRIs:string[] = [];
		if (pattern == "") return matchingTreeItemIRIs;
		this.domo.find(".treeItemTitleDiv").each((index,element)=>{
			if($(element).text().toUpperCase().match(new RegExp(pattern))){
				matchingTreeItemIRIs.push($(element).closest(".treeItem").attr("rdf-iri"));
			}
		});
		return matchingTreeItemIRIs;
	}



	/*
		a.IRIs, a.dontUnmark, a.oneSelectedIri, a.dontClosePaths, a.markMapping, a.descriptions, a.keepDescriptions, a.openPaths, a.growWidth
	*/
	/**
	 * 
	 * @param options.IRIs
	 * @param options.closeOtherPaths
	 * @param options.hideOtherElements
	 */
    static openSelectMark(options){
		$(".treeItem.hidden").removeClass("hidden");
		$(".treeItem.selected").removeClass("selected");

		if (!Array.isArray(options.IRIs)) options.IRIs=options.IRIs.split(";");
		if (options.IRIs.length==0||options.IRIs[0]==undefined) return;

		let closeOtherPaths = options.closeOtherPaths && options.closeOtherPaths != false;
		let hideOtherElements = options.hideOtherElements && options.hideOtherElements == true;

		let selectedElements=$();
		for (let iri of options.IRIs){
			selectedElements = selectedElements.add(this.getTreeItemDomo(iri));
		}
		selectedElements.addClass("selected");
		let pathElements = selectedElements.parents(".treeItem").addBack();
		let toOpen = pathElements.filter(".collapsed");
		let toClose = closeOtherPaths?$(".treeItem.expanded").not(pathElements) : $();
		let toHide = hideOtherElements?$(".treeItem").not(pathElements) : $();

		toOpen.add(toClose).each((index,element)=>{
			$(element).click();
		});
		toHide.each((index,element)=>{
			$(element).addClass("hidden");
		});
	}
}



export default Tree;