class Query {
	private static endpoint:string = "https://data.dzl.de/fuseki/cometar_live/query";
	static setEndpoint(e:string) { this.endpoint = e } //"http://localhost:3030/cometar_live/query"
	static readonly prefixes = `PREFIX skos:    <http://www.w3.org/2004/02/skos/core#>
		PREFIX : <http://data.dzl.de/ont/dwh#>
		PREFIX rdf:	<http://www.w3.org/1999/02/22-rdf-syntax-ns#>
		PREFIX owl: <http://www.w3.org/2002/07/owl#>
		PREFIX foaf: <http://xmlns.com/foaf/0.1/>
		PREFIX dc: <http://purl.org/dc/elements/1.1/>  
		PREFIX snomed:    <http://purl.bioontology.org/ontology/SNOMEDCT/>
		PREFIX xsd:	<http://www.w3.org/2001/XMLSchema#>
		PREFIX dwh:    <http://sekmi.de/histream/dwh#>
		PREFIX loinc: <http://loinc.org/owl#>
		PREFIX rdfs:	<http://www.w3.org/2000/01/rdf-schema#> 
		PREFIX prov: 	<http://www.w3.org/ns/prov#>
		PREFIX cs:		<http://purl.org/vocab/changeset/schema#>`;
    static exec(queryString:string, callback: (r:any) => void, async = true):JQuery.jqXHR
	{
        this.startLoading();
		return $.ajax({
            url: `${this.endpoint}?query=${encodeURIComponent(queryString)}`,
			dataType: "json",
			async: async,
			success: function(json){
                $.each(json.results.bindings, function(i, item) {
                    callback(item);
                });
			},
			complete: (j, k) =>
			{
				this.stopLoading();
			}
		}).promise();
	}
	static loadingThings = 0;
	static startLoading(){
		this.loadingThings++;
		$("#loadingPng").addClass("active");
	}
	static stopLoading(){
		this.loadingThings--;
		if (this.loadingThings == 0) {
			$("#loadingPng").removeClass("active");
		}
	}
}

export default Query;