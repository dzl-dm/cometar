import { Component, OnInit } from '@angular/core';
import { parseString } from 'xml2js';
import { ConceptInformation, TreeDataService } from 'src/app/core/services/tree-data.service';
import { ReplaySubject, combineLatest } from 'rxjs';
import { ClientConfigurationService, IClientConfiguration } from '../services/client-configuration.service';
import { ConceptByNotationService } from '../services/queries/concept-by-notation.service';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-upload-client-configuration',
  templateUrl: './upload-client-configuration.component.html',
  styleUrls: ['./upload-client-configuration.component.css']
})
export class UploadClientConfigurationComponent implements OnInit {
	private treeData$:ReplaySubject<ConceptInformation[]>=new ReplaySubject<ConceptInformation[]>(1);
  public inputtype="xml";
  public xmlFileContent="";
  public feedback:string[]=[];
  public replacedFileContent="";
  public showUpdatedConfigurationFileDownloadButton=false;
  	constructor(
		private treeDataService:TreeDataService,
		private clientConfigurationService:ClientConfigurationService,
		private conceptByNotationService:ConceptByNotationService
	) { }

  ngOnInit() {
	this.treeDataService.addConceptInformation(this.treeData$);
  }

  public inputFileSelected(fileInput: any){
    var dateien = fileInput.target.files;
    for (var i = 0, f; f = dateien[i]; i++) {
      if (!f.type.match('text/plain') && !f.type.match('text/xml')) {
        continue;
      }
      var reader = new FileReader();
      reader.onload = ((theFile) => {
        return ((e) => {
          this.xmlFileContent = e.target.result;
        });
      })(f);
      reader.readAsText(f, "UTF-8");
    }
  }

  public analyze(){
	this.replacedFileContent = this.xmlFileContent;
	this.showUpdatedConfigurationFileDownloadButton = false;
	let replacements=[];
	this.feedback = [];
    parseString( this.xmlFileContent, ((err, result:IClientConfiguration) => {
		let mappings = this.clientConfigurationService.getMappings(result);
		combineLatest(mappings.map(m=>{
			return this.conceptByNotationService.get(m.concept).pipe(
				map(result => {
					if (!result.concept && m.concept != "") {
						this.feedback.push(`"${m.concept}" is a unknown code.`);
					}
					if (result.newnotation) {
						this.feedback.push(`"${m.concept}" is a deprecated code.  New code: "${result.newnotation.value}".`);
						replacements.push([m.concept, result.newnotation.value]);
					}
					let ci:ConceptInformation = {
						concept: result.concept && result.concept.value,
						headings:["Column", "Value", "Mapped Value", "Unit"],
						cells:this.clientConfigurationService.getTreeLines(m),
						sourceId:"clientconfig"
					}
					return ci;
				}
			))
		})).subscribe(data => {
			this.treeData$.next(data);
			this.showUpdatedConfigurationFileDownloadButton = replacements.length > 0;
			for (let replacement of replacements){
				var regex = new RegExp("\""+replacement[0]+"\"", "g");
				this.replacedFileContent = this.replacedFileContent.replace(regex, "\"" + replacement[1] + "\"");
			}
		});
    }));
  }

  public downloadNewFile(){			
	let thefile = new Blob([this.replacedFileContent], { type: "application/octet-stream" });
	let url = window.URL.createObjectURL(thefile);
	window.open(url);
  }
}