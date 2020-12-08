package de.dzl.cometar;

import java.io.BufferedReader;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.UnsupportedEncodingException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;

import org.apache.jena.query.Query;
import org.apache.jena.query.QueryFactory;
import org.apache.jena.query.QuerySolution;
import org.apache.jena.query.ResultSet;
import org.apache.jena.rdf.model.Literal;
import org.apache.jena.sparql.engine.http.QueryEngineHTTP;

public abstract class SQLGenerator {
	String meta_schema;
	String data_schema;
	String sparqlEndpoint;
	String sourcesystem;
	String ontology_tablename;
	String i2b2_path_prefix;
	Map<String, String> mappings;
	String outputDir;

	int counter = 0;

	public SQLGenerator(){
		initializeQueries();
	}

	String query_top_elements = "";
	String query_datatype = "";
	String query_child_elements = "";
	String query_notations = "";
	String query_label = "";
	String query_display_label = "";
	String query_description = "";	
	String query_display = "";
	String query_unit = "";
	
	protected void initializeQueries()
	{
    	InputStream query_top_concepts_input = getClass().getResourceAsStream("/query_top_elements.txt");
    	InputStream query_child_elements_input = getClass().getResourceAsStream("/query_child_elements.txt");
    	InputStream query_notations_input = getClass().getResourceAsStream("/query_notations.txt");
    	InputStream query_label_input = getClass().getResourceAsStream("/query_label.txt");
    	InputStream query_display_label_input = getClass().getResourceAsStream("/query_display_label.txt");
    	InputStream query_datatype_input = getClass().getResourceAsStream("/query_datatype.txt");
    	InputStream query_unit_input = getClass().getResourceAsStream("/query_unit.txt");
    	InputStream query_description_input = getClass().getResourceAsStream("/query_description.txt");
    	InputStream query_display_input = getClass().getResourceAsStream("/query_display.txt");
    	
		try {
			query_top_elements = readFile(query_top_concepts_input);
			query_child_elements = readFile(query_child_elements_input);
			query_notations = readFile(query_notations_input);
			query_label = readFile(query_label_input);
			query_display_label = readFile(query_display_label_input);
			query_datatype = readFile(query_datatype_input);
			query_unit = readFile(query_unit_input);
			query_description = readFile(query_description_input);
			query_display = readFile(query_display_input);
		} catch (IOException e) {
			e.printStackTrace();
		}		
	}
	
	private void writePreambles() throws IOException
	{
		writeMetaSql("DELETE FROM "+meta_schema+"table_access WHERE c_table_cd LIKE 'i2b2_%';\n");
		writeMetaSql("DELETE FROM "+meta_schema+ontology_tablename+" WHERE sourcesystem_cd='"+sourcesystem+"';\n");
		writeDataSql("DELETE FROM "+data_schema+"concept_dimension WHERE sourcesystem_cd='"+sourcesystem+"';\n");
		writeDataSql("DELETE FROM "+data_schema+"modifier_dimension WHERE sourcesystem_cd='"+sourcesystem+"';\n");
	}
	
    protected void generateSQLStatements() throws IOException { 
    	long time = System.currentTimeMillis();
    	try {
	    	initializeWriters();
	    	writePreambles();
	    	
	    	System.out.println("Starting statement generation.");			
	    	
			ArrayList<ArrayList<String>> topElements = getTopElements();
			for (String elementName : topElements.get(0))
			{
				String label = getLabel(elementName);
				String elementType = topElements.get(1).get(topElements.get(0).indexOf(elementName));
		    	System.out.println("Generating statements for tree: "+label);
				//if (label.equals("Specimen")) 
					recursivelyRunThroughConceptsAndGenerateStatements(elementName, elementType, new ArrayList<String>(), false, null);
		    }
    	} finally {
    		closeWriters();
    	}
		System.out.println("done");
		System.out.println("Counter: "+counter);
		long timePassed = (System.currentTimeMillis() - time)/1000;
		System.out.println("Duration: "+timePassed+" seconds");	
	}
	
