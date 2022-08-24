from datetime import datetime, timedelta
from time import sleep
from genericpath import exists
import matplotlib.patches as mpatches
from matplotlib.ticker import StrMethodFormatter
import matplotlib.dates as mdates
from matplotlib import pyplot as plt
import os

from . import fuseki_queries

import logging
logger = logging.getLogger(__name__)

figures_path = "/var/lib/cometar/figures"
if not os.path.exists(figures_path):
    os.makedirs(figures_path)  

def get_metadata_distribution_figure(force_redraw):
  prefix = "metadata_distribution_"
  fig_fullname = os.path.join(figures_path,prefix+datetime.now().strftime("%Y-%m-%d")+".jpg")

  if not exists(fig_fullname) or force_redraw:
    listing = os.listdir(figures_path)
    for file in listing:
        if file.startswith(prefix) and file.endswith(".jpg"):
            os.remove(os.path.join(figures_path, file))
    data = fuseki_queries.get_distribution_metadata()
    
    pie_labels = data.keys()
    donut_labels = []
    pie_real_numbers = []
    pie_added_numbers = []
    donut_numbers = []
    pie_colors=['gold', 'mediumturquoise', 'darkorange', 'lightgreen','indianred','lightskyblue','plum','crimson','lightslategrey']
    donut_colors=[]
    min_sub_concepts = 10

    for index,pie_label in enumerate(pie_labels):
      cat = data[pie_label]
      pie_real_numbers.append(cat.get("sub_concepts"))
      cat_number = 0
      for sub_cat_label in cat["sub_categories"].keys():
        sub_cat_number = cat["sub_categories"][sub_cat_label]
        donut_labels.append(sub_cat_label)
        donut_numbers.append(sub_cat_number)
        cat_number += sub_cat_number
        donut_colors.append(pie_colors[index%len(pie_colors)])
      pie_added_numbers.append(cat_number)
    
    global blocker
    while blocker == True:
      sleep(1.0)
    blocker = True
    try:
      plt.figure(3)
      plt.clf() 
      ax = plt.subplot()
      ax.pie(donut_numbers, 
        colors=donut_colors,
        startangle=125,
        counterclock=False,
        wedgeprops=dict(edgecolor='w',linewidth=.5),
        radius = 0.8
      )
      ax.set_title("Number of Annotated Parameters per Category / Sub-Category (with at least "+str(min_sub_concepts)+" parameters).", x=1.5, y=1.1)
      h = []
      for label, size, color in zip(donut_labels, donut_numbers, donut_colors):
        if size > min_sub_concepts:
          h.append(mpatches.Patch(color = color, label=label + " (" +f'{size:,}'+ ")"))
      plt.legend(handles=h,loc=0, bbox_to_anchor=(1.2, 1.0), ncol=2)
      ax.pie(pie_added_numbers, 
        colors=pie_colors,
        labels=[l+" ("+f'{s:,}'+")" for l,s in zip(pie_labels, pie_real_numbers)],
        startangle=125,
        counterclock=False,
        wedgeprops=dict(width=0.2, edgecolor='w',linewidth=0),
        explode = list(map(lambda x:0.0 if x < 6 else x*x/150.0,range(len(pie_added_numbers))))
      )
      plt.savefig(fig_fullname,bbox_inches='tight')
      plt.show()
    finally:
      blocker=False
  return fig_fullname

