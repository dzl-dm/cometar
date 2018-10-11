UPDATE i2b2metadata.i2b2
SET c_totalnum=subquery.patient_count
FROM (
	-- count the patients
	SELECT pathcodes.c_fullname, COUNT (DISTINCT o.patient_num) AS patient_count
	FROM i2b2demodata.observation_fact o
	JOIN (
		-- combine all fullnames with all subordinated concept's fullnames' codes
		-- each concept('s path) then has been assigned all codes from all sub-concepts
		SELECT p1.c_fullname, p2.c_basecode
		FROM i2b2metadata.i2b2 p2
		JOIN (
			-- select all available fullnames from i2b2 that are subordinated to the current root node
			SELECT i.c_fullname, i.c_facttablecolumn
			FROM i2b2metadata.i2b2 i
			JOIN (
			-- select all root nodes from table_access so they will be treated one after another
				SELECT c_fullname, c_facttablecolumn
				FROM i2b2metadata.table_access
				WHERE c_fullname LIKE '\\i2b2\\dzl:%'
			) t
			ON i.c_facttablecolumn = t.c_facttablecolumn
			WHERE i.c_fullname LIKE t.c_fullname || '%' ESCAPE '' 
		) p1
		ON p1.c_facttablecolumn = p2.c_facttablecolumn
		WHERE p2.c_fullname LIKE p1.c_fullname || '%' ESCAPE ''
	) pathcodes
	ON o.concept_cd = pathcodes.c_basecode
	GROUP BY c_fullname
) AS subquery
WHERE i2b2.c_fullname=subquery.c_fullname;
UPDATE i2b2metadata.table_access
SET c_totalnum=i2b2.c_totalnum
FROM i2b2metadata.i2b2
WHERE table_access.c_fullname = i2b2.c_fullname;
