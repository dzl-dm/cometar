import { Component, OnInit } from '@angular/core';
import { parseString } from 'xml2js';
import { combineLatest } from 'rxjs';
import { ClientConfigurationService, IClientConfiguration, Mapping } from '../services/client-configuration.service';
import { ConceptByNotationService } from '../services/queries/concept-by-notation.service';
import { map } from 'rxjs/operators';
import { ConceptInformation } from 'src/app/core/concept-information/concept-information.component';
import { HttpClient,HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-upload-client-configuration',
  templateUrl: './upload-client-configuration.component.html',
  styleUrls: ['./upload-client-configuration.component.css']
})
export class UploadClientConfigurationComponent implements OnInit {
	public inputtype="xml";
	public csc_content="";
  public xmlFileContent="";
  public feedback:string[]=[];
	public replacedFileContent="";
	public csc_new_content="";
  public showUpdatedConfigurationFileDownloadButton=false;
  	constructor(
		private clientConfigurationService:ClientConfigurationService,
		private conceptByNotationService:ConceptByNotationService,
		private http:HttpClient
	) { }

  ngOnInit() {
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

  public loadExample(){
	const _headers = new HttpHeaders();
    const headers = _headers.set('Content-Type', 'text/xml')
	let exampleConfiguration = this.http.get('assets/data/datasource.xml',{headers: _headers,responseType: 'text'});
	exampleConfiguration.subscribe(data => this.xmlFileContent = data);
  }

  public analyze(){
		this.replacedFileContent = this.xmlFileContent;
		this.csc_new_content = this.csc_content;
		this.showUpdatedConfigurationFileDownloadButton = false;
		let replacements=[];
		this.feedback = [];
		let mappings:Mapping[] = [];
		if (this.inputtype=="xml") parseString( this.xmlFileContent, ((err, result:IClientConfiguration) => {
			mappings = this.clientConfigurationService.getMappings(result);
		}));
		else mappings = this.csc_content.split(",").map(code => {
			return <Mapping>{
				concept: code,
			}
		});
		combineLatest(mappings.map(m=>{
			return this.conceptByNotationService.get(m.concept).pipe(
				map(result => {
					if (!result.concept && m.concept != "") {
						this.feedback.push(`"${m.concept}" is a unknown code.`);
						return undefined;
					}
					if (result.newnotation) {
						this.feedback.push(`"${m.concept}" is a deprecated code.  New code: "${result.newnotation.value}".`);
						replacements.push([m.concept, result.newnotation.value]);
					}
					let ci:ConceptInformation
					if (this.inputtype=="xml") ci = {
						concept: result.concept && result.concept.value,
						headings:["Source", "Value", "Mapped Value", "Unit"],
						cellWidthPercentages:[55,15,15,15],
						cellMinWidth:[150,150,150,50],
						cellMaxWidth:[250,150,150,50],
						cells:this.clientConfigurationService.getTreeLines(m),
						sourceId:"clientconfig"
					}
					else ci = {
						concept: result.concept && result.concept.value,
						headings:["Code", "New Code"],
						cells:[[m.concept, result.newnotation && result.newnotation.value]],
						cellWidthPercentages:[50,50],
						sourceId:"clientconfig"
					}
					return ci;
				})
			)
		})).subscribe(data => {
			data = data.filter(d => d != undefined);
			if (data.length == 0) return;
			this.clientConfigurationService.setTreeData(data);
			this.showUpdatedConfigurationFileDownloadButton = replacements.length > 0;
			for (let replacement of replacements){
				if (this.inputtype=="xml") {
					let regex = new RegExp("\""+replacement[0]+"\"", "g");
					this.replacedFileContent = this.replacedFileContent.replace(regex, "\"" + replacement[1] + "\"");
				}
				else {
					let regex = new RegExp("(^|,)"+replacement[0]+"(,|$)", "g");
					this.csc_new_content = this.csc_new_content.replace(regex, "$1" + replacement[1] + "$2");
				}
			}
		});
  }

  public downloadNewFile(){		
	var a = <HTMLElement>document.createElement("a");
	let thefile = new Blob([this.replacedFileContent], { type: "application/octet-stream" });
	let url = window.URL.createObjectURL(thefile);
	a.setAttribute("href", url);
	a.setAttribute("download", "datasource.xml");
	a.setAttribute("style","display:none");
	document.body.appendChild(a);
	a.click()
	window.URL.revokeObjectURL(url);
	a.remove();  
  }
}