    /**
     * Recursively writes statements for the concept and it's child-concepts.
     * 
     * Every concept gets an entry in the i2b2 table.
     * Every schema-topconcept also gets an entry in the table-access table.
     * Every concept with notation gets an entry (for every notation) in the concept_dimension table.
     * 
     * In case that a concept has multiple notations it will be marked with visualAttribute="MA" 
     * and for all notations there will be written another INSERT statement one i2b2-path level below.
     * 		e.g. 	\ancestor path\concept\							visualAttribute="MA"	notation="NULL"
     * 				\ancestor path\concept\0\						visualAttribute="LA"	notation="'notation0'"
     * 				\ancestor path\concept\1\						visualAttribute="LA"	notation="'notation1'"
     * In case that a concept additionally has children another virtual path layer will be inserted.
     * 		e.g.	\ancestor path\concept\							visualAttribute="FA" 	notation="NULL"
     * 				\ancestor path\concept\multiple notations\		visualAttribute="MA" 	notation="NULL"
     * 				\ancestor path\concept\multiple notations\0\	visualAttribute="LA" 	notation="'notation0'"
     * 				\ancestor path\concept\multiple notations\1\	visualAttribute="LA" 	notation="'notation1'"
     * 				\ancestor path\concept\child concept\			
     * 
     * @param writer_meta A file-writer for meta.sql.
     * @param writer_data A file-writer for data.sql.
     * @param concept The full URI of the concept.
     * @param ancestors List of full URIs of all ancestor concepts
     * @throws IOException
     */
	private void recursivelyRunThroughConceptsAndGenerateStatements(String element, String type, ArrayList<String> ancestors, boolean isModifier, String appliedPath) throws IOException
	{		
		String current_timestamp = (new SimpleDateFormat("yyyy-MM-dd HH:mm:ss.0")).format(new Date());
		String label = getLabel(element);	
		String displayLabel = getDisplayLabel(element);
		if (displayLabel == null) displayLabel = label;
		String datatypexml = getDatatypeXml(element, current_timestamp);
		String description = getDescription(element);
		boolean i2b2Hidden = getDisplay(element).equals("i2b2Hidden");
		
		if (description.isEmpty()) description = label;
    	ArrayList<ArrayList<String>> childElements = getChildren(element);
    	List<String> childNames = childElements.get(0);
    	List<String> childTypes = childElements.get(1);
    	List<Literal> notations = getNotations(element);
		
		boolean isRootElement = ancestors.size() == 0 && !isModifier;
		String notationPrefix = (notations.size() == 1)?getNotationPrefix(notations.get(0)):"";
		String notation = (notations.size() == 1)?notationPrefix + notations.get(0).getString():null;
		String visualAttribute;
		String visualAttributePartOne;
		String visualAttributePartTwo = i2b2Hidden?"H":"A";
		if (type.equals("collection")) visualAttributePartOne = "C";
		else if (childNames.size() > 0) visualAttributePartOne = isModifier?"D":"F";
		else if (notations.size() <= 1) visualAttributePartOne = isModifier?"R":"L";
		else visualAttributePartOne = "M";
		visualAttribute = visualAttributePartOne+visualAttributePartTwo;
		/*
		 * Building two i2b2 paths, one with and one without prefixes of form:
		 * [\i2b2]\ancestor 0\ancestor 1\...\ancestor n\concept\
		 */
		String element_path = isModifier?"\\":i2b2_path_prefix+"\\";
		int c_hlevel = ancestors.size()+(isModifier?1:2);
		for (String ancestor_name : ancestors)
		{
			element_path += getName(ancestor_name, true)+"\\";
		}
		element_path += getName(element, true)+"\\";

		counter+=1;	
		//Write statements for concept. In case of not exactly one concept notation, String notation will be "NULL".
		generateI2b2InsertStatement(c_hlevel, notation, element_path, displayLabel, description, visualAttribute, current_timestamp, isModifier, appliedPath, datatypexml);
		if (isRootElement)
			generateTableAccessInsertStatement(element_path, displayLabel, visualAttribute);		
		if (notation != null)
		{
			if (isModifier) generateModifierDimensionInsertStatement(notation, element_path, label, current_timestamp);
			else generateConceptDimensionInsertStatement(notation, element_path, label, current_timestamp);
		}

		//in case of multiple notations
		if (notations.size() > 1)
		{
			//If the concept also has children, insert an additional i2b2 path layer.
			if (childNames.size() > 0)
			{
				c_hlevel++;
				//H für HIDDEN
				visualAttribute = "MH";
				element_path += "MULTI\\";
				
				generateI2b2InsertStatement(c_hlevel, "", element_path, "MULTI", description, visualAttribute, current_timestamp, isModifier, appliedPath, datatypexml);
			}		
			//Write INSERT statements for all notations.
			c_hlevel++;
			visualAttribute = "LH";
			for (int i = 0; i < notations.size(); i++)
			{
				String element_path_sub = element_path + i+"\\";
				notationPrefix = getNotationPrefix(notations.get(i));
				notation = notationPrefix + notations.get(i).getString();
				
				generateI2b2InsertStatement(c_hlevel, notation, element_path_sub, displayLabel, description, visualAttribute, current_timestamp, isModifier, appliedPath, datatypexml);
				if (isModifier) generateModifierDimensionInsertStatement(notation, element_path_sub, label, current_timestamp);
				else generateConceptDimensionInsertStatement(notation, element_path_sub, label, current_timestamp);
			}
		}
			
		ancestors.add(element);
		for (String childName : childNames)
		{
			String childType = childTypes.get(childNames.indexOf(childName));
			if (childType.equals("concept") || childType.equals("collection"))
			{
				@SuppressWarnings("unchecked")
				ArrayList<String> ancestors_names_clone = (ArrayList<String>) ancestors.clone();
				recursivelyRunThroughConceptsAndGenerateStatements(childName, childType, ancestors_names_clone, isModifier, appliedPath);				
			}
			else if (childType.equals("modifier"))
			{
				recursivelyRunThroughConceptsAndGenerateStatements(childName, childType, new ArrayList<String>(), true, element_path+"%");				
			}
	    }   
	}
	
