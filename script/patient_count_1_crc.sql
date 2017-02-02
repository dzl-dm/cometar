-- calculate concept patient count
-- as crc-user
CREATE TEMPORARY TABLE counts AS 
SELECT concept_cd, COUNT(DISTINCT patient_num) FROM observation_fact GROUP BY concept_cd;
CREATE INDEX count_idx ON counts(concept_cd);
-- convert concepts to paths
CREATE TEMPORARY TABLE path_count AS
SELECT d.concept_path, c.count FROM counts c INNER JOIN concept_dimension d ON d.concept_cd=c.concept_cd;
DROP TABLE counts;
\copy path_count TO '/var/tmp/path_count.csv' DELIMITER E'\t' CSV HEADER
DROP TABLE path_count;
