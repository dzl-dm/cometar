
import logging
import re
import html
from datetime import date, timedelta
from unittest import result

from .snippets import get_html
from ..mylog import get_mylog

logger = logging.getLogger(__name__)

def get_commits_options():
    return get_html('''<style>
            div.container {display:flex;flex-direction:column;height:100%}
            div.list_options {display:flex;flex-direction:row;border:10px solid #0492D0;align-items: center}
            iframe#commits_list_iframe {flex-grow:1}
        </style><script>
            function daterangechange(event) {
                var f = document.getElementById("date_from").value;
                var t = document.getElementById("date_to").value;
                document.getElementById("show_commits_list_link").href="/rest/query/commits/list?date_from="+f+"&date_to="+t;
                document.getElementById("show_commits_diff_ttl_link").href="/rest/query/commits/diff_ttl?date_from="+f+"&date_to="+t;
            }
            window.addEventListener("load", function(event) {
                daterangechange()
            });
        </script>''','''
        <div class="list_options">
            <div id="from_div">
                From: <input type="date" id="date_from" name="from" min="2016-01-01" value="{one_month_ago}" onchange="daterangechange(event);"/>
            </div>
            <div id="to_div">
                To: <input type="date" id="date_to" name="to" min="2016-01-01" value="{today}" onchange="daterangechange(event);"/>
            </div>
            <a id="show_commits_list_link" href="/rest/query/commits/list" target="commits_list_iframe">Show commits</a>
        </div>
        <iframe src="/rest/query/commits/list?date_from={one_month_ago}&date_to={today}" id="commits_list_iframe" name="commits_list_iframe"></iframe>
        '''.format(
            today=date.today().strftime("%Y-%m-%d"),
            one_month_ago=(date.today() - timedelta(days=30)).strftime("%Y-%m-%d")
        ))

def get_commits_list(commits_list):
    result_list = ""
    for commit in commits_list:
        result_list += '''
            <div class="commit">
                <div class="meta">
                    <div>ID: {ci}</div>
                    <div>Author: {a}</div>
                    <div>Mail: {am}</div>
                    <div>Date: {d}</div>
                    <div class="commit_message">Message: {cm}</div>
                </div>
                <div class="menu">
                    <a href="/rest/query/commits/rdf_verification/{ci}" target="commit_details_iframe">Verify</a>
                    <a href="/rest/query/commits/diff_text/{ci}" target="commit_details_iframe">Text Diff</a>
                    <a href="/rest/query/commits/diff_rdf/{ci}" target="commit_details_iframe">RDF Diff</a>
                    <a href="/rest/query/commits/diff_ttl/{ci}" target="commit_details_iframe">TTL</a>
                </div>
            </div>
            '''.format(
                ci=commit["id"],
                a=commit["author"],
                am=commit["author_mail"],
                d=commit["date"],
                cm=commit["message"]
            )
    return get_html('''<style>
            div.container {flex-direction:row}
            div.meta {padding:10px;flex-grow:1}
            div.commit {display:flex;flex-direction:row;border:1px solid white;background-color:white}
            div.commit:hover {border:1px solid #BBB}
            div.menu {width:200px;display:flex;flex-direction:column;background-color:#0492D0;flex-shrink:0}
            div.commit_message {white-space: pre-wrap;}
            div.commit_container {display:flex;flex-direction:row;height:100%;width:100%}
            div.commit_list {display:flex;flex-direction:column;width:570px;flex-grow:0;max-height:100%;overflow-y:scroll}
            div.commit_details {display:flex;flex-basis:400px;height:100%;flex-grow:1}
            iframe#commit_details_iframe {width:100%;height:100%;overflow:scroll}
        </style>''','''
        <div class="commit_list">
            {li}
        </div>
        <div class="commit_details">
            <iframe src="" id="commit_details_iframe" name="commit_details_iframe"></iframe>
        </div>
        '''.format(li=result_list))

def get_text_diff_html(diff_string,heading=''):
    re_removed = re.compile(r"\[\-(.*)\-\]")
    re_added = re.compile(r"\{\+(.*)\+\}")
    git_diff_html = html.escape(diff_string.encode('utf-8', 'replace').decode())
    git_diff_html = re.sub(re_removed, r'<span style="background-color:#F5B7B1;font-weight:bold;padding:2px">\1</span>',git_diff_html)
    git_diff_html = re.sub(re_added, r'<span style="background-color:#ABEBC6;font-weight:bold;padding:2px">\1</span>',git_diff_html)
    return get_html("<style>div.container {background-color:white}</style>",'<pre>'+git_diff_html+"</pre>",heading)

def get_rdf_diff_html(diff_result,heading=""):
    result_rows=""
    for row in diff_result:
        html_class = "removed"
        if row["add_or_remove"]["value"] == "added":
            html_class = "added"
        result_rows += '''
            <tr class="{c}">
                <td>{sv}</td>
                <td>{pv}</td>
                <td>{ol}</td>
                <td>{ov}</td>
            </tr>
        '''.format(
            c=html_class,
            sv=row["subject"]["value"],
            pv=row["predicate"]["value"],
            ol=row["object"]["xml:lang"] if "xml:lang" in row["object"].keys() else "",
            ov=row["object"]["value"]
        )
    result_table='''
        <table>
            <tr><th>Element</th><th>Property</th><th>Language</th><th>Value</th></tr>
            {rows}
        </table>
    '''.format(rows=result_rows)
    return get_html('''
        <style>
            div.container {background-color:white}
            tr.added {background-color:#ABEBC6}
            tr.removed {background-color:#F5B7B1}
            td {padding:5px}
            table {border-collapse: collapse;}
        </style>''',result_table,
        heading
    )

def get_rdf_ttl_html(ttl_string,heading=''):
    return get_html('''
        <style>
            div.container {background-color:white}
        </style>''',
        '<pre>'+html.escape(ttl_string)+"</pre>",
        heading)
