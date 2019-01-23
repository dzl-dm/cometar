import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ClientConfigurationService {
  private cc:ClientConfiguration;
  constructor() { }

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
			et.virtual[0].value.forEach(v => {
				let column = v.$.column;
				if (v.map[0]) {
					this.readMapIntoMappings(v.map[0], file, column, "", 
					  v.$ && v.$.na || mdat.value && mdat.value[0].$ && mdat.value[0].$.na,
						v.$ && v.$["na-action"]=="drop-fact" || mdat.value && mdat.value[0].$ && mdat.value[0].$["na-action"]=="drop-fact" || false,
						v.$ && v.$["constant-value"] || mdat.value && mdat.value[0].$ && mdat.value[0].$["constant-value"],
						mdat.unit && mdat.unit[0].$ && ( mdat.unit[0].$.column || mdat.unit[0].$["constant-value"] ));
				}
			});
		});

		if (this.config.datasource["wide-table"]) this.config.datasource["wide-table"].forEach(wt => {
			let file = wt.source[0].url[0];
			wt.mdat[0].concept.forEach(c => {
				let concept = c.$.id;
				let value = c.value[0];
				let column = value.$ && value.$.column || value.$ && value.$["constant-value"] == value.$.na && "constant-value";
				let unit = c.unit && c.unit[0].$ && ( c.unit[0].$.column || "\""+c.unit[0].$["constant-value"]+"\"" );
				let constantvalue = value.$ && value.$["constant-value"];
				if (value.map) {
					this.readMapIntoMappings(value.map[0],file,column,concept,
						value.$ && value.$.na, 
						value.$ && value.$["na-action"] == "drop-fact" || false, 
						constantvalue, 
						unit);
				}
				else {
					this.getMapping(concept, value.$ && value.$.na, value.$ && value.$["na-action"] == "drop-fact" || false, unit, constantvalue).occurances.push({
						column: column,
						file: file,
						drop: false
					});					
				}
			});
		});

		return this.mappings;
	}

	/**
	 * TODO: otherwise speziell behandeln
	 * 
	 * @param map 
	 * @param file 
	 * @param column 
	 * @param concept 
	 */
	private readMapIntoMappings(map:Map, file:string, column:string, concept:string, navalue?:string, nadrop?:boolean, constantvalue?:string, unit?:string){
		let mapconcept = map.$ && map.$["set-concept"] || concept;
		let cases = map.case && map.otherwise && map.case.concat(map.otherwise) || map.case || map.otherwise;
		if (cases) {
			let excludedvalues = []; // for otherwise set-concept
			cases.forEach(c => {
				let caseconcept = c.$ && c.$["set-concept"] || mapconcept;
				if (map.otherwise && c != map.otherwise[0] && c.$ && c.$.value) excludedvalues.push(c.$.value);
				this.getMapping(caseconcept, navalue, nadrop, unit, constantvalue).occurances.push({
					column: column,
					file: file,
					value: constantvalue || c.$ && c.$.value,
					drop: c.$ && c.$.action == "drop-fact" || false,
					setvalue: c.$ && c.$["set-value"],
					excludedvalues: map.otherwise && c == map.otherwise[0] && excludedvalues || []
				});
			});
		}
		else {
			this.getMapping(mapconcept,navalue,nadrop,unit, constantvalue).occurances.push({
				column: column,
				file: file,
				drop: false
			});
		}
	}

	private getMapping(concept:string, navalue?:string, nadrop?:boolean, unit?:string, constantvalue?:string):Mapping{
		let mapping = this.mappings.filter(m => m.concept == concept)[0];
		if (!mapping) {
			mapping = {
				concept: concept,
				occurances: [],
				navalue: navalue,
				nadrop: nadrop,
				unit: unit,
				constantvalue: constantvalue
			}
			this.mappings.push(mapping);
		}
		return mapping;
	}

  public getTreeLines(m:Mapping):string[][]{
    let result = [];

    let s = m.concept + ": ";
    m.occurances.forEach(o => {
      if (o.drop) return;

      let column = o.file+"/"+o.column;
      let value = "";
      let mappedvalue = "";
      let unit = "";

      let isBoolean = m.navalue != undefined && m.nadrop == false;
      if (o.value) {
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
          mappedvalue = "true";
        }
        else value = "\""+o.value+"\"";
      }
      else if (o.excludedvalues && o.excludedvalues.length > 0){
        value = "NOT(\""+o.excludedvalues.join("\",\"")+"\")";
        mappedvalue = "true";
      }
      else if (m.constantvalue == m.navalue) {
        mappedvalue = "true";
      }
      if (m.unit) unit = ""+m.unit+"";
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

interface Mapping {
	concept:string,
	occurances:Occurance[],	
	navalue?:string,
	nadrop?:boolean,
	unit?:string,
	constantvalue?:string
}
interface Occurance {
	file:string,
	column:string,
	value?:string,
	drop?:boolean,
	setvalue?:string,
	excludedvalues?:string[]
}

export interface IClientConfiguration {
  "datasource": {
    $:{},
    "eav-table":EAVTable[],
    meta:{},
    "patient-table":{},
	"visit-table":{},
	"wide-table":WideTable[]
  }
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
	$:{id:string},
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