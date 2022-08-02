
from .snippets import get_html

def get_provenance_html():
    return get_html('''
        <style>
            .container {flex-direction:column}
            #provenance_iframe {flex-grow:1}
        </style>''','''
        <div class="actions">
            <a href="/rest/admin/update_provenance" target="provenance_iframe">Update Provenance</a>
            <a href="/rest/admin/fuseki_load_provenance" target="provenance_iframe">Load Provenance</a>
        </div>
        <iframe src="" id="provenance_iframe" name="provenance_iframe"></iframe>
    ''')