	private void generateI2b2InsertStatement(int c_hlevel, String notation, String concept_long, 
			String label, String description, String visualAttribute, String current_timestamp, 
			boolean isModifier, String appliedPath, String datatypexml) throws IOException
	{
		String statement = 
				"INSERT INTO "+meta_schema+ontology_tablename+"("+
					"c_hlevel,c_fullname,c_name,c_synonym_cd,c_visualattributes,"+
					"c_basecode,c_metadataxml,c_facttablecolumn,c_tablename,c_columnname,"+
					"c_columndatatype,c_operator,c_dimcode,c_tooltip,m_applied_path,"+
					"update_date,download_date,import_date,sourcesystem_cd)"+
				"VALUES("+
					c_hlevel+",'"+concept_long+"','"+label+"','N','"+visualAttribute+"',"+
					(notation != null ? "'"+notation+"'" : "NULL")+","+datatypexml+","+(isModifier?"'modifier_cd'":"'concept_cd'")+","+(isModifier?"'modifier_dimension'":"'concept_dimension'")+","+(isModifier?"'modifier_path'":"'concept_path'")+","+
					"'T','LIKE','"+concept_long+"','"+description+"','"+(appliedPath != null? appliedPath : "@")+"',"+
					"current_timestamp,'"+current_timestamp+"',current_timestamp,'"+sourcesystem+"'"+
				");\n";
		writeMetaSql(statement);
	}
	
