
from datetime import datetime
from inspect import stack
import logging
logger = logging.getLogger(__name__)

log=[]
def reset_mylog():
    global log
    log=[]
def mylog(s:str):
    depth = len(stack()) - 20
    s = datetime.now().strftime("%Y-%m-%d %H:%M:%S")+" "+"- "*depth+s
    log.append(s)
    logger.info(s)
def get_mylog():
    return log