
from ..mylog import mylog
from .snippets import get_html

def get_provenance_html(missing_commits,all_commits):
    provenance_buttons="Missing "+str(len(missing_commits))+" out of "+str(len(all_commits))+" commits' provenance data."
    counter = 1
    l=[]
    for c in missing_commits:
        l.append(c)
        if counter > 10 or c == missing_commits[-1]:
            counter = counter-10
            provenance_buttons+='<a href="/rest/admin/update_provenance?date_from='+l[-1]["date"][:10]+" "+l[-1]["date"][11:19]+'&date_to='+l[0]["date"][:10]+" "+l[0]["date"][11:19]+'" target="provenance_iframe">Calc from '+l[-1]["date"][:10]+" until "+l[0]["date"][:10]+'''</a>
            '''
            l=[]
        counter+=1
    return get_html('''
        <style>
            div.container {flex-direction:row}
            div.actions {display:flex;flex-direction:column}
            #provenance_iframe {flex-grow:1}
        </style>''','''
        <div class="actions">
            <a href="/rest/admin/load_provenance" target="provenance_iframe">Load Provenance</a>
            {provenance_buttons}
        </div>
        <iframe src="" id="provenance_iframe" name="provenance_iframe"></iframe>
    '''.format(provenance_buttons=provenance_buttons))