	private void generateConceptDimensionInsertStatement(String notation, String concept_long,
			String label, String current_timestamp) throws IOException
	{
		String statement = 
			"INSERT INTO "+data_schema+"concept_dimension("+
				"concept_path,concept_cd,name_char,update_date,"+
				"download_date,import_date,sourcesystem_cd"+
			")VALUES("+
				"'"+concept_long+"','"+notation+"','"+label+"',current_timestamp,"+
				"'"+current_timestamp+"',current_timestamp,'"+sourcesystem+"'"+
			");\n";
		writeDataSql(statement);	
	}
	
	private ArrayList<String> uniqueModifiers = new ArrayList<String>();
	private void generateModifierDimensionInsertStatement(String notation, String concept_long,
			String label, String current_timestamp) throws IOException
	{
		if (uniqueModifiers.indexOf(concept_long) > -1) return;
		uniqueModifiers.add(concept_long);
		String statement = 
			"INSERT INTO "+data_schema+"modifier_dimension("+
				"modifier_path,modifier_cd,name_char,update_date,"+
				"download_date,import_date,sourcesystem_cd"+
			")VALUES("+
				"'"+concept_long+"','"+notation+"','"+label+"',current_timestamp,"+
				"'"+current_timestamp+"',current_timestamp,'"+sourcesystem+"'"+
			");\n";
		writeDataSql(statement);	
	}
	
	private void generateTableAccessInsertStatement(String concept_long, 
			String label, String visualAttribute) throws IOException
	{
		String statement = 
				"INSERT INTO "+meta_schema+"table_access("+
					"c_table_cd,c_table_name,c_protected_access,c_hlevel,c_fullname,"+
					"c_name,c_synonym_cd,c_visualattributes,c_facttablecolumn,c_dimtablename,"+
					"c_columnname,c_columndatatype,c_operator,c_dimcode,c_tooltip"+
				")VALUES("+
					"'i2b2_"+Integer.toHexString(concept_long.hashCode())+"','"+ontology_tablename+"','N',1,'"+concept_long+"',"+
					"'"+label+"','N','"+visualAttribute+"','concept_cd','concept_dimension',"+
					"'concept_path','T','LIKE','"+concept_long+"','"+label+"'"+
				");\n";
		writeMetaSql(statement);
	}
	
	private List<Literal> getNotations(String concept)
	{	
		List<Literal> notations = new ArrayList<Literal>();
		
    	String queryString = query_notations.replace("<CONCEPT>", "<"+concept+">");
		Query query = QueryFactory.create(queryString);
		QueryEngineHTTP httpQuery = new QueryEngineHTTP(sparqlEndpoint, query);
		ResultSet results = httpQuery.execSelect();

		while (results.hasNext()) {
			QuerySolution solution = results.next();		
			Literal notation = (Literal) solution.get("notation");
			notations.add(notation);
		}
		
		httpQuery.close();

		return notations;
	}
	
	private ArrayList<ArrayList<String>> getTopElements()
	{	
		ArrayList<String> elements = new ArrayList<String>();
		ArrayList<String> types = new ArrayList<String>();
		
    	String queryString = query_top_elements;
		Query query = QueryFactory.create(queryString);
		QueryEngineHTTP httpQuery = new QueryEngineHTTP(sparqlEndpoint, query);
		ResultSet results = httpQuery.execSelect();
		
		while (results.hasNext()) {
			QuerySolution solution = results.next();	
			elements.add(solution.get("element").toString());
			types.add(solution.get("type").toString());
		}

		httpQuery.close();
		ArrayList<ArrayList<String>> r = new ArrayList<ArrayList<String>>();
		r.add(elements);
		r.add(types);
		return r;
	}
	
	private ArrayList<ArrayList<String>> getChildren(String element)
	{
		ArrayList<String> elements = new ArrayList<String>();
		ArrayList<String> types = new ArrayList<String>();
		
    	String queryString = query_child_elements.replace("TOPELEMENT", "<"+element+">");
    	
		Query query = QueryFactory.create(queryString);
		QueryEngineHTTP httpQuery = new QueryEngineHTTP(sparqlEndpoint, query);
		ResultSet results = httpQuery.execSelect();
		while (results.hasNext()) {
			QuerySolution solution = results.next();		
			elements.add(solution.get("element").toString());
			types.add(solution.get("type").toString());
		}
		httpQuery.close();
		ArrayList<ArrayList<String>> r = new ArrayList<ArrayList<String>>();
		r.add(elements);
		r.add(types);
		return r;
	}
	
