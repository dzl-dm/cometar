SELECT DISTINCT sourcesystem_cd, STRING_AGG(DISTINCT concept_cd, ', ')
FROM observation_fact
WHERE concept_cd in (<NOTATIONS>)
GROUP BY sourcesystem_cd
ORDER BY sourcesystem_cd