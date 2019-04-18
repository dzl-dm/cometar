SELECT DISTINCT concept_cd, STRING_AGG(DISTINCT sourcesystem_cd, ', ')
FROM observation_fact
WHERE concept_cd in (<NOTATIONS>)
GROUP BY concept_cd
ORDER BY concept_cd