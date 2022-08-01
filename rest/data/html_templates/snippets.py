from ..mylog import get_mylog


html_template = '''
<html>
    <head>
        {main_style}
        {head}
    </head>
    <body>
        <div class="header">
            <h1>{heading}</h1>
            <div>{messages}</div>
        </div>
        <div class="container">
            {body}
        </div>
    </body>
'''

main_style = '''
<style>
    body {
        background-color: white;
        margin:0px;
        height:100%;
        display:flex;
        flex-direction:column;
    }
    div.header {
        max-height:40%;
        overflow:auto;
        flex-shrink:0;
        border-bottom: 1px solid #0492D0;
    }
    div.header h1:empty, div.header div:empty {
        display:none
    }
    div.container {
        background-color: #0492D0;
        width: 100%;
        padding: 10px;
        display:flex;
        flex-direction:column;
        flex-grow:1;
        overflow:auto
    }
    div {
        box-sizing: border-box;
    }
    iframe {
        border: 1px solid black;
        background-color:white;
    }
    pre {
        background-color:white;
    }
    input[type=date], input[type=text] {
        height:30px;
        margin-left:5px;
        margin-right:5px;
    }
    a {
        margin-top:5px;
        margin-bottom:5px;
        margin-left:20px;
        margin-right:20px;
        padding:5px;
        text-decoration:none;
        color:white;
        text-align: center;
        cursor: pointer;
        border: none;
        transition: all 0.5s;
        position: relative;
        font-size:20px;
    }
    a::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 1;
        background-color: rgba(255,255,255,0.1);
        transition: all 0.3s;
    }
    a:hover::before {
        opacity: 0 ;
        transform: scale(0.5,0.5);
    }
    a::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 1;
        opacity: 0;
        transition: all 0.3s;
        border: 1px solid rgba(255,255,255,0.5);
        transform: scale(1.2,1.2);
    }
    a:hover::after {
        opacity: 1;
        transform: scale(1,1);
    }
</style>
'''

def get_html(head, body, heading=""):
    return html_template.format(
        main_style = main_style,
        head = head,
        body = body,
        heading=heading,
        messages="<br>".join(get_mylog()),
    )