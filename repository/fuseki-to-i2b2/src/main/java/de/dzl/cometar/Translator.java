package de.dzl.cometar;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.UnsupportedEncodingException;
import java.io.Writer;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import com.hp.hpl.jena.query.Query;
import com.hp.hpl.jena.query.QueryFactory;
import com.hp.hpl.jena.query.QuerySolution;
import com.hp.hpl.jena.query.ResultSet;
import com.hp.hpl.jena.query.Syntax;
import com.hp.hpl.jena.sparql.engine.http.QueryEngineHTTP;

public class Translator {
	String sparqlEndpoint = "https://data.dzl.de/fuseki/cometar_live/query";
	String meta_schema = "public"; //i2b2metadata
	String data_schema = "public"; //i2b2demodata

	String query_top_concepts = "";
	String query_child_concepts = "";
	String query_notations = "";
	String query_label = "";

    public void translate() {
    	InputStream query_top_concepts_input = getClass().getResourceAsStream("/query_top_concepts.txt");
    	InputStream query_child_concepts_input = getClass().getResourceAsStream("/query_child_concepts.txt");
    	InputStream query_notations_input = getClass().getResourceAsStream("/query_notations.txt");
    	InputStream query_label_input = getClass().getResourceAsStream("/query_label.txt");

		try {
			query_top_concepts = readFile(query_top_concepts_input);
			query_child_concepts = readFile(query_child_concepts_input);
			query_notations = readFile(query_notations_input);
			query_label = readFile(query_label_input);
			
			Writer writer_meta = new BufferedWriter(new OutputStreamWriter(new FileOutputStream("target/meta.sql"), "utf-8"));
			writer_meta.write("DELETE FROM "+meta_schema+".table_access WHERE c_table_cd LIKE 'test%';\n");
			writer_meta.write("DELETE FROM "+meta_schema+".i2b2 WHERE sourcesystem_cd='test';\n");
			
			Writer writer_data = new BufferedWriter(new OutputStreamWriter(new FileOutputStream("target/data.sql"), "utf-8"));
			writer_data.write("DELETE FROM "+data_schema+".concept_dimension WHERE sourcesystem_cd='test';\n");
			
			List<String> topConcepts = getTopConcepts();
			for (String concept : topConcepts)
			{
				writeInsertStatements(writer_meta, writer_data, concept, new ArrayList<String>());
		    }
			
			writer_meta.close();
			writer_data.close();
		} catch (UnsupportedEncodingException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (FileNotFoundException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		
		System.out.println("done");
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
	public void writeInsertStatements(Writer writer_meta, Writer writer_data, String concept, ArrayList<String> ancestors) throws IOException
	{		
		String label = getLabel(concept);		
    	List<String> children = getChildren(concept);
		List<String> notations = getNotations(concept);
		
		boolean isRootElement = ancestors.size() == 0;
		String notation = (notations.size() == 1)?notations.get(0):"NULL";
		String visualAttribute;
		if (children.size() > 0) visualAttribute = "FA";
		else if (notations.size() <= 1) visualAttribute = "LA";
		else visualAttribute = "MA";
		String current_timestamp = (new SimpleDateFormat("yyyy-MM-dd HH:mm:ss.0")).format(new Date());
		/*
		 * Building two i2b2 paths, one with and one without prefixes of form:
		 * [\i2b2]\ancestor 0\ancestor 1\...\ancestor n\concept\
		 */
		String concept_long = "\\i2b2\\";
		String concept_short = "\\";
		int c_hlevel = ancestors.size()+1;
		for (String ancestor_name : ancestors)
		{
			concept_long += getName(ancestor_name, true)+"\\";
			concept_short += getName(ancestor_name, false)+"\\";
		}
		concept_long += getName(concept, true)+"\\";
		concept_short += getName(concept, false)+"\\";

		//Write statements for concept. In case of not exactly one concept notation, String notation will be "NULL".
		writeI2b2Entry(writer_meta, c_hlevel, notation, concept_long, concept_short, label, visualAttribute, current_timestamp);
		if (isRootElement)
			writeTableAccessEntry(writer_meta, concept_long, concept_short, label, visualAttribute);		
		if (!notation.equals("NULL"))
			writeConceptDimensionEntry(writer_data, notation, concept_long, label, current_timestamp);

		//in case of multiple notations
		if (notations.size() > 1)
		{
			//If the concept also hase children, insert an additional i2b2 path layer.
			if (children.size() > 0)
			{
				c_hlevel++;
				visualAttribute = "MA";
				concept_long += "multiple notations\\";
				concept_short += "multiple notations\\";
				
				writeI2b2Entry(writer_meta, c_hlevel, "", concept_long, concept_short, "_.-^''äbendies''^-._", visualAttribute, current_timestamp);
			}			
			//Write INSERT statements for all notations.
			c_hlevel++;
			visualAttribute = "LA";
			for (int i = 0; i < notations.size(); i++)
			{
				String concept_long_sub = concept_long + i+"\\";
				String concept_short_sub = concept_short + i+"\\";
				notation = notations.get(i);
				
				writeI2b2Entry(writer_meta, c_hlevel, notation, concept_long_sub, concept_short_sub, label, visualAttribute, current_timestamp);
				writeConceptDimensionEntry(writer_data, notation, concept_long_sub, label, current_timestamp);
			}
		}
			
		ancestors.add(concept);
		for (String child : children)
		{
			@SuppressWarnings("unchecked")
			ArrayList<String> ancestors_names_clone = (ArrayList<String>) ancestors.clone();
			writeInsertStatements(writer_meta, writer_data, child, ancestors_names_clone);
	    }    
	}
	
	private void writeI2b2Entry(Writer writer_meta, int c_hlevel, String notation, String concept_long, String concept_short,
			String label, String visualAttribute, String current_timestamp)
	{
		try {
			writer_meta.write("INSERT INTO "+meta_schema+".i2b2("+
					"c_hlevel,c_fullname,c_name,c_synonym_cd,c_visualattributes,"+
					"c_basecode,c_metadataxml,c_facttablecolumn,c_tablename,c_columnname,"+
					"c_columndatatype,c_operator,c_dimcode,c_tooltip,m_applied_path,"+
					"update_date,download_date,import_date,sourcesystem_cd)"+
				"VALUES("+
					c_hlevel+",'"+concept_long+"','"+label+"','N','"+visualAttribute+"',"+
					"'"+notation+"',NULL,'concept_cd','concept_dimension','concept_path',"+
					"'T','LIKE','"+concept_long+"','"+concept_short+"','@',"+
					"current_timestamp,'"+current_timestamp+"',current_timestamp,'test'"+
				");\n");
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}
	
	private void writeConceptDimensionEntry(Writer writer_data, String notation, String concept_long,
			String label, String current_timestamp)
	{
		try {
			writer_data.write("INSERT INTO "+data_schema+".concept_dimension("+
					"concept_path,concept_cd,name_char,update_date,"+
					"download_date,import_date,sourcesystem_cd"+
				")VALUES("+
					"'"+concept_long+"','"+notation+"','"+label+"',current_timestamp,"+
					"'"+current_timestamp+"',current_timestamp,'test'"+
				");\n");
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}		
	}
	
	private void writeTableAccessEntry(Writer writer_meta, String concept_long, String concept_short,
			String label, String visualAttribute)
	{
		try {
			writer_meta.write("INSERT INTO "+meta_schema+".table_access("+
					"c_table_cd,c_table_name,c_protected_access,c_hlevel,c_fullname,"+
					"c_name,c_synonym_cd,c_visualattributes,c_facttablecolumn,c_dimtablename,"+
					"c_columnname,c_columndatatype,c_operator,c_dimcode,c_tooltip"+
				")VALUES("+
					"'test_8883d7b2','i2b2','N',1,'"+concept_long+"',"+
					"'"+label+"','N','"+visualAttribute+"','concept_cd','concept_dimension',"+
					"'concept_path','T','LIKE','"+concept_long+"','"+concept_short+"'"+
				");\n");
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}
	
	private List<String> getNotations(String concept)
	{
		List<String> notations = new ArrayList<String>();
		
    	String queryString = query_notations.replace("<CONCEPT>", "<"+concept+">");
		Query query = QueryFactory.create(queryString);
		QueryEngineHTTP httpQuery = new QueryEngineHTTP(sparqlEndpoint, query);
		ResultSet results = httpQuery.execSelect();

		while (results.hasNext()) {
			QuerySolution solution = results.next();			
			notations.add(solution.get("notation").toString());
		}
		
		return notations;
	}
	
	private List<String> getTopConcepts()
	{	
		List<String> concepts = new ArrayList<String>();
		
    	String queryString = query_top_concepts;
		Query query = QueryFactory.create(queryString);
		QueryEngineHTTP httpQuery = new QueryEngineHTTP(sparqlEndpoint, query);
		ResultSet results = httpQuery.execSelect();
		
		while (results.hasNext()) {
			QuerySolution solution = results.next();	
			concepts.add(solution.get("concept").toString());
		}
		
		return concepts;
	}
	
	private List<String> getChildren(String concept)
	{
		List<String> concepts = new ArrayList<String>();
		
    	String queryString = query_child_concepts.replace("<PARENT>", "<"+concept+">");
		Query query = QueryFactory.create(queryString);
		QueryEngineHTTP httpQuery = new QueryEngineHTTP(sparqlEndpoint, query);
		ResultSet results = httpQuery.execSelect();
		
		while (results.hasNext()) {
			QuerySolution solution = results.next();			
			concepts.add(solution.get("concept").toString());
		}
		
		return concepts;
	}
	
	private String getLabel(String concept)
	{
		String label = "";
		
    	String queryString = query_label.replace("<CONCEPT>", "<"+concept+">");
		Query query = QueryFactory.create(queryString);
		QueryEngineHTTP httpQuery = new QueryEngineHTTP(sparqlEndpoint, query);
		ResultSet results = httpQuery.execSelect();
		
		while (results.hasNext()) {
			QuerySolution solution = results.next();			
			label = solution.get("label").toString();
		}
		
		return cleanLabel(label);
	}
	  
	public static void main(String[] args) {
		Translator t = new Translator();
		t.translate();
	}
	
	private String cleanLabel(String label)
	{
		label = label.split("@")[0];
		label = label.replaceAll("'", "''");
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
		BufferedReader reader = new BufferedReader(new InputStreamReader(is));
	    String         line = null;
	    StringBuilder  stringBuilder = new StringBuilder();
	    String         ls = System.getProperty("line.separator");

	    try {
	        while((line = reader.readLine()) != null) {
	            stringBuilder.append(line);
	            stringBuilder.append(ls);
	        }

	        return stringBuilder.toString();
	    } finally {
	        reader.close();
	    }
	}
}
