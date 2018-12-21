import Tree from "./Tree";
import c from "../Configuration";

class Observer {
    static init(){
        Tree.loadingStatus.then(()=>Tree.openSelectMark({
            IRIs: this.getCurrentConceptIri()
        }));
        window.onhashchange=(ev:HashChangeEvent)=>{
            Tree.loadingStatus.then(()=>Tree.openSelectMark({
                IRIs: this.getCurrentConceptIri()
            }));
        }
    }
    static observeTree(domo, callback:(addedTreeItem:JQuery<any>)=>void){
        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if ($(mutation.target).hasClass("treeItemList") && mutation.type == "childList"){
                    $(mutation.addedNodes).find(".treeItem").addBack().each((index,element)=>callback($(element)));
                }
            });
        });
        observer.observe(domo[0], { 
            childList: true, 
            subtree: true
        });
    }
	static getCurrentConceptIri() {
        let iri = location.hash.indexOf("?")>-1?location.hash.substr(1,location.hash.indexOf("?")-1):location.hash.substr(1);
        $.each(c.urlShorts,(key,value)=>iri = iri.replace(new RegExp(value, "g"), key));
        return iri;
	}
	static getQueryParameter(name) {
		let url = window.location.href;
		name = name.replace(/[\[\]]/g, "\\$&");
		var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
			results = regex.exec(url);
		if (!results) return null;
		if (!results[2]) return '';
		return decodeURIComponent(results[2].replace(/\+/g, " "));
	}
}

export default Observer;