	/*private List<String> getModifiers(String concept)
	{
		List<String> modifiers = new ArrayList<String>();
		
    	String queryString = query_modifiers.replace("<CONCEPT>", "<"+concept+">");
		Query query = QueryFactory.create(queryString);
		QueryEngineHTTP httpQuery = new QueryEngineHTTP(sparqlEndpoint, query);
		ResultSet results = httpQuery.execSelect();
		
		while (results.hasNext()) {
			QuerySolution solution = results.next();			
			modifiers.add(solution.get("modifier").toString());
		}
		
		return modifiers;
	}*/
	
	/**
	 * Retrieve the label for the given concept.
	 * @param concept concept URI
	 * @return preferred label
	 * @throws NullPointerException if there is no preferred label for the given concept
	 */
	private String getLabel(String concept) throws NullPointerException
	{
    	String queryString = query_label.replace("<CONCEPT>", "<"+concept+">");
		Query query = QueryFactory.create(queryString);
		QueryEngineHTTP httpQuery = new QueryEngineHTTP(sparqlEndpoint, query);
		ResultSet results = httpQuery.execSelect();
		if( !results.hasNext() ){
			httpQuery.close();
			throw new NullPointerException("Concept without prefLabel: "+concept);
		}
		QuerySolution solution = results.next();
		String label = solution.getLiteral("label").getString();
		httpQuery.close();
		// possibly generate error if there are multiple labels
		return cleanLabel(label);
	}
	
	private String getDisplayLabel(String concept) throws NullPointerException
	{
    	String queryString = query_display_label.replace("<CONCEPT>", "<"+concept+">");
		Query query = QueryFactory.create(queryString);
		QueryEngineHTTP httpQuery = new QueryEngineHTTP(sparqlEndpoint, query);
		ResultSet results = httpQuery.execSelect();
		if( !results.hasNext() ){
			httpQuery.close();
			return null;
		}
		QuerySolution solution = results.next();
		String displayLabel = solution.getLiteral("displayLabel").getString();
		httpQuery.close();
		return cleanLabel(displayLabel);
	}
	
	private String getDatatypeXml(String concept, String current_timestamp) throws NullPointerException
	{
    	String queryString = query_datatype.replace("<CONCEPT>", "<"+concept+">");
		Query query = QueryFactory.create(queryString);
		QueryEngineHTTP httpQuery = new QueryEngineHTTP(sparqlEndpoint, query);
		ResultSet results = httpQuery.execSelect();
		String datatype = "";
		if( results.hasNext() ){
			QuerySolution solution = results.next();			
			datatype = solution.getLiteral("datatype").getString();
		}
		httpQuery.close();
		String datatypexml = "NULL";
		if (!datatype.equals("")){
			datatypexml = "'<ValueMetadata><Version>3.02</Version><CreationDateTime>"+current_timestamp+"</CreationDateTime><DataType>";
			switch (datatype) {
				case "integer":
					datatypexml += "Integer";
					break;
				case "float":
					datatypexml += "Float";
					break;
				case "largeString":
					datatypexml += "largestring";
					break;
				default:
					datatypexml += "String";
			}
			if (datatype.equals("integer") || datatype.equals("float")) {
			datatypexml += "</DataType><Oktousevalues>Y</Oktousevalues>";
				datatypexml += "<UnitValues>";
				
				String unitQueryString = query_unit.replace("<CONCEPT>", "<"+concept+">");
				Query unitQuery = QueryFactory.create(unitQueryString);
				QueryEngineHTTP unitHttpQuery = new QueryEngineHTTP(sparqlEndpoint, unitQuery);
				ResultSet unitResults = unitHttpQuery.execSelect();
				String normalunit = "";
				if( unitResults.hasNext() ){
					QuerySolution unitSolution = unitResults.next();			
					normalunit = unitSolution.getLiteral("unit").getString();
					datatypexml += "<NormalUnits>"+normalunit+"</NormalUnits>";			
					
					String equalunit = "";
					while (unitResults.hasNext()) {
						unitSolution = unitResults.next();		
						equalunit = unitSolution.getLiteral("unit").getString();
						datatypexml += "<EqualUnits>"+equalunit+"</EqualUnits>";
						datatypexml += "<ConvertingUnits><Units>"+equalunit+"</Units><MultiplyingFactor>";
						double factor = 1.0;
						if (normalunit.toLowerCase().equals("cm") && equalunit.toLowerCase().equals("m")) {
							factor = 100.0;
						}
						else if (normalunit.toLowerCase().equals("mg/dl") && equalunit.toLowerCase().equals("mmol/l")) {
							factor = 18.02;
						}
						datatypexml += factor + "</MultiplyingFactor></ConvertingUnits>";
					}
				}
				unitHttpQuery.close();
							
				datatypexml += "</UnitValues>";
			}
			datatypexml += "</ValueMetadata>'";
		}
		return datatypexml;
	}
	
