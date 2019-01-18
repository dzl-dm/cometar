import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-upload-client-configuration',
  templateUrl: './upload-client-configuration.component.html',
  styleUrls: ['./upload-client-configuration.component.css']
})
export class UploadClientConfigurationComponent implements OnInit {
  public inputtype="xml";
  constructor() { }

  ngOnInit() {
  }

}
