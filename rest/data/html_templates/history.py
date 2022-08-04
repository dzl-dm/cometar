import urllib.parse
from datetime import date, timedelta

from .snippets import get_html

history_default_value="http://data.dzl.de/ont/dwh#Administration"

def get_history_html():
    return get_html('''<style>
            .container {width:100%;height:100%;display:flex;flex-direction:column}
            .container iframe {height:500px}
            .input_container {width:100%;display:flex;flex-direction:row;align-items: center}
            #history_pattern_input {min-width:500px}
        </style><script>
            function historypatternchange(event) {
                var pattern = encodeURIComponent(document.getElementById("history_pattern_input").value);
                document.getElementById("history_link").href="/rest/query/history/concept?iri="+pattern;
            }
            window.addEventListener("load", function(event) {
                historypatternchange()
            });
        </script>''','''
        <div class="input_container">
            <div>History of concept </div>
            <input type="text" value="{input_default}" id="history_pattern_input" onchange="historypatternchange(event);"/>
            <a href="" target="history_iframe" id="history_link">Search</a>
        </div>
        <iframe src="" name="history_iframe"></iframe>'''.format(input_default=history_default_value))

def get_history_concept_html(history_data):
    result_rows=""
    for row in history_data["results"]["bindings"]:
        result_rows += '''
        <tr>
            <td><div style="width:120px">{commit}</div></td>
            <td><div style="width:120px">{date}</div></td>
            <td><div style="width:100px">{addorremove}</div></td>
            <td><div>{subject}</div></td>
            <td><div>{predicate}</div></td>
            <td><div>{object}</div></td>
        </tr>
    '''.format(
        commit = row["commit"]["value"][-40:],
        date = row["date"]["value"][:-6].replace("T"," "),
        addorremove = row["addorremove"]["value"].split("#")[-1],
        subject = row["subject"]["value"],
        predicate = row["predicate"]["value"],
        object = row["object"]["value"])
    result_table='''
        <table>
            <tr>
                <th>Commit</th>
                <th>Date</th>
                <th>Action</th>
                <th>Subject</th>
                <th>Predicate</th>
                <th>Object</th>
            </tr>
            {rows}
        </table>'''.format(rows=result_rows)
    return get_html('''
        <style>
            div.container{
                background-color:white
            }
            td {
                vertical-align:top;
            }
            td div {
                word-wrap: break-word;
                overflow-wrap: break-word;
                padding:5px;
                height:100%;
            }
        </style>''',result_table)