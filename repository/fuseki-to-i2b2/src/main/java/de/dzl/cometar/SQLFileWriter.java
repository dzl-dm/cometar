package de.dzl.cometar;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.io.UnsupportedEncodingException;
import java.io.Writer;
import java.net.URI;

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
	
	public static void main(String[] args) {
		SQLFileWriter sqlFileWriter = new SQLFileWriter();
		
		if (args.length == 0)
		{
			throw new IllegalArgumentException("Missing SPARQL endpoint argument.");
		}
		boolean use_embedded_server = true;
		FusekiServer server = null;

		sqlFileWriter.meta_schema = "";//"i2b2metadata.";//"public.";
		sqlFileWriter.data_schema = "";//"i2b2demodata.";//"public.";
		sqlFileWriter.sourcesystem = "CoMetaR jauuu";
		if (use_embedded_server)
		{
			server = startEmbeddedServer("C:\\Users\\stmar7\\Projekte\\Vorträge und Publikationen\\CoMetaR Evaluation\\package\\dzl_ontology_files","C:\\Users\\stmar7\\Projekte\\cometar\\repository\\config\\insertrules.ttl");
	    	URI uri = server.server.getURI();
	    	sqlFileWriter.sparqlEndpoint = "http://"+uri.getHost()+":3330/ds/query";
		}
		else
		{
			sqlFileWriter.sparqlEndpoint = args[0];
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
