select distinct b.sourcesystem_cd, STRING_AGG(DISTINCT b.concept_cd, ', ')
from i2b2demodata.observation_fact b
join ( select concept_cd
	from i2b2demodata.observation_fact
	except
	(
		(select concept_cd
		from i2b2demodata.concept_dimension )
	union
		(select modifier_cd as concept_cd
		from i2b2demodata.modifier_dimension )
	)
) as c
on c.concept_cd = b.concept_cd
group by sourcesystem_cd
order by sourcesystem_cd