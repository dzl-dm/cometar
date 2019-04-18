select DISTINCT b.concept_cd
from i2b2demodata.observation_fact b
join ( select concept_cd
	from i2b2demodata.observation_fact
	except
	select concept_cd
	from i2b2demodata.concept_dimension 
	except
	select modifier_cd as concept_cd
	from i2b2demodata.modifier_dimension 
) as c
on c.concept_cd = b.concept_cd