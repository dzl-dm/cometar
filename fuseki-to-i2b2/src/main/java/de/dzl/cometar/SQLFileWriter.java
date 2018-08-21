package de.dzl.cometar;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.io.UnsupportedEncodingException;
import java.io.Writer;
import java.net.URI;
import java.util.HashMap;
import java.util.Properties;

import org.apache.jena.atlas.logging.LogCtl;
import org.apache.jena.fuseki.Fuseki;
import org.apache.jena.fuseki.embedded.FusekiServer;
import org.apache.jena.query.Dataset;
import org.apache.jena.query.DatasetFactory;
import org.apache.jena.riot.RDFDataMgr;
import org.apache.jena.sparql.modify.UsingList;
import org.apache.jena.update.UpdateAction;

public class SQLFileWriter extends SQLGenerator {

	private Writer writer_meta;
	private Writer writer_data;
	
	public static void main(String[] args) throws IOException {
		SQLFileWriter sqlFileWriter = new SQLFileWriter();
		FusekiServer server = null;

		Properties prop = new Properties();
		String properties_path = "";
		if (args.length>0) properties_path = args[0];
		else properties_path = "properties.properties";
		prop.load(new FileInputStream(properties_path));
		boolean use_embedded_server = prop.getProperty("test.use_embedded_server").equals("true");
		sqlFileWriter.meta_schema = prop.getProperty("i2b2.meta_schema");
		sqlFileWriter.data_schema = prop.getProperty("i2b2.data_schema");
		sqlFileWriter.ontology_tablename = prop.getProperty("i2b2.ontology.tablename");
		sqlFileWriter.i2b2_path_prefix = prop.getProperty("i2b2.ontology.path_prefix");
		sqlFileWriter.sourcesystem = prop.getProperty("i2b2.sourcesystem");
		sqlFileWriter.outputDir = prop.getProperty("generator.output_dir");
		String ttl_file_directory = prop.getProperty("test.ttl_file_directory");
		String ttl_rule_file = prop.getProperty("test.ttl_rule_file");
		String[] mappingsArray = prop.getProperty("generator.mappings").split(";");
		sqlFileWriter.mappings = new HashMap<String, String>();
		for (int i = 0; i < mappingsArray.length; i+=2)
		{
			sqlFileWriter.mappings.put(mappingsArray[i], mappingsArray[i+1]);
		}
		
		if (use_embedded_server)
		{
			server = startEmbeddedServer(ttl_file_directory,ttl_rule_file);
	    	URI uri = server.server.getURI();
	    	sqlFileWriter.sparqlEndpoint = "http://"+uri.getHost()+":3330/ds/query";
		}
		else
		{
			
			if (!prop.containsKey("generator.sparql_endpoint"))
			{
				throw new IllegalArgumentException("Missing SPARQL endpoint property.");
			}
			sqlFileWriter.sparqlEndpoint = prop.getProperty("generator.sparql_endpoint");
		}
		
		try {
			if (server != null) server.start();
			sqlFileWriter.generateSQLStatements();
		} catch (IOException e) {
			e.printStackTrace();
			System.exit(1);
		} finally {
			if (server != null) server.stop();
		}
	}

	private static FusekiServer startEmbeddedServer(String ttl_folder_path, String ttl_rule_file_path) {
    	FusekiServer server = null;
		Dataset ds = DatasetFactory.createTxnMem() ;
		
		File folder = new File(ttl_folder_path);
		File rulesFile = new File(ttl_rule_file_path);
		File[] listOfFiles = folder.listFiles();		
		for (File file : listOfFiles) {
		    if (file.isFile()) {
		        RDFDataMgr.read(ds,file.getAbsolutePath()) ;
		    }
		}    
		UpdateAction.parseExecute(new UsingList(), ds.asDatasetGraph(), rulesFile.getAbsolutePath()) ;

    	server = FusekiServer.create()
    			  .add("/ds", ds)
    			  .build() ;
    	LogCtl.setJavaLogging();
    	LogCtl.setLevel(Fuseki.serverLogName,  "WARN");
    	LogCtl.setLevel(Fuseki.actionLogName,  "WARN");
    	LogCtl.setLevel(Fuseki.requestLogName, "WARN");
    	LogCtl.setLevel(Fuseki.adminLogName,   "WARN");
    	LogCtl.setLevel("org.eclipse.jetty",   "WARN");
    	return server;
	}

	@Override
	protected void writeDataSql(String statement) throws IOException {
		writer_data.write(statement);
	}

	@Override
	protected void writeMetaSql(String statement) throws IOException {
		writer_meta.write(statement);
	}

	@Override
	protected void initializeWriters() throws UnsupportedEncodingException, FileNotFoundException {	
		writer_meta = new BufferedWriter(new OutputStreamWriter(new FileOutputStream(outputDir+"meta.sql"), "utf-8"));
		writer_data = new BufferedWriter(new OutputStreamWriter(new FileOutputStream(outputDir+"data.sql"), "utf-8"));			
	}

	@Override
	protected void closeWriters() throws IOException {
		if (writer_meta != null) writer_meta.close();
		if (writer_data != null) writer_data.close();
	}
}
