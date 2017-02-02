-- as ont-user
CREATE TEMPORARY TABLE path_count(concept_path VARCHAR(700) NOT NULL, count INTEGER NOT NULL);

\copy path_count FROM '/var/tmp/path_count.csv' DELIMITER E'\t' CSV HEADER
CREATE INDEX path_count_idx ON path_count(concept_path);
-- for direct counts
UPDATE i2b2 SET c_totalnum=c.count FROM path_count c WHERE i2b2.c_fullname=c.concept_path;

-- for path traversal upwards
-- UPDATE path_count SET concept_path = concept_path || '%';

-- SELECT m.c_fullname, COUNT(c.concept_path), SUM(c.count) FROM i2b2 m, path_count c WHERE m.c_fullname LIKE c.concept_path ESCAPE '' GROUP BY m.c_fullname;
DROP TABLE path_count;
