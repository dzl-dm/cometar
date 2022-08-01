
import logging
import re
import html
from datetime import date, timedelta
from .snippets import get_html

def get_console_html():
    return get_html(
        '''<style>
            .container iframe {min-height:500px}
        </style>''','''
        <h3>Commits</h3>
        <iframe src="/rest/query/commits"></iframe>
        <h3>Search</h3>
        <iframe src="/rest/query/search"></iframe>
        <h3>History</h3>
        <iframe src="/rest/query/history"></iframe>
        '''
    )