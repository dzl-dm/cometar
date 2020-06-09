import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs';
import { ConceptInformation } from 'src/app/core/concept-information/concept-information.component';
import { TreeDataService } from 'src/app/core/services/tree-data.service';
import { TreeStyleService, TreeItemStyle } from 'src/app/core/services/tree-style.service';
import { map as map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ClientConfigurationService {
  	private cc:ClientConfiguration;
  	private treeData$:ReplaySubject<ConceptInformation[]>=new ReplaySubject<ConceptInformation[]>(1);
  	constructor(
		private treeDataService:TreeDataService,
		private treeStyleService:TreeStyleService,
	) {
		this.treeDataService.addTreeItemConceptInformation(this.treeData$);
		this.treeStyleService.addTreeItemStyles(this.treeData$.pipe(
			map(td => {
				let treeItemStyles:TreeItemStyle[] = td.map(ci => {
					let style = this.treeStyleService.getEmptyStyle(ci.concept);
					style.icons.push({
						style,
						type: "chip",
						"background-color": "#FFFBD5",
						"border-color": "#DDD",
						color: "#333",
						id: "clientconfiguration",
						description: "This element has been configured.",
						text: "configured",
						"bubble-up": {
							style,
								type: "dot",
								"background-color": "#FFFBD5",
								"border-color": "#DDD",
								id: "clientconfiguration_bubble",
								color: "#333",
								description: "There are COUNTER sub-elements that have been configured."
						}
					});
					return style;
				})
				return treeItemStyles;
			})
		));
		this.treeDataService.reset$.subscribe(()=>this.setTreeData([]));
	}

	public setTreeData(ci:ConceptInformation[]){
		this.treeData$.next(ci);
	}

	public getMappings(icc:IClientConfiguration):Mapping[]{
		this.cc = new ClientConfiguration(icc);
		return this.cc.extractMappings();
	}
	public getTreeLines(m:Mapping):string[][]{
		return this.cc.getTreeLines(m);
	}
}


class ClientConfiguration {
	config:IClientConfiguration;
	constructor(config: IClientConfiguration){
		this.config = config;
	}

	private mappings:Mapping[]=[];

	public extractMappings():Mapping[]{
		this.mappings = [];

		if (this.config.datasource["eav-table"]) this.config.datasource["eav-table"].forEach(et => {
			let file = et.source[0].url[0];
			let mdat = et.mdat[0];
			if (et.virtual && et.virtual[0].value) et.virtual[0].value.forEach(v => {
				let column = v.$.column;
				if (v.map[0]) {
					this.readMapIntoMappings({
						map: v.map[0], 
						file, 
						column, 
						concept: "", 
					  	navalue: v.$ && v.$.na || mdat.value && mdat.value[0].$ && mdat.value[0].$.na,
						nadrop: v.$ && v.$["na-action"]=="drop-fact" || mdat.value && mdat.value[0].$ && mdat.value[0].$["na-action"]=="drop-fact" || false,
						constantvalue: v.$ && v.$["constant-value"] || mdat.value && mdat.value[0].$ && mdat.value[0].$["constant-value"],
						unit: mdat.unit && mdat.unit[0].$ && ( mdat.unit[0].$.column || mdat.unit[0].$["constant-value"] ),
						type: v.$ && v.$["xsi:type"],
						modifiers: [],
						eavTable: true
					});
				}
			});
		});

		let widetables = this.config.datasource["wide-table"] || [];
		widetables = widetables.concat(this.config.datasource["visit-table"]);
		widetables.forEach(wt => {
			let file = wt.source[0].url[0];
			if (wt.mdat && wt.mdat[0] && wt.mdat[0].concept) wt.mdat[0].concept.forEach(c => {
				let concept = c && c.$ && c.$.id || "";
				let value = c.value && c.value[0];
				let column = value && value.$ && value.$.column || value && value.$ && value.$["constant-value"] == value.$.na && "constant-value";
				let unit = c.unit && c.unit[0].$ && ( c.unit[0].$.column || "\""+c.unit[0].$["constant-value"]+"\"" );
				let constantvalue = c && c.$ && c.$["constant-value"];
				if (constantvalue == undefined) constantvalue = value && value.$ && value.$["constant-value"];
				let navalue = c && c.$ && c.$.na;
				if (navalue == undefined) navalue = value && value.$ && value.$.na;
				let nadrop = value && value.$ && value.$["na-action"] == "drop-fact" || false;
				let type = value && value.$["xsi:type"];
				let modifiers = c.modifier || [];
				let modifiercolumns = modifiers.map(m => m.value && m.value[0] && (m.value[0].$.column || m.value[0].$["constant-value"]!=undefined && column)).filter(m => m!=undefined);
				if (value && value.map) {
					this.readMapIntoMappings({
						map: value.map[0],
						file,column,concept,
						navalue,nadrop,constantvalue, 
						unit,type,
						modifiers: modifiercolumns
					});
				}
				else {
					this.pushMapping({
						concept:concept, 
						nadrop, navalue, unit, constantvalue, type, 
						occurances:[{
							column: column,
							file: file,
							drop: false,
							modifiers:modifiercolumns
						}]
					});	
				}
				modifiers.forEach(modifier => {
					concept = modifier.$ && modifier.$.id;
					value = modifier.value && modifier.value[0];
					let mcolumn = (value && value.$ && value.$.column || value && value.$ && value.$["constant-value"] == value.$.na && "constant-value");
					unit = modifier.unit && modifier.unit[0].$ && ( modifier.unit[0].$.column || "\""+modifier.unit[0].$["constant-value"]+"\"" );
					constantvalue = value && value.$ && value.$["constant-value"];
					navalue = value && value.$ && value.$.na;
					nadrop = value && value.$ && value.$["na-action"] == "drop-fact" || false;
					type = value && value.$["xsi:type"];
					if (value && value.map) {
						this.readMapIntoMappings({
							map: value.map[0],
							file,
							column: mcolumn,concept,
							navalue,nadrop,constantvalue, 
							unit,type,
							modifiers: [],
							modifying: column
						});
					}
					else {
						this.pushMapping({
							concept:concept, 
							nadrop, navalue, unit, constantvalue, type, 
							occurances:[{
								column: mcolumn,
								file: file,
								drop: false,
								modifying: column
							}]
						});	
					}
				});
			});
		});
		
		//Man will als Benutzer nicht sehen, was gedropt wird. Es interessiert nur, was positiv gemapt ist.
		return this.mappings.map(mapping => {
			mapping.occurances = mapping.occurances.filter(occ => !occ.drop);
			return mapping;
		}).filter(mapping => mapping.occurances.length > 0);
	}

	/**
	 * TODO: otherwise speziell behandeln
	 * 
	 * @param map 
	 * @param file 
	 * @param column 
	 * @param concept 
	 */
	private readMapIntoMappings(params:{map:Map, file:string, column:string, 
		concept:string, navalue?:string, nadrop?:boolean, 
		constantvalue?:string, unit?:string, type?:string,
		modifiers?:string[], modifying?:string, eavTable?:boolean })
	{
		let mapconcept = params.map.$ && params.map.$["set-concept"] || params.concept;
		if (params.eavTable === true){
			this.pushMapping({
				concept:mapconcept, 
				nadrop: params.nadrop, 
				navalue: params.navalue, 
				unit: params.unit, 
				constantvalue: params.constantvalue, 
				type: params.type, 
				occurances:[{
					column: params.column,
					file: params.file,
					drop:false,
					modifiers: params.modifiers,
					modifying: params.modifying
				}]
			});
		}
		else {
			let cases = params.map.case && params.map.otherwise && params.map.case.concat(params.map.otherwise) || params.map.case || params.map.otherwise;
			//na-value exists, na-value is not mapped in <map>, no other value is set to na-value, no <otherwise action='drop-fact'/>
			// => na-value maps to "true"
			if (params.navalue != undefined 
				&& params.nadrop == false 
				&& cases
				&& !cases.map(c => c.$.value).includes(params.navalue) 
				&& cases.filter(c => c.$["set-value"] != params.navalue && (!params.map.otherwise || params.map.otherwise[0] && params.map.otherwise[0].$.action != "drop-fact")).length > 0)
			{
				this.pushMapping({
					concept:params.concept, 
					nadrop: params.nadrop, 
					navalue: params.navalue, 
					unit: params.unit, 
					constantvalue: params.constantvalue, 
					type: params.type, 
					occurances:[{
						column: params.column,
						file: params.file,
						value: "",
						drop: false,
						modifiers: params.modifiers,
						modifying: params.modifying
					}]
				});			
			}
			//the NOTs from <value na="" na-action="drop-fact" ../>
			//TODO: should only appear in wide, not eav
			if (!params.map.otherwise){
				this.pushMapping({
					concept:mapconcept, 
					nadrop: params.nadrop, 
					navalue: params.navalue, 
					unit: params.unit, 
					constantvalue: params.constantvalue, 
					type: params.type, 
					occurances:[{
						column: params.column,
						file: params.file,
						value: params.constantvalue,
						drop: false,
						modifiers: params.modifiers,
						modifying: params.modifying
					}]
				});
			}
			//gatheres exludedvalues, until the last case (the otherwise) will consume them
			if (cases) {
				let excludedvalues = []; // for <otherwise set-concept='x'/>
				cases.forEach(c => {
					let caseconcept = c.$ && c.$["set-concept"] || mapconcept;
					if (params.map.otherwise && c != params.map.otherwise[0] && c.$ && c.$.value) excludedvalues.push(c.$.value);
					this.pushMapping({
						concept:caseconcept, 
						nadrop: params.nadrop, 
						navalue: params.navalue, 
						unit: params.unit, 
						constantvalue: params.constantvalue, 
						type: params.type, 
						occurances:[{
							column: params.column,
							file: params.file,
							value: params.constantvalue || c.$ && c.$.value,
							drop: c.$ && c.$.action == "drop-fact" || false,
							setvalue: c.$ && c.$["set-value"],
							excludedvalues: params.map.otherwise && c == params.map.otherwise[0] && excludedvalues || [],
							modifiers: params.modifiers,
							modifying: params.modifying
						}]
					});
				});
			}
			else {
				this.pushMapping({
					concept:mapconcept, 
					nadrop: params.nadrop, 
					navalue: params.navalue, 
					unit: params.unit, 
					constantvalue: params.constantvalue, 
					type: params.type, 
					occurances:[{
						column: params.column,
						file: params.file,
						drop:false,
						modifiers: params.modifiers,
						modifying: params.modifying
					}]
				});
			}
		}
	}

	private pushMapping(mapping: Mapping){
		let existingmapping = this.mappings.filter(m => m.concept == mapping.concept)[0];
		if (!existingmapping){
			this.mappings.push(mapping);
		}
		else {
			existingmapping.occurances = existingmapping.occurances.concat(mapping.occurances);
		}
	}

  public getTreeLines(m:Mapping):string[][]{
    let result = [];
	let s = m.concept + ": ";		
    m.occurances.forEach(o => {
		let dropvalues=m.occurances.filter(occ => occ.file == o.file && occ.column == o.column && occ.drop).map(occ => occ.value);
		if (!o.value && m.nadrop){dropvalues.push(m.navalue);}
		let column = "";
		if (o.column && o.column != "constant-value") column = `"${o.file}" / "${o.column}"`;
		else if (o.column && o.column == "constant-value") column = "constant";
		else if (!o.column && m.constantvalue != undefined && m.constantvalue == m.navalue) column = "constant";

		if (o.modifiers && o.modifiers.length > 0) column+= " modified by " + o.modifiers.map(m => "\""+m+"\"").join(",");
		if (o.modifying) column+= " modifying \"" + o.modifying + "\"";
		let value = "";
		let mappedvalue = "";
		let unit = "";
				let isBoolean = m.navalue != undefined && m.nadrop == false;
		if (o.value != undefined) {
			if (o.setvalue != undefined) {
				if (m.navalue != undefined && m.navalue == o.setvalue) {
					if (m.nadrop == true) {
						value = "\""+o.value+"\"";
						mappedvalue = "drop";
					}
					else { 
						value = "\""+o.value+"\"";
						mappedvalue = "true";
					}
				}
				else {
					value = "\""+o.value+"\"";
					mappedvalue = "\""+o.setvalue+"\"";
				}
			}
			else if (o.value == m.navalue){
				value = "\""+o.value+"\"";
				if (o.drop)	mappedvalue = "drop";
				else mappedvalue = "true";
			}
			else {
				if (o.drop)	mappedvalue = "drop";
				value = "\""+o.value+"\"";
			}
		}
		else if (o.excludedvalues && o.excludedvalues.length > 0){
			value = "NOT(\""+o.excludedvalues.join("\",\"")+"\")";
			if (o.drop)	mappedvalue = "drop";
			else mappedvalue = "true";
		}
		else if (m.constantvalue == m.navalue) {
			mappedvalue = "true";
		}
		else {
			value = "NOT(\""+dropvalues.join("\",\"")+"\")";
			mappedvalue = "source "+m.type;
		}

		if (m.unit && mappedvalue != "drop") unit = ""+m.unit+"";
		else if (!isBoolean) unit = "";

		result.push([column, value, mappedvalue, unit]);
    });

    return result;
  }
	public readMappings(callback:(s:string)=>void){
		this.mappings.forEach(m => {
			let s = m.concept + ": ";
			m.occurances.forEach(o => {
				if (o.drop) return;
				let isBoolean = m.navalue != undefined && m.nadrop == false;
				s = s + o.file+"."+o.column;
				if (o.value) {
					if (o.setvalue != undefined) {
						if (m.navalue != undefined && m.navalue == o.setvalue) {
							if (m.nadrop == true) s+= "[\""+o.value+"\"=>\"drop\"]";
							else { 
								s+= "[\""+o.value+"\"=>\"true\"]";
							}
						}
						else s+= "[\""+o.value+"\"=>\""+o.setvalue+"\"]";
					}
					else s+="==\""+o.value+"\"";
				}
				else if (o.excludedvalues && o.excludedvalues.length > 0){
					s+="!=\""+o.excludedvalues.join("\",\"")+"\"";
				}
				if (m.unit) s+= "["+m.unit+"]";
				else if (!isBoolean) s+= "[]";
				s+=" || ";
			});
			callback(s);
		})
	}
}

export interface Mapping {
	concept:string,
	occurances:Occurance[],	
	navalue?:string,
	nadrop?:boolean,
	unit?:string,
	constantvalue?:string,
	type?:string
}
interface Occurance {
	file:string,
	column:string,
	value?:string,
	drop?:boolean,
	setvalue?:string,
	excludedvalues?:string[],
	modifiers?:string[],
	modifying?:string
}

export interface IClientConfiguration {
  "datasource": {
    $:{},
    "eav-table":EAVTable[],
    meta:Meta,
    "patient-table":{},
		"visit-table":WideTable[],
		"wide-table":WideTable[]
  }
}

interface Meta {
	"version-date":string
}

interface EAVTable {
  idat: IDat[],
  mdat: EAVMDat[],
  source: Source[],
  virtual: Virtual[]
}

interface WideTable {
	idat: IDat[],
	mdat: WideMdat[],
	source: Source[]
}

interface IDat {
  "patient-id":[],
  "visit-id":[],
  start:[]
}

interface WideMdat {
	concept: Concept[]
}

interface Concept {
	$:{
		id:string,
		"constant-value":string,
		na:string
	},
	unit: ColumnTag[],
	value: ColumnTag[],
	modifier: Modifier[]
}

interface Modifier {
	$:{
		id:string,
		"constant-value":string,
		na:string
	},
	unit: ColumnTag[],
	value: ColumnTag[]
}

interface EAVMDat {
  concept: ColumnTag[],
  end: ColumnTag[],
  start: ColumnTag[],
  type: ColumnTag[],
  unit: ColumnTag[],
  value: ColumnTag[]
}

interface Source {
  $: {},
  seperator: string[],
  url: string[]
}

interface Virtual {
  value: ColumnTag[]
}

interface Map {
  $: {
    "set-concept"?: string
  }
  case: Case[],
  otherwise: Case[]
}

interface Case {
	$: {
		value:string,
		"set-concept"?: string,
		action?:string,
		"set-value"?:string
	}
}

interface ColumnTag {
  $: {
	column:string,
	na:string,
	"na-action":string,
	"xsi:type":string,
	"constant-value":string
  },
  map: Map[]
}