# CoMetaR - generate sql statements for i2b2 from fuseki through SPARQL queries

Recursively writes statements for the concept and it's child-concepts.
 
     * Every concept gets an entry in the i2b2 table.
     * Every schema-topconcept also gets an entry in the table-access table.
     * Every concept with notation gets an entry (for every notation) in the concept_dimension table.

     * In case that a concept has multiple notations it will be marked with visualAttribute="MA" 
     * and for all notations there will be written another INSERT statement one i2b2-path level below.
     ** e.g. \ancestor path\concept\							        visualAttribute="MA"	notation="NULL"
     				 \ancestor path\concept\0\						        visualAttribute="LA"	notation="'notation0'"
      			 \ancestor path\concept\1\						        visualAttribute="LA"	notation="'notation1'"
     * In case that a concept additionally has children another virtual path layer will be inserted.
     ** e.g. \ancestor path\concept\							        visualAttribute="FA" 	notation="NULL"
      			 \ancestor path\concept\multiple notations\		visualAttribute="MA" 	notation="NULL"
      			 \ancestor path\concept\multiple notations\0\	visualAttribute="LA" 	notation="'notation0'"
      			 \ancestor path\concept\multiple notations\1\	visualAttribute="LA" 	notation="'notation1'"
      			 \ancestor path\concept\child concept\	