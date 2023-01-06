import urllib.parse
from datetime import date, timedelta

from .snippets import get_html
from .. import ontology

iri_default_value="http://data.dzl.de/ont/dwh#Administration,http://data.dzl.de/ont/dwh#Specimen"

def get_concepts_html():
    return get_html('''<style>
            .container {width:100%;height:100%;display:flex;flex-direction:column}
            .container iframe {height:500px}
            .input_container {width:100%;display:flex;flex-direction:row;align-items: center}
            #iri_input {min-width:500px}
        </style><script>
            function input_change(event) {
                var pattern = encodeURIComponent(document.getElementById("iri_input").value);
                var tree_format = encodeURIComponent(document.getElementById("format_input").checked);
                var include_children = encodeURIComponent(document.getElementById("include_children_input").checked);
                var href="/rest/query/concepts/listing?";
                if (tree_format == "true") {
                    href+="format=tree";
                }
                else {
                    href+="format=list";
                }
                if (include_children == "true") {
                    href+="&include_children=true";
                }
                else {
                    href+="&include_children=false";
                }
                if (pattern != "all") {
                    href+="&iri="+pattern
                }
                document.getElementById("concepts_link").href=href;
            }
            window.addEventListener("load", function(event) {
                input_change()
            });
        </script>''','''
        <div class="input_container">
            <div>Parent Concept (alternative 'all') </div>
            <input type="text" value="{iri_default}" id="iri_input" onchange="input_change(event);"/>
            <input type="checkbox" checked id="format_input" name="tree_format" onchange="input_change(event);">
            <label for="tree_format">Tick for tree format, no tick for list format.</label>
            <input type="checkbox" checked id="include_children_input" name="include_children" onchange="input_change(event);">
            <label for="include_children">Include children.</label>
            <a href="" target="concepts_iframe" id="concepts_link">Load</a>
        </div>
        <iframe src="" name="concepts_iframe"></iframe>'''.format(iri_default=iri_default_value))
        
def get_html_rows(item:ontology.ConceptDetails,attributes:list[ontology.AttributeDefinition],level=0,language:str|None=None):
    result="<tr>"
    result+="<td><div class='anchor' id='"+item.iri+"'></div><div style='padding-left:"+str(level*20+10)+"px'><pre>"+item.getDisplayLabel(language)+"</pre></div></td>"
    result+="<td><pre>"
    if item.tags: 
        for tag in item.tags:
            result += tag.attribute_label
            if tag.is_child_aggregation:
                result += " Children"
            if tag.amount:
                result += ": "+str(tag.amount)
            result+="\n"
    result=result[:-1]
    result+="</pre></td>"
    for attribute in attributes:
        result += "<td><div>"
        if attribute.iri in (
                "http://www.w3.org/2004/02/skos/core#narrower",
                "http://www.w3.org/2004/02/skos/core#broader",
                "http://www.w3.org/2004/02/skos/core#related",
                "http://www.w3.org/1999/02/22-rdf-syntax-ns#partOf",
                "http://www.w3.org/1999/02/22-rdf-syntax-ns#hasPart"
            ):
            for p in item.predicates:
                if p.iri == attribute.iri:
                    for o in p.objects:
                        if isinstance(o,ontology.RDFIriObject):
                            result += "<a href='#{iri}'>{literal}</a><br>".format(iri=o.iri,literal=o.get_located_literal(language))
        else:
            result += "<pre>"
            for p in item.predicates:
                if p.iri == attribute.iri:
                    result += "\n".join(p.get_located_literals("all",tagged=True))
            result += "</pre>"
        result += "</div></td>"
    result+="</tr>"
    if isinstance(item,ontology.ConceptTreeNode):
        item.children.sort(key=(lambda x: x.getDisplayLabel(language).lower()))
        for child in item.children:
            result+=get_html_rows(child,attributes,level+1,language)
    return result

def get_thesaurus_html(concept_list:ontology.ConceptList):
    language = "en"
    concept_list.items.sort(key=(lambda y: y.getDisplayLabel(language).lower()))
    return get_html('''
<style>
    html, div {
        scroll-behavior: smooth;
    }
    body, table, tbody {
        margin:0px;
        padding:0px;
        left:0px;
        top:0px;
    }
    table {
        border-spacing: 0px;
    }
    tr {
        overflow: hidden;
        height: calc( 2em + 20px );
        margin:0px;
        border:0px;
    }
    td {
        margin:0px;
        border:0px;
        padding:0px;
        border-right:1px solid white;
    }
    tr:nth-child(even) td, th {
        background-color:#FFF;
    }
    tr:nth-child(odd) td {
        background-color:#EEE;
    }
    tr td div {
        max-height:2em;
        overflow-y:auto;
        padding:10px;
        margin:0px;
    }
    tr td div pre, td div {
        margin:0px;
        min-width:200px;
        max-width:400px;
        white-space: pre-wrap;
    }
    .anchor {
        position:absolute;
        top:-50vh;
    }
    .wrapper {
        width:100%;
        height:100%;
        position:relative;
        overflow-x:scroll;
    }
    thead tr {
        position: -webkit-sticky;
        position: sticky;
        top:0px;
        z-index:10;
    }
    tbody td:first-of-type, thead th:first-of-type {
        position: -webkit-sticky;
        position: sticky;
        left:0px;
    }
</style>
    ''','''
<div class='wrapper'>
    <table>
    {headings}
    {rows}
    </table>
</div>
    '''.format(
        headings="<thead><th></th><th>Tags</th><th>"+"</th><th>".join([x.get_located_literal(language) for x in concept_list.attributes_definitions])+"</th></thead>",
        rows="<tbody>"+"".join([get_html_rows(x,concept_list.attributes_definitions,0,language) for x in concept_list.items])+"</tbody>"
    ),nostyle=True)