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

import com.hp.hpl.jena.query.Query;
import com.hp.hpl.jena.query.QueryFactory;
import com.hp.hpl.jena.query.QuerySolution;
import com.hp.hpl.jena.query.ResultSet;
import com.hp.hpl.jena.sparql.engine.http.QueryEngineHTTP;

public class Translator {
	String sparqlEndpoint = "https://data.dzl.de/fuseki/cometar_live/query";

	String query_top_concepts = "";
	String query_child_concepts = "";

    public void translate() {
    	InputStream query_top_concepts_input = getClass().getResourceAsStream("/query_top_concepts.txt");
    	InputStream query_child_concepts_input = getClass().getResourceAsStream("/query_child_concepts.txt");

		try {
			query_top_concepts = readFile(query_top_concepts_input);
			query_child_concepts = readFile(query_child_concepts_input);
			
			Writer writer = new BufferedWriter(new OutputStreamWriter(new FileOutputStream("target/meta.sql"), "utf-8"));
			writer.write("DELETE FROM i2b2metadata.table_access WHERE c_table_cd LIKE 'test%';\n");
			writer.write("DELETE FROM i2b2metadata.i2b2 WHERE sourcesystem_cd='test';\n");
			
			Query query = QueryFactory.create(query_top_concepts);
			QueryEngineHTTP httpQuery = new QueryEngineHTTP(sparqlEndpoint, query);
			ResultSet results = httpQuery.execSelect();

			ArrayList<String> ancestors_names = new ArrayList<String>();
			while (results.hasNext()) {
				QuerySolution solution = results.next();
				writeInsertStatement(writer, solution, ancestors_names);
		    }
			
			writer.close();
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
    
    public void writeChildren(Writer writer, String concept, ArrayList<String> ancestors_names) throws IOException
    {
    	String queryString = query_child_concepts.replace("<PARENT>", "<"+concept+">");
		Query query = QueryFactory.create(queryString);
		QueryEngineHTTP httpQuery = new QueryEngineHTTP(sparqlEndpoint, query);
		ResultSet results = httpQuery.execSelect();

		ancestors_names.add(getName(concept));
		while (results.hasNext()) {
			QuerySolution solution = results.next();
			writeInsertStatement(writer, solution, ancestors_names);
	    }    	
    }
	
	@SuppressWarnings("unchecked")
	public void writeInsertStatement(Writer writer, QuerySolution solution, ArrayList<String> ancestors_names) throws IOException
	{
		String concept = solution.get("concept").toString();
		String label = solution.get("label").toString().split("@")[0];
		String current_timestamp = (new SimpleDateFormat("yyyy-MM-dd HH:mm:ss.0")).format(new Date());
		String concept_long = "\\i2b2\\";
		String concept_short = "\\";
		int c_hlevel = ancestors_names.size()+1;
		for (String ancestor_name : ancestors_names)
		{
			concept_long += "bb0ead2c:"+ancestor_name+"\\";
			concept_short += ancestor_name+"\\";
		}
		concept_long += "bb0ead2c:"+getName(concept)+"\\";
		concept_short += getName(concept)+"\\";

		writer.write("INSERT INTO i2b2metadata.i2b2("+
			"c_hlevel,c_fullname,c_name,c_synonym_cd,c_visualattributes,"+
			"c_basecode,c_metadataxml,c_facttablecolumn,c_tablename,c_columnname,"+
			"c_columndatatype,c_operator,c_dimcode,c_tooltip,m_applied_path,"+
			"update_date,download_date,import_date,sourcesystem_cd)"+
			"VALUES("+
				c_hlevel+",'"+concept_long+"','"+label+"','N','FA',"+
				"NULL,NULL,'concept_cd','concept_dimension','concept_path',"+
				"'T','LIKE','"+concept_long+"','"+concept_short+"','@',"+
				"current_timestamp,'"+current_timestamp+"',current_timestamp,'test'"+
			");\n");
		
		if (ancestors_names.size() == 0)
		{
			writer.write("INSERT INTO i2b2metadata.table_access("+
				"c_table_cd,c_table_name,c_protected_access,c_hlevel,c_fullname,"+
				"c_name,c_synonym_cd,c_visualattributes,c_facttablecolumn,c_dimtablename,"+
				"c_columnname,c_columndatatype,c_operator,c_dimcode,c_tooltip"+
				")VALUES("+
				"'test_8883d7b2','i2b2','N',1,'"+concept_long+"',"+
				"'"+label+"','N','FA','concept_cd','concept_dimension',"+
				"'concept_path','T','LIKE','"+concept_long+"','"+concept_short+"'"+
				");");
		}
				
		writeChildren(writer, concept, (ArrayList<String>) ancestors_names.clone());
	}
	  
	public static void main(String[] args) {
		Translator t = new Translator();
		t.translate();
	}
	
	private String getName(String uri)
	{
		String[] split = uri.split("#");
		return split[split.length-1];
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
