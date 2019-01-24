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
  public xmlFileContent=`
  <?xml version="1.0" encoding="UTF-8"?>
<datasource version="1.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" >
	<meta>
		<id>ipf_giessen</id>
		<etl-strategy>replace-source</etl-strategy>
	</meta>
	
	<patient-table>
		<source xsi:type="csv-file">
			<url>patient.csv</url>
			<separator>;</separator>
		</source>
		<idat>
			<patient-id column="patid"/>
			<given-name column="patid"/>
			<surname column="patid"/>
			<birthdate format="u[-M[-d]]" na="" column="birthdate"/>
			<deathdate format="u[-M[-d]]" na="" column="deathdate"/>
			<gender column="gender" na="">
				<map> <!-- maps a column -->
					<case value="W" set-value="female"/>
					<case value="M" set-value="male"/>
					<case value="X" set-value="indeterminate"/>
					<otherwise set-value="" log-warning="Unexpected gender value"/>
				</map>
			</gender>
		</idat>
		<!-- for MDAT in patient table, use the same patient-table also as
		a visit table (visit date needed). the patient id can be re-used
		as visit id, or a constant visit ID can be used. -->
	</patient-table>
	<!-- optional -->
	<visit-table>
		<source xsi:type="csv-file">
			<url>visit.csv</url>
			<type>text/csv</type>
			<separator>;</separator>
		</source>
		<idat>
			<patient-id column="patid"/>
			<visit-id column="visit"/>
			<start column="date" format="u[-M[-d['T'H[:m[:s[.SSS[XXX]]]]]]]" na="" truncate-to="year"/>
		</idat>
		<mdat>
		</mdat>
	</visit-table>
	<wide-table>
		<source xsi:type="csv-file">
			<url>Proben.csv</url>
			<type>text/csv</type>
			<separator>;</separator>
		</source>
		<idat>
			<patient-id column="MedicoID"/>
			<visit-id column="VisitID"/>
		</idat>		
		<mdat>
			<concept id="Probe">
				<start column="EntnahmeDatum" format="d.M.u[ H[:m[:s]]]" na=""/>
				<value column="ProbenArt" xsi:type="string" na="">
					<map>
						<!-- TODO spezifischeres Mapping -->
						<case value="EDTA" set-concept="B:B-WE" set-value=""/>
						<case value="Plasma" set-concept="B:B-PL" set-value=""/>
						<case value="GewebeKryo" set-concept="B:T-BRO" set-value=""/>
						<case value="GewebeHOPE" set-concept="B:T-BRO" set-value=""/>
						<case value="GewebeFormalin" set-concept="B:T-BRO" set-value=""/>
						<case value="GewebeSchleimhaut" set-concept="B:T-BRO" set-value=""/>
						<case value="FFPE Borstel" set-concept="B:T-BRO" set-value=""/>
						<otherwise log-warning="unexpected tissue type" action="drop-fact"/>
					</map>
				</value>
				<modifier id="GewebeModifier">
					<value column="ProbenArt" xsi:type="string" na="">
						<map>
							<!-- TODO Mapping unvollständig -->
							<case value="EDTA" action="drop-fact"/>
							<case value="Plasma" action="drop-fact"/>
							<case value="GewebeHOPE" set-concept="PH" set-value=""/> 
							<case value="GewebeKryo" set-concept="FACR" set-value=""/> 
							<case value="GewebeFormalin" set-concept="PF" set-value=""/>
							<case value="GewebeSchleimhaut" action="drop-fact"/>
							<case value="FFPE Borstel" set-concept="PF" set-value=""/>
						</map>	
					</value>
				</modifier>
			</concept>
		</mdat>
		<ignore column="*" xsi:type="string"/>
	</wide-table>
	<eav-table>
		<source xsi:type="csv-file">
			<url>Komorbiditäten.csv</url>
			<type>text/csv</type>
			<separator>;</separator>
		</source>
		<idat>
			<patient-id column="MedicoID"/>
			<visit-id column="DatumKomor"/>
		</idat>		
		<mdat>
			<concept column="Komorbidität"/>
			<start column="DatumKomor" format="d.M.u[ H[:m[:s]]]" na=""/>
			<type constant-value="string"/>
			<end constant-value="" na=""/>
			<value constant-value="" na=""/>
			<unit constant-value="" na=""/>
		</mdat>
		<virtual>
			<value column="1" xsi:type="string"><map><otherwise action="drop-fact"/></map></value> 
			<value column="2" xsi:type="string"><map><otherwise action="drop-fact"/></map></value> 
			<value column="3" xsi:type="string"><map><otherwise action="drop-fact"/></map></value> 
			<value column="4" xsi:type="string"><map><otherwise action="drop-fact"/></map></value> 
			<value column="5" xsi:type="string"><map><otherwise action="drop-fact"/></map></value> 
			<value column="6" xsi:type="string"><map><otherwise action="drop-fact"/></map></value> 
			<value column="7" xsi:type="string"><map set-concept="S:73211009" /></value>
			<value column="8" xsi:type="string"><map set-concept="S:399957001" /></value>
			<value column="9" xsi:type="string"><map><otherwise action="drop-fact"/></map></value> 
			<value column="10" xsi:type="string"><map><otherwise action="drop-fact"/></map></value> 
			<value column="11" xsi:type="string"><map set-concept="ICD10:N17-N19" /></value>
			<value column="12" xsi:type="string"><map set-concept="S:22298006" /></value>
			<value column="13" xsi:type="string"><map set-concept="S:119292006" /></value>
			<value column="14" xsi:type="string"><map><otherwise action="drop-fact"/></map></value> 
			<value column="15" xsi:type="string"><map><otherwise action="drop-fact"/></map></value> 
			<value column="16" xsi:type="string"><map><otherwise action="drop-fact"/></map></value> 
			<value column="17" xsi:type="string"><map><otherwise action="drop-fact"/></map></value> 
			<value column="18" xsi:type="string"><map><otherwise action="drop-fact"/></map></value> 
			<value column="30" xsi:type="string"><map><otherwise action="drop-fact"/></map></value> 
			<value column="99" xsi:type="string"><map><otherwise action="drop-fact"/></map></value> 
		</virtual>
		<ignore column="*" xsi:type="string"/>
	</eav-table>
	<wide-table>
		<source xsi:type="csv-file">
			<url>Untersuchungen.csv</url>
			<type>text/csv</type>
			<separator>;</separator>
		</source>
		<idat>
			<patient-id column="MedicoID"/>
			<visit-id column="Untersuchungsdatum"/>
		</idat>
		<mdat>
			<concept id="Untersuchungsmethode">
				<start column="Untersuchungsdatum" format="d.M.u[ H[:m[:s]]]" na=""/>
				<value column="Untersuchung" xsi:type="string" na="">
					<map>
						<case value="CT" set-concept="S:241540006" set-value=""/>
						<case value="MRT" set-concept="" set-value=""				action="drop-fact"/>
						<case value="PET-CT" set-concept="S:82918005" set-value=""/>
						<case value="PET CT" set-concept="S:82918005" set-value=""/>
						<case value="Röntgen" set-concept="S:303931008" set-value=""/>
						<case value="Klinischer Progress" set-concept="" set-value=""		action="drop-fact"/>
						<case value="Tumormarker" set-concept="" set-value=""			action="drop-fact"/>
						<case value="Zytologie" set-concept="" set-value=""			action="drop-fact"/>
						<case value="Histologie" set-concept="" set-value=""			action="drop-fact"/>
						<case value="Unbekannt" set-concept="" set-value=""			action="drop-fact"/>
						<case value="Klinische Diagnostik" set-concept="" set-value=""		action="drop-fact"/>
						<case value="EBUS/EUS" set-concept="" set-value=""			action="drop-fact"/>
						<case value="Mediastinoskopie" set-concept="" set-value=""		action="drop-fact"/>
						<case value="Bildgebende Verfahren" set-concept="" set-value=""		action="drop-fact"/>
						<case value="Sonographie" set-concept="" set-value=""			action="drop-fact"/>
						<case value="Knochenszintigrafie" set-concept="" set-value=""		action="drop-fact"/>
						<case value="Knochenmarksbiopsie" set-concept="" set-value=""		action="drop-fact"/>
						<case value="Bronchoskopie" set-concept="S:10847001" set-value=""/>
						<case value="Thorakoskopie" set-concept="" set-value=""			action="drop-fact"/>
						<case value="Explorative Thorakotomie" set-concept="" set-value=""	action="drop-fact"/>
						<case value="Angiographie" set-concept="" set-value=""			action="drop-fact"/>
						<otherwise log-warning="Unexpected value" action="drop-fact"/>
					</map>
				</value>
			</concept>
		</mdat>
		<ignore column="*" xsi:type="string"/>
	</wide-table>
	<wide-table>
		<source xsi:type="csv-file">
			<url>Therapien.csv</url>
			<type>text/csv</type>
			<separator>;</separator>
		</source>
		<idat>
			<patient-id column="MedicoID"/>
			<visit-id column="PrimTh_Begin"/>
		</idat>
		<mdat>			
			<concept id="Primaertherapie">
				<start column="PrimTh_Begin" format="d.M.u[ H[:m[:s]]]" na=""/>
				<end column="PrimTh_End" format="d.M.u[ H[:m[:s]]]" na=""/>
				<value column="PrimaryTherapy" xsi:type="string" na="">
					<map>
						<case value="Op" set-concept="PRIMTHE:32" set-value=""/>
						<case value="St" set-concept="PRIMTHE:8" set-value=""/>
						<case value="Sy" set-concept="PRIMTHE:16" set-value=""/>
						<case value="OpSt" set-concept="PRIMTHE:40" set-value=""/>
						<case value="OpSy" set-concept="PRIMTHE:48" set-value=""/>
						<case value="StSy" set-concept="PRIMTHE:24" set-value=""/>
						<case value="OpStSy" set-concept="PRIMTHE:56" set-value=""/>
						<case value="none" set-concept="PRIMTHE:0" set-value=""/>
						<otherwise log-warning="Unexpected value" action="drop-fact"/>
					</map>
				</value>
			</concept>
			<concept id="AdjuvanteTherapie">
				<start column="AdjuTh_Begin" format="d.M.u[ H[:m[:s]]]" na=""/>
				<end column="AdjuTh_End" format="d.M.u[ H[:m[:s]]]" na=""/>
				<value column="AdjuvantTherapy" xsi:type="string" na="">
					<map>
						<case value="St" set-concept="ADJT:2" set-value=""/>
						<case value="Sy" set-concept="ADJT:1" set-value=""/>
						<case value="StSy" set-concept="ADJT:3" set-value=""/>
						<case value="none" set-concept="ADJT:0" set-value=""/>
						<otherwise set-concept="ADJT:0" set-value=""/>
					</map>
				</value>
			</concept>
			<concept id="PrimaryTherapyResult">
				<start column="PrimTh_End" format="d.M.u[ H[:m[:s]]]" na=""/>
				<value column="Primaertherapie_Ergebnis" xsi:type="string" na="">
					<map>
						<case value="1" set-concept="PRIMTHER:CR" set-value=""/>
						<case value="2" set-concept="PRIMTHER:PR" set-value=""/>
						<case value="3" set-concept="PRIMTHER:MR" set-value=""/>
						<case value="4" set-concept="PRIMTHER:SD" set-value=""/>
						<case value="5" set-concept="PRIMTHER:MR" set-value=""/>
						<case value="6" set-concept="PRIMTHER:PD" set-value=""/>
						<case value="7" set-concept="PRIMTHER:PD" set-value=""/>
						<case value="8" set-concept="PRIMTHER:PD" set-value=""/>
						<case value="9" set-concept="PRIMTHER:X" set-value=""/>
						<case value="10" set-concept="PRIMTHER:X" set-value=""/>
						<case value="11" set-concept="PRIMTHER:DG" set-value=""/>
						<otherwise log-warning="Unexpected value" action="drop-fact"/>
					</map>
				</value>
			</concept>
		</mdat>
		<ignore column="*" xsi:type="string"/>
	</wide-table>
</datasource>

  `;
  public feedback:string[]=[];
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
    parseString( this.xmlFileContent, ((err, result:IClientConfiguration) => {
		let mappings = this.clientConfigurationService.getMappings(result);
		combineLatest(mappings.map(m=>{
			return this.conceptByNotationService.get(m.concept).pipe(
				map(concept => {
					let ci:ConceptInformation = {
						concept: concept,
						headings:["Column", "Value", "Mapped Value", "Unit"],
						cells:this.clientConfigurationService.getTreeLines(m),
						sourceId:"clientconfig"
					}
					return ci;
				}
			))
		})).subscribe(data => this.treeData$.next(data));
		this.treeData$.subscribe(data => console.log(data));
    }));
  }
}