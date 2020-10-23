import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class HelpVideosService {
  
  constructor() { }

  public helpSections: HelpSection[] =  [
    /*{
      heading: "Tree Legend",
      media: [
        {
          url: "assets/img/icons/baseline-grade-24px.svg",
          type: "icon",
          description: "Item is on draft.",
          width: 24,
          border: false
        },
        {
          url: "assets/img/icons/baseline-find_in_page-24px.svg",
          type: "icon",
          description: "Item has an editorial note and needs expert revision.",
          width: 24,
          border: false
        }
      ]
    },*/
    {
      heading: "Navigation",
      media: [
        {
          heading: "Basic Navigation",
          description: "Click items in the concept tree to show details about them. Click on the "+" next to them for expansion.",
          url: "assets/video/navigate1_x264.mp4",
          type: "video"
        },
        {
          heading: "Icon Navigation",
          description: "Icons next to a concept provide more information about them. Icons with numbers refer to sub-concept with the respective information. Click such icon to show all referred sub-concepts.",
          url: "assets/video/navigate2_x264.mp4",
          type: "video"
        },
        {
          heading: "Orientation Support",
          description: "Keep track of your position in the concept tree. Higher-level headings automatically stay visible when navigating.",
          url: "assets/video/navigate3_x264.mp4",
          type: "video"
        },
        {
          heading: "Module Navigation",
          description: "Click items in the module navigation bar to switch between them. Click the home button to return to start screen.",
          url: "assets/video/navigate4_x264.mp4",
          type: "video"
        },
      ]
    },
    {
      heading: "Search",
      media: [
        {
          heading: "Search for Patterns",
          description: "Click the search button and enter a search pattern. Matching concepts will be highlighted and additional information about the matches is shown right under the concepts. Click the 'x' button to cancel your search.",
          url: "assets/video/search1_x264.mp4",
          type: "video"
        },        
        {
          heading: "Search Information Details",
          description: "Hover information areas right under a concept to expand them. Expand the whole concept tree to show all information at once.",
          url: "assets/video/search2_x264.mp4",
          type: "video"
        },        
      ]
    },
    {
      heading: "Provenance",
      media: [
        {
          heading: "Additions, Moves & Removals",
          description: "All concepts are annotated with information about whether they were added, moved or removed in the selected time window. Click the respective icons next to a concept to show all referred sub-concepts. Click a bar in the outline panel next to the scroll bar to immediately jump to the concept's position.",
          url: "assets/video/provenance1_x264.mp4",
          type: "video"
        },
        {
          heading: "Time Window",
          description: "Adjust the time window of interest by dragging the slider on the selection bar.",
          url: "assets/video/provenance2_x264.mp4",
          type: "video"
        },
        {
          heading: "Movement Items Support",
          description: "Click on a moved item and/or hover its movement icon to see where the element has been located before and where it was moved.",
          url: "assets/video/provenance3_x264.mp4",
          type: "video"
        },
      ]
    }
  ]
}


export interface HelpSection {
  heading:string,
  media:HelpMedia[]
}

export interface HelpMedia {
  heading?:string,
  description?:string,
  border?:boolean,
  url:string,
  type:"video"|"image"|"icon"|"html",
  width?:number
}
