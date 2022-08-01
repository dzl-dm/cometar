
import logging
import re
import html
from datetime import date, timedelta

from .snippets import get_html

def get_search_html():
    return get_html('''
        <style>
            .container iframe {height:500px}
            .input_container {width:100%;display:flex;flex-direction:row;align-items: center}
        </style><script>
            function searchpatternchange(event) {
                var pattern = document.getElementById("search_pattern_input").value;
                document.getElementById("search_link").href="/rest/query/search/"+pattern;
            }
            window.addEventListener("load", function(event) {
                searchpatternchange()
            });
        </script>''',
        '''
        <div class="input_container">
            <div>Search term: </div>
            <input type="text" value="test" id="search_pattern_input" onchange="searchpatternchange(event);"/>
            <a href="" target="search_iframe" id="search_link">Search</a>
        </div>
        <iframe src="" name="search_iframe"></iframe>
        ''',"")

def get_search_pattern_html(r_dict,pattern):
    replace_pattern = re.compile("("+pattern+")", re.IGNORECASE)
    result = '<table>'
    result += "<tr><th>Element</th><th>Property</th><th>Value</th><th>Value Type</th><th>Language</th></tr>"
    for row in r_dict["results"]["bindings"]:
        result += "<tr>"
        result += "<td>"+str(row["element"]["value"])+"</td>"
        result += "<td>"+str(row["property"]["value"])+"</td>"
        row_val = str(row["value"]["value"])
        row_val = re.sub(replace_pattern, r'<span style="color:red;font-weight:bold">\1</span>',row_val)
        result += "<td>"+row_val+"</td>"
        result += "<td>"+str(row["value"]["type"])+"</td>"
        result += "<td>"
        if "xml:lang" in row["value"]:
            result += str(row["value"]["xml:lang"])
        result += "</td>"
        result += "</tr>"
    result += "</table>"
    return result