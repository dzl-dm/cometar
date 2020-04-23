import { Component, OnInit, Input, ElementRef, Output, EventEmitter } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { animate, transition, state, trigger, style } from '@angular/animations';

@Component({
  selector: 'app-section',
  templateUrl: './section.component.html',
  styleUrls: ['./section.component.css'],
  animations: [
    trigger('openClose', [
      state('open', style({
        height: '*',
        'paddingTop': '10px'
      })),
      state('closed', style({
        height: '0px',
        'paddingTop': '0px'
      })),
      transition('open => closed, closed => open', [
        animate('0.2s')
      ])
    ]),
  ]
})
export class SectionComponent implements OnInit {
  @Input() title:string;
  @Input() foldable:boolean=false;
  @Input() expanded:boolean=true;
  @Input() category?:string;
  @Input() shrinking?:boolean=false;
  @Input() min_height?:number;
  @Input() backgroundstyle?:'solid'|'shadow'='solid';
  @Input() margin?:number=5;
  @Input() padding?:number=10;
  @Output() open = new EventEmitter<Event>();
  constructor(
    iconRegistry: MatIconRegistry, 
    sanitizer: DomSanitizer,
    private el: ElementRef
  ) {
    iconRegistry.addSvgIcon('expand_more', sanitizer.bypassSecurityTrustResourceUrl('assets/img/icons/baseline-expand_more-24px.svg'));
    iconRegistry.addSvgIcon('expand_less', sanitizer.bypassSecurityTrustResourceUrl('assets/img/icons/baseline-expand_less-24px.svg'));
    iconRegistry.addSvgIcon('lightbulb', sanitizer.bypassSecurityTrustResourceUrl('assets/img/icons/lightbulb.svg'));
  }

  ngOnInit() {
  }

  public expandOrCollapse(event){
    if (!this.expanded) this.open.emit(event);
    this.expanded=!this.foldable || !this.expanded;
  }
}
