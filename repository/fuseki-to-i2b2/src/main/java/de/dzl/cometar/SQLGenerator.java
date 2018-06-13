package de.dzl.cometar;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.UnsupportedEncodingException;
import java.net.URI;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.logging.ConsoleHandler;
import java.util.logging.Handler;
import java.util.logging.Level;

import org.apache.jena.atlas.logging.LogCtl;
import org.apache.jena.fuseki.Fuseki;
import org.apache.jena.fuseki.build.FusekiConfig;
import org.apache.jena.fuseki.embedded.FusekiServer;
import org.apache.jena.query.Dataset;
import org.apache.jena.query.DatasetFactory;
import org.apache.jena.query.Query;
import org.apache.jena.query.QueryFactory;
import org.apache.jena.query.QuerySolution;
import org.apache.jena.query.ResultSet;
import org.apache.jena.rdf.model.Literal;
import org.apache.jena.riot.RDFDataMgr;
import org.apache.jena.sparql.engine.http.QueryEngineHTTP;
import org.apache.jena.sparql.function.library.leviathan.log;
import org.apache.jena.sparql.modify.UsingList;
import org.apache.jena.update.UpdateAction;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public abstract class SQLGenerator {
	int counter = 0;
	String sparqlEndpoint;
	String meta_schema = "";//"i2b2metadata.";//"public."; //i2b2metadata.
	String data_schema = "";//"i2b2demodata.";//"public."; //i2b2demodata.

	String query_top_elements = "";
	String query_child_elements = "";
	String query_notations = "";
	String query_label = "";
	String query_description = "";
	String outputDir;

	public SQLGenerator(){
		this.outputDir = "";	
		initializeQueries();
	}
	
	protected void initializeQueries()
	{
    	InputStream query_top_concepts_input = getClass().getResourceAsStream("/query_top_elements.txt");
    	InputStream query_child_elements_input = getClass().getResourceAsStream("/query_child_elements.txt");
    	InputStream query_notations_input = getClass().getResourceAsStream("/query_notations.txt");
    	InputStream query_label_input = getClass().getResourceAsStream("/query_label.txt");
    	InputStream query_description_input = getClass().getResourceAsStream("/query_description.txt");
    	
		try {
			query_top_elements = readFile(query_top_concepts_input);
			query_child_elements = readFile(query_child_elements_input);
			query_notations = readFile(query_notations_input);
			query_label = readFile(query_label_input);
			query_description = readFile(query_description_input);
		} catch (IOException e) {
			e.printStackTrace();
		}		
	}
	
	private void writePreambles() throws IOException
	{
		writeMetaSql("DELETE FROM "+meta_schema+"table_access WHERE c_table_cd LIKE 'test%';\n");
		writeMetaSql("DELETE FROM "+meta_schema+"i2b2 WHERE sourcesystem_cd='test';\n");
		writeDataSql("DELETE FROM "+data_schema+"concept_dimension WHERE sourcesystem_cd='test';\n");
	}
	
    protected void generateSQLStatements(String sparqlEndpoint) throws IOException { 

    	Dataset ds = DatasetFactory.createTxnMem() ;

		File folder = new File("C:\\Users\\stmar7\\Projekte\\Vorträge und Publikationen\\CoMetaR Evaluation\\package\\dzl_ontology_files");
		File rulesFile = new File("C:\\Users\\stmar7\\Projekte\\cometar\\repository\\config\\insertrules.ttl");
		File[] listOfFiles = folder.listFiles();		
		for (File file : listOfFiles) {
		    if (file.isFile()) {
		        RDFDataMgr.read(ds,file.getAbsolutePath()) ;
		    }
		}    
		UpdateAction.parseExecute(new UsingList(), ds.asDatasetGraph(), rulesFile.getAbsolutePath()) ;

    	FusekiServer server = FusekiServer.create()
    			  .add("/ds", ds)
    			  .build() ;
    	LogCtl.setJavaLogging();
    	LogCtl.setLevel(Fuseki.serverLogName,  "WARN");
    	LogCtl.setLevel(Fuseki.actionLogName,  "WARN");
    	LogCtl.setLevel(Fuseki.requestLogName, "WARN");
    	LogCtl.setLevel(Fuseki.adminLogName,   "WARN");
    	LogCtl.setLevel("org.eclipse.jetty",   "WARN");
    	//this.sparqlEndpoint = sparqlEndpoint;
    	URI uri = server.server.getURI();
		this.sparqlEndpoint = "http://"+uri.getHost()+":3330/ds/query";
   	
    	long time = System.currentTimeMillis();
    	//this.sparqlEndpoint = sparqlEndpoint;
    	try {
        	server.start() ;
	    	initializeWriters();
	    	writePreambles();
	    	
	    	System.out.println("Starting statement generation.");			
	    	
			List<String>[] topElements = getTopElements();
			for (String elementName : topElements[0])
			{
				String label = getLabel(elementName);
				String elementType = topElements[1].get(topElements[0].indexOf(elementName));
		    	System.out.println("Generating statements for tree: "+label);
				//if (label.equals("Specimen")) 
					recursivelyRunThroughConceptsAndGenerateStatements(elementName, elementType, new ArrayList<String>(), false, null);
		    }
    	} finally {
    		closeWriters();
    		server.stop();
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
		String label = getLabel(element);	
		String description = getDescription(element);
		if (description.isEmpty()) description = label;
    	List<String>[] childElements = getChildren(element);
    	List<String> childNames = childElements[0];
    	List<String> childTypes = childElements[1];
    	List<Literal> notations = getNotations(element);
    	//TODO nur eine notation oder mehrere?
		
		boolean isRootElement = ancestors.size() == 0 && !isModifier;
		String notation = (notations.size() == 1)?notations.get(0).getString():null;
		String visualAttribute;
		if (type.equals("collection")) visualAttribute = "CA";
		else if (childNames.size() > 0) visualAttribute = type.equals("modifier")?"DA":"FA";
		else if (notations.size() <= 1) visualAttribute = type.equals("modifier")?"RA":"LA";
		else visualAttribute = "MA";
		String current_timestamp = (new SimpleDateFormat("yyyy-MM-dd HH:mm:ss.0")).format(new Date());
		/*
		 * Building two i2b2 paths, one with and one without prefixes of form:
		 * [\i2b2]\ancestor 0\ancestor 1\...\ancestor n\concept\
		 */
		String concept_long = isModifier?"\\":"\\i2b2\\";
		String concept_short = "\\";
		int c_hlevel = ancestors.size()+1;
		for (String ancestor_name : ancestors)
		{
			concept_long += getName(ancestor_name, true)+"\\";
			concept_short += getName(ancestor_name, false)+"\\";
		}
		concept_long += getName(element, true)+"\\";
		concept_short += getName(element, false)+"\\";

		if (childNames.size() == 0) counter+=1;	
		//Write statements for concept. In case of not exactly one concept notation, String notation will be "NULL".
		generateI2b2InsertStatement(c_hlevel, notation, concept_long, concept_short, label, description, visualAttribute, current_timestamp, isModifier, appliedPath);
		if (isRootElement)
			generateTableAccessInsertStatement(concept_long, concept_short, label, visualAttribute);		
		if (notation != null)
		{
			if (isModifier) generateModifierDimensionInsertStatement(notation, concept_long, label, current_timestamp);
			else generateConceptDimensionInsertStatement(notation, concept_long, label, current_timestamp);
		}

		//in case of multiple notations
		if (notations.size() > 1)
		{
			System.out.println(concept_short);
			//If the concept also has children, insert an additional i2b2 path layer.
			if (childNames.size() > 0)
			{
				c_hlevel++;
				visualAttribute = "MH";
				concept_long += "multiple notations\\";
				concept_short += "multiple notations\\";
				
				generateI2b2InsertStatement(c_hlevel, "", concept_long, concept_short, "_.-^''äbendies''^-._", description, visualAttribute, current_timestamp, isModifier, appliedPath);
			}		
			//Write INSERT statements for all notations.
			c_hlevel++;
			visualAttribute = "LH";
			for (int i = 0; i < notations.size(); i++)
			{
				String concept_long_sub = concept_long + i+"\\";
				String concept_short_sub = concept_short + i+"\\";
				notation = notations.get(i).getString();
				
				generateI2b2InsertStatement(c_hlevel, notation, concept_long_sub, concept_short_sub, label, description, visualAttribute, current_timestamp, isModifier, appliedPath);
				if (isModifier) generateModifierDimensionInsertStatement(notation, concept_long_sub, label, current_timestamp);
				else generateConceptDimensionInsertStatement(notation, concept_long_sub, label, current_timestamp);
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
				recursivelyRunThroughConceptsAndGenerateStatements(childName, childType, new ArrayList<String>(), true, concept_long+"%");				
			}
	    }   
	}
	
	private void generateI2b2InsertStatement(int c_hlevel, String notation, String concept_long, String concept_short,
			String label, String description, String visualAttribute, String current_timestamp, boolean isModifier, String appliedPath) throws IOException
	{
		String statement = 
				"INSERT INTO "+meta_schema+"i2b2("+
					"c_hlevel,c_fullname,c_name,c_synonym_cd,c_visualattributes,"+
					"c_basecode,c_metadataxml,c_facttablecolumn,c_tablename,c_columnname,"+
					"c_columndatatype,c_operator,c_dimcode,c_tooltip,m_applied_path,"+
					"update_date,download_date,import_date,sourcesystem_cd)"+
				"VALUES("+
					c_hlevel+",'"+concept_long+"','"+label+"','N','"+visualAttribute+"',"+
					(notation != null ? "'"+notation+"'" : "NULL")+",NULL,"+(isModifier?"'modifier_cd'":"'concept_cd'")+","+(isModifier?"'modifier_dimension'":"'concept_dimension'")+","+(isModifier?"'modifier_path'":"'concept_path'")+","+
					//"'T','LIKE','"+concept_long+"',"+(isModifier?"NULL":"'"+concept_short+"'")+",'"+(appliedPath != null? appliedPath : "@")+"',"+
					"'T','LIKE','"+concept_long+"','"+description+"','"+(appliedPath != null? appliedPath : "@")+"',"+
					"current_timestamp,'"+current_timestamp+"',current_timestamp,'test'"+
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
				"'"+current_timestamp+"',current_timestamp,'test'"+
			");\n";
		writeDataSql(statement);	
	}
	
	private void generateModifierDimensionInsertStatement(String notation, String concept_long,
			String label, String current_timestamp) throws IOException
	{
		String statement = 
			"INSERT INTO "+data_schema+"modifier_dimension("+
				"modifier_path,modifier_cd,name_char,update_date,"+
				"download_date,import_date,sourcesystem_cd"+
			")VALUES("+
				"'"+concept_long+"','"+notation+"','"+label+"',current_timestamp,"+
				"'"+current_timestamp+"',current_timestamp,'test'"+
			");\n";
		writeDataSql(statement);	
	}
	
	private void generateTableAccessInsertStatement(String concept_long, String concept_short,
			String label, String visualAttribute) throws IOException
	{
		String statement = 
				"INSERT INTO "+meta_schema+"table_access("+
					"c_table_cd,c_table_name,c_protected_access,c_hlevel,c_fullname,"+
					"c_name,c_synonym_cd,c_visualattributes,c_facttablecolumn,c_dimtablename,"+
					"c_columnname,c_columndatatype,c_operator,c_dimcode,c_tooltip"+
				")VALUES("+
					"'test_8883d7b2','i2b2','N',1,'"+concept_long+"',"+
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

		return notations;
	}
	
	private List<String>[] getTopElements()
	{	
		List<String> elements = new ArrayList<String>();
		List<String> types = new ArrayList<String>();
		
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
		List<String>[] r = new List[2];
		r[0] = elements;
		r[1] = types;
		return r;
	}
	
	private List<String>[] getChildren(String element)
	{
		List<String> elements = new ArrayList<String>();
		List<String> types = new ArrayList<String>();
		
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
		List<String>[] r = new List[2];
		r[0] = elements;
		r[1] = types;
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
			throw new NullPointerException("Concept without prefLabel: "+concept);
		}
		QuerySolution solution = results.next();			
		String label = solution.getLiteral("label").getString();
		// possibly generate error if there are multiple labels
		return cleanLabel(label);
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
		return cleanLabel(description);
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
		name = name.replace("http://data.dzl.de/ont/dwh#", "dzl:");
		name = name.replace("http://purl.bioontology.org/ontology/SNOMEDCT/", "S:");
		name = name.replace("http://loinc.org/owl#", "L:");
		if (!withPrefix)
		{
			String[] split = name.split(":");
			name = split[split.length-1];
		}
		return name;
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