	private String getDescription(String concept) throws NullPointerException
	{
    	String queryString = query_description.replace("<CONCEPT>", "<"+concept+">");
		Query query = QueryFactory.create(queryString);
		QueryEngineHTTP httpQuery = new QueryEngineHTTP(sparqlEndpoint, query);
		ResultSet results = httpQuery.execSelect();
		String description = "";
		if( results.hasNext() ){
			QuerySolution solution = results.next();			
			description = solution.getLiteral("description").getString();
		}
		httpQuery.close();
		return cleanLabel(description);
	}
	
	private String getDisplay(String concept) throws NullPointerException
	{
    	String queryString = query_display.replace("<CONCEPT>", "<"+concept+">");
		Query query = QueryFactory.create(queryString);
		QueryEngineHTTP httpQuery = new QueryEngineHTTP(sparqlEndpoint, query);
		ResultSet results = httpQuery.execSelect();
		String display = "";
		if( results.hasNext() ){
			QuerySolution solution = results.next();			
			display = solution.getLiteral("display").getString();
		}
		httpQuery.close();
		return cleanLabel(display);
	}
	
	private String cleanLabel(String label)
	{
		label = label.replaceAll("'", "''");
		label = label.replaceAll("\"", "&quot;");
		label = label.replaceAll("\\s+", " ");
		return label;
	}
	
	private String getName(String uri, boolean withPrefix)
	{
		String name = uri;
		for (String key : mappings.keySet())
		{
			name = name.replace(key, mappings.get(key));
		}
		if (!withPrefix)
		{
			String[] split = name.split(":");
			name = split[split.length-1];
		}
		return name;
	}
	
	private String getNotationPrefix(Literal notation)
	{
		if (mappings.containsKey(notation.getDatatypeURI())) return mappings.get(notation.getDatatypeURI());
		return "";
	}

	private String readFile(InputStream is) throws IOException {
		
	    String         line = null;
	    StringBuilder  stringBuilder = new StringBuilder();
	    String         ls = System.getProperty("line.separator");

	    try (BufferedReader reader = new BufferedReader(new InputStreamReader(is))){
	        while((line = reader.readLine()) != null) {
	            stringBuilder.append(line);
	            stringBuilder.append(ls);
	        }

	        return stringBuilder.toString();
	    }
	}

	protected abstract void initializeWriters() throws UnsupportedEncodingException, FileNotFoundException;
	protected abstract void closeWriters() throws IOException;
	protected abstract void writeDataSql(String statement) throws IOException;
	protected abstract void writeMetaSql(String statement) throws IOException;
}
