package de.dzl.cometar;

import java.io.BufferedWriter;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.io.UnsupportedEncodingException;
import java.io.Writer;

public class SQLFileWriter extends SQLGenerator {

	private Writer writer_meta;
	private Writer writer_data;
	
	public static void main(String[] args) {
		SQLFileWriter sqlFileWriter = new SQLFileWriter();
		
		if (args.length == 0)
		{
			throw new IllegalArgumentException("Missing SPARQL endpoint argument.");
		}
		String sparqlEndpoint = args[0];
		
		try {
			sqlFileWriter.generateSQLStatements(sparqlEndpoint);
		} catch (IOException e) {
			e.printStackTrace();
			System.exit(1);
		}
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
