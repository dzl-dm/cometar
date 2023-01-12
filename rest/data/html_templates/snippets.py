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
        display:flex;
        flex-direction:column;
        flex-grow:1;
        overflow:auto;
        overflow-x:auto;
        overflow-y:auto;
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
    a.button {
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
    a.button::before {
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
    a.button:hover::before {
        opacity: 0 ;
        transform: scale(0.5,0.5);
    }
    a.button::after {
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
    a.button:hover::after {
        opacity: 1;
        transform: scale(1,1);
    }
    html, div {
        scroll-behavior: smooth;
    }
    body, table, tbody {
        margin:0px;
        padding:0px;
        left:0px;
        top:0px;
    }
    table {
        border-spacing: 0px;
    }
    tr {
        overflow: hidden;
        height: calc( 2em + 20px );
        margin:0px;
        border:0px;
    }
    td {
        margin:0px;
        border:0px;
        padding:0px;
        border-right:1px solid white;
    }
    tr:nth-child(even) td, th {
        background-color:#FFF;
    }
    tr:nth-child(odd) td {
        background-color:#EEE;
    }
    tr pre {
        background-color:inherit;
    }
    tr td div {
        max-height:2em;
        overflow-y:auto;
        padding:10px;
        margin:0px;
        box-sizing:content-box;
        min-width:200px;
        max-width:400px;
    }
    tr td div pre, tr td div span {
        margin:0px;
        white-space: pre-wrap;
    }
    .anchor {
        position:absolute;
        top:-50vh;
    }
    .wrapper {
        width:100%;
        height:100%;
        position:relative;
        overflow-x:scroll;
    }
    thead tr {
        position: -webkit-sticky;
        position: sticky;
        top:0px;
        z-index:10;
    }
    table.stickyheader tbody td:first-of-type, thead th:first-of-type {
        position: -webkit-sticky;
        position: sticky;
        left:0px;
    }
</style>
'''

def get_html(head, body, heading="", nostyle=False):
    return html_template.format(
        main_style = main_style if not nostyle else "",
        head = head,
        body = body,
        heading=heading,
        messages="<br>".join(get_mylog()),
    )