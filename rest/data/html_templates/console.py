
from .snippets import get_html

def get_console_html():
    return get_html(
        '''<style>
            .container iframe {min-height:500px}
        </style>''','''
        <h3>Provenance</h3>
        <iframe src="/rest/admin/provenance"></iframe>
        <h3>Commits</h3>
        <iframe src="/rest/query/commits"></iframe>
        <h3>Search</h3>
        <iframe src="/rest/query/search"></iframe>
        <h3>History</h3>
        <iframe src="/rest/query/history"></iframe>
        '''
    )