blocker=False
def get_progress_metadata_changes_figure(force_redraw):  
  prefix = "additions_and_removals_per_date_"
  fig_fullname = os.path.join(figures_path,prefix+datetime.now().strftime("%Y-%m-%d")+".jpg")

  if not exists(fig_fullname) or force_redraw:
    listing = os.listdir(figures_path)
    for file in listing:
        if file.startswith(prefix) and file.endswith(".jpg"):
            os.remove(os.path.join(figures_path, file))

    data = fuseki_queries.get_progress_metadata()
    dates = [datetime.strptime(d,'%Y-%m').date() for d in data["dates"]]
    bar_width=8

    global blocker
    while blocker == True:
      sleep(1.0)
    blocker = True
    try:
      figch, axch = plt.subplots()
      plt.grid(axis = 'y',zorder=0)
      plt.grid(axis = 'x', which='major',zorder=0)
      axch.bar(list(map(lambda x:x-timedelta(days=8),dates)), data["additions"], zorder=3, width=bar_width, color='green', align='center', label="Added annotations")
      axch.bar(list(map(lambda x:x,dates)), data["changes"], zorder=3, width=bar_width, color='gold', align='center', label="Changed annotations")
      axch.bar(list(map(lambda x:x+timedelta(days=8),dates)), data["removals"], zorder=3, width=bar_width, color='red', align='center', label="Removed annotations")

      if len(data["dates"]) < 10:
        months = [1,2,3,4,5,6,7,8,9,10,11,12]
      elif len(data["dates"]) < 30:
        months = [1,4,7,10]
      elif len(data["dates"]) < 60:
        months = [1,7]
      else:
        months = [1]
      axch.xaxis.set_major_locator(mdates.MonthLocator(months))
      axch.xaxis.set_minor_locator(mdates.MonthLocator([1,2,3,4,5,6,7,8,9,10,11,12]))
      axch.xaxis_date()
      axch.set_yscale('log')
      axch.yaxis.set_major_formatter(StrMethodFormatter('{x:,.0f}'))
      axch.set_xlabel("Date")
      axch.set_ylabel("Amount")
      axch.set_title("Annotation Additions, Changes and Removals")
      axch.legend()
      figch.autofmt_xdate()
      plt.savefig(fig_fullname,bbox_inches='tight')
      plt.show()
    finally:
      blocker = False
  return fig_fullname

def get_progress_metadata_total_figure(force_redraw):
  prefix = "total_amount_of_statements_per_date_"
  fig_fullname = os.path.join(figures_path,prefix+datetime.now().strftime("%Y-%m-%d")+".jpg")

  if not exists(fig_fullname) or force_redraw:
    listing = os.listdir(figures_path)
    for file in listing:
        if file.startswith(prefix) and file.endswith(".jpg"):
            os.remove(os.path.join(figures_path, file))

    data = fuseki_queries.get_progress_metadata()
    dates = [datetime.strptime(d,'%Y-%m').date() for d in data["dates"]]

    global blocker
    while blocker == True:
      sleep(1.0)
    blocker = True
    try:
      figt, axt = plt.subplots()
      axt.plot(dates, data["total_statements"])
      if len(data["dates"]) < 10:
        months_to_annotate = [1,2,3,4,5,6,7,8,9,10,11,12]
      elif len(data["dates"]) < 30:
        months_to_annotate = [1,4,7,10]
      elif len(data["dates"]) < 60:
        months_to_annotate = [1,7]
      else:
        months_to_annotate = [1]
      axt.xaxis.set_major_locator(mdates.MonthLocator(months_to_annotate))
      axt.xaxis.set_minor_locator(mdates.MonthLocator([1,2,3,4,5,6,7,8,9,10,11,12]))
      axt.xaxis_date()
      axt.yaxis.set_major_formatter(StrMethodFormatter('{x:,.0f}'))
      year = dates[0].year
      for date,x in zip(dates,data["total_statements"]):
        if date.year > year or date == dates[-1]:
          year = date.year
          axt.annotate(f'{x:,}', (mdates.date2num(date), x), xytext=(-15, -25),textcoords='offset points',arrowprops={'arrowstyle':'-'})
      plt.grid(axis = 'y')
      plt.grid(axis = 'x', which='major')
      axt.set_title('Total Amount of Annotations')
      axt.set_xlabel('Date')
      axt.set_ylabel('Amount')
      figt.autofmt_xdate()
      plt.savefig(fig_fullname,bbox_inches='tight')
      plt.show()
    finally:
      blocker = False
  return fig_fullname