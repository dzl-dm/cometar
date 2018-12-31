import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-browser',
  templateUrl: './browser.component.html',
  styleUrls: ['./browser.component.css']
})
export class BrowserComponent implements OnInit {

  private width = 500;
  constructor(
    private route:ActivatedRoute
  ) { }

  ngOnInit() {
  }
  
  private savedX;
  private treeResizing=false;

  private onTreeResizeStart(event: MouseEvent) {
    event.stopPropagation();
    this.treeResizing = true;
    this.savedX = event.clientX;
    return false;
  }
  private onTreeResizeDrag(event: MouseEvent) {
    if (!this.treeResizing) return false;
    event.stopPropagation();
    let diff = event.clientX - this.savedX;
    this.savedX += diff;
    this.width += diff;
    return false;
  }
  private onTreeResizeEnd(event: MouseEvent) {
    this.treeResizing = false;
  }
}
