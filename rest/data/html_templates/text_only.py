from html import escape

def get_html(text):
    return '<html><head></head><body><pre>'+escape(text)+'</pre></body></html>'