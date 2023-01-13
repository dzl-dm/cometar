import urllib.parse
from datetime import date, timedelta
from ..ontology import OntologyChangesByDate, AttributeDefinition, ProvenanceCommit, SingleConceptChange, LiteralConceptOldAndNewValue

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
        commits=row["commits"]["value"].split(",")
        for index in range(len(commits)):
            commits[index] = commits[index][-40:]
        lang=row["lang"]["value"] if "lang" in row else ""
        result_rows += '''
            <tr>
                <td><div style="width:120px">{commits}</div></td>
                <td><div style="width:120px">{date}</div></td>
                <td><div>{predicate}</div></td>
                <td><div>{lang}</div></td>
                <td><div>{oldobject}</div></td>
                <td><div>{newobject}</div></td>
            </tr>
        '''.format(
            commits = ",".join(commits),
            date = row["day"]["value"],
            predicate = row["predicate"]["value"],
            lang = lang,
            oldobject = row["oldobject"]["value"] if "oldobject" in row else "",
            newobject = row["newobject"]["value"] if "newobject" in row else "")
    result_table='''
        <table>
            <tr>
                <th>Commit</th>
                <th>Date</th>
                <th>Predicate</th>
                <th>Language</th>
                <th>Old Object</th>
                <th>New Object</th>
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

def get_literal_change_html(c:LiteralConceptOldAndNewValue):
    result=""
    if c.language:
        result+= c.language+": "
    for code in c.codes:
        if code[0] == "equal": 
            result += c.before[code[1]:code[2]]
        elif code[0] == "delete":
            result += "<span class='remove_string'>" + c.before[code[1]:code[2]] + "</span>"
        elif code[0] == "insert":
            result += "<span class='add_string'>" + c.after[code[3]:code[4]] + "</span>"
        elif code[0] == "replace":
            result += "<span class='remove_string'>" + c.before[code[1]:code[2]] + "</span><span class='add_string'>" + c.after[code[3]:code[4]] + "</span>"
    return result

def get_history_by_date_html(data:OntologyChangesByDate,attributes_definitions:list[AttributeDefinition]=[]):
    rows=""
    ad = {a.iri: a.get_single_located_literal("en") for a in attributes_definitions}
    for c_index,(date,subjects) in enumerate(data.changes.items()):
        commits:set[ProvenanceCommit]|list[ProvenanceCommit]=set()
        for s_index,(subject_iri,changes) in enumerate(subjects.items()):
            for p_index,cc in enumerate(changes):
                if isinstance(cc.commit,list):
                    commits = commits.union(cc.commit)
                elif isinstance(cc.commit,ProvenanceCommit):
                    commits.add(cc.commit)
        commits=list(commits)
        commits.sort(key=lambda x:x.enddate.isoformat(),reverse=True)
        for s_index,(subject_iri,subject_changes) in enumerate(subjects.items()):
            #changes.sort(key=(lambda x:(x.commit.enddate.isoformat())),reverse=True)
            for p_index,cc in enumerate(subject_changes):  
                commits_paragraphs_template='''
<p>{id}<br>
<b>{date}</b>: {message}</p>'''   
                commit_column_template='''
    <td class='date_column {even_or_odd}' rowspan='{rowspan}'>
        <div>
            <p>{date}</p>
            Commits: {commits_paragraphs}
        </div>
    </td>
'''
                rows+='''
<tr>
    {commit_column}
    <td class='subject_column {subject_column_even_or_odd}'>
        <div>{subject_label}</div>
    </td>
    <td>
        <div>{predicate_label}</div>
    </td>
    <td class='{object_column_class}'>
        <div>{object_label}</div>
    </td>
</tr>'''.format(
    commit_column=commit_column_template.format(
        commits_paragraphs="".join([commits_paragraphs_template.format(
                id=c.commitid[-40:],
                date=c.enddate.replace(tzinfo=None).isoformat()[len(date)+1:].replace("T"," "),
                message=c.message
            ) for c in commits]),
        even_or_odd="odd" if c_index%2 == 1 else "even",
        rowspan=str(sum([len(s) for k,s in subjects.items()])),
        date=date
        ) if p_index == 0 and s_index == 0 else "",
    subject_column_even_or_odd="odd" if s_index%2 == 1 else "even",
    subject_label=cc.subject.get_single_located_literal("en") if p_index == 0 else "",
    predicate_label=ad.get(cc.predicate.iri) or cc.predicate.iri,
    object_column_class=("added" if cc.new else "removed") if isinstance(cc,SingleConceptChange) else "changed",
    object_label=cc.predicate.get_single_located_literal("all",tagged=True) if isinstance(cc,SingleConceptChange) else (get_literal_change_html(cc) if isinstance(cc,LiteralConceptOldAndNewValue) else "")
) 
    return get_html('''
<style>
    td {
        vertical-align:top;
    }
    td.added {
        color:green;
    }
    td.removed {
        color:red;
    }
    tr td.odd {
        background-color:#FFF;
    }
    tr td.even {
        background-color:#EEE;
    }
    .date_column div {
        position: -webkit-sticky;
        position: sticky;
        top:52px;
        min-width:350px;
        width:350px;
        word-break:break-word;
        overflow: auto;
        box-sizing: border-box;
        max-height:calc(100vh - 70px);
    }
    tbody td.date_column {
        position: -webkit-sticky;
        position: sticky;
        left:0px; 
    }
    tbody td.subject_column {
        position: -webkit-sticky;
        position: sticky;
        left:150px; 
    }
    span.add_string {
        color:green;
        text-decoration: underline;
        font-weight:bold;
    }
    span.remove_string {
        color:red;
        text-decoration: line-through;
        font-weight:bold;
    }
</style>''','''
<table>
    <thead><tr>
        <th class="date_column">Date</th>
        <th class="subject_column">Subject</th>
        <th>Predicate</th>
        <th>Value</th>
    </tr></thead>
    <tbody>{rows}</tbody>
</table>
    '''.format(rows=rows))