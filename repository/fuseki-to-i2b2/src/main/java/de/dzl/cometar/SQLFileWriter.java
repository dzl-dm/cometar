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
		// TODO Auto-generated method stub
		SQLFileWriter sqlFileWriter = new SQLFileWriter();
		try {
			sqlFileWriter.generateSQLStatements();
		} catch (IOException e) {
			e.printStackTrace();
			System.exit(1);
		}
	}

	@Override
	protected void writeDataSql(String statement) throws IOException {
		writer_meta.write(statement);
	}

	@Override
	protected void writeMetaSql(String statement) throws IOException {
		writer_data.write(statement);
	}

	@Override
	protected void initializeWriters() throws UnsupportedEncodingException, FileNotFoundException {	
		writer_meta = new BufferedWriter(new OutputStreamWriter(new FileOutputStream(outputDir+"meta.sql"), "utf-8"));
		writer_data = new BufferedWriter(new OutputStreamWriter(new FileOutputStream(outputDir+"data.sql"), "utf-8"));			
	}

	@Override
	protected void closeWriters() throws IOException {
		writer_meta.close();
		writer_data.close();
	}

}
