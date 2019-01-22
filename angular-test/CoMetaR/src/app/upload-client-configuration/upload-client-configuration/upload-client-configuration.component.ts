import { Component, OnInit } from '@angular/core';
import { parseString } from 'xml2js';

@Component({
  selector: 'app-upload-client-configuration',
  templateUrl: './upload-client-configuration.component.html',
  styleUrls: ['./upload-client-configuration.component.css']
})
export class UploadClientConfigurationComponent implements OnInit {
  public inputtype="xml";
  public xmlFileContent=`
  <?xml version="1.0" encoding="UTF-8"?>
<datasource version="1.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" >
	<meta>
		<id>ipf_giessen</id>
		<etl-strategy>replace-source</etl-strategy>
	</meta>
	
	<patient-table>
		<source xsi:type="csv-file">
			<url>patient.csv</url>
			<separator>;</separator>
		</source>
		<idat>
			<patient-id column="patid"/>
			<given-name column="patid"/>
			<surname column="patid"/>
			<birthdate format="u[-M[-d]]" na="" column="birthdate"/>
			<deathdate format="u[-M[-d]]" na="" column="deathdate"/>
			<gender column="gender" na="">
				<map> <!-- maps a column -->
					<case value="W" set-value="female"/>
					<case value="M" set-value="male"/>
					<case value="X" set-value="indeterminate"/>
					<otherwise set-value="" log-warning="Unexpected gender value"/>
				</map>
			</gender>
		</idat>
		<!-- for MDAT in patient table, use the same patient-table also as
		a visit table (visit date needed). the patient id can be re-used
		as visit id, or a constant visit ID can be used. -->
	</patient-table>
	<!-- optional -->
	<visit-table>
		<source xsi:type="csv-file">
			<url>visit.csv</url>
			<type>text/csv</type>
			<separator>;</separator>
		</source>
		<idat>
			<patient-id column="patid"/>
			<visit-id column="visit"/>
			<start column="date" format="u[-M[-d['T'H[:m[:s[.SSS[XXX]]]]]]]" na="" truncate-to="year"/>
		</idat>
		<mdat>
		</mdat>
	</visit-table>
	<wide-table>
		<source xsi:type="csv-file">
			<url>Baseline.csv</url>
			<type>text/csv</type>
			<separator>;</separator>
		</source>
		<idat>
			<patient-id column="MedicoID"/>
			<visit-id column="InitDatum"/>
			<start column="InitDatum" format="d.M.u[ H[:m[:s]]]" na=""/>
		</idat>
		<mdat>
			<concept id="L:3141-9">
				<value column="Gewicht" xsi:type="integer" na="" na-action="drop-fact"/>
				<unit constant-value="kg"/>
			</concept>
			<concept id="L:8302-2">
				<value column="Groesse" xsi:type="decimal" locale="de" na="" na-action="drop-fact">
					<map>
						<case value="0.00" set-value=""/>
					</map>
				</value>
				<unit constant-value="cm"/>
			</concept>
			<concept id="S:401201003">
				<value column="Packyears" xsi:type="integer" na="" na-action="drop-fact"/>
				<unit constant-value="py"/>
			</concept>
			<concept id="Raucherstatus">
				<value column="Zigaretten" xsi:type="integer" na="">
					<map>
						<case value="1" set-concept="S:266919005" set-value=""/>
						<case value="2" set-concept="S:266927001" set-value=""/>
						<case value="3" set-concept="S:8517006" set-value=""/>
						<case value="4" set-concept="S:8517006" set-value=""/>
						<otherwise action="drop-fact"/>
					</map>
				</value>
			</concept>
			<concept id="S:266929003">
				<value column="ZigarettenDatum" xsi:type="string" na="" na-action="drop-fact"/>
			</concept>
			
			<!-- at rest or on exertion ?
			<concept id="">
				<value column="Dyspnoe" xsi:type="integer" na="">
					<map>
						<case value="1" set-value=""/>
						<otherwise action="drop-fact"/>
					</map>
				</value>
			</concept> -->
			<concept id="S:49727002">
				<value column="Husten" xsi:type="integer" na="">
					<map>
						<case value="1" set-value=""/>
						<otherwise action="drop-fact"/>
					</map>
				</value>
			</concept>
			<concept id="S:29857009">
				<value column="ThoraxSchmerz" xsi:type="integer" na="">
					<map>
						<case value="1" set-value=""/>
						<otherwise action="drop-fact"/>
					</map>
				</value>
			</concept>
			<concept id="S:79890006">
				<value column="Anorexie" xsi:type="integer" na="">
					<map>
						<case value="1" set-value=""/>
						<otherwise action="drop-fact"/>
					</map>
				</value>
			</concept>
			<concept id="S:246557006">
				<value column="ZNS" xsi:type="integer" na="">
					<map>
						<case value="1" set-value=""/>
						<otherwise action="drop-fact"/>
					</map>
				</value>
			</concept>
			
			<concept id="L:19862-2">
				<value column="Body_TLC" xsi:type="decimal" na="" locale="de" na-action="drop-fact"/>
				<!--<start column="BodyDatum" format="d.M.u[ H[:m[:s]]]"/>-->
				<unit constant-value="L"/>
			</concept>
			<concept id="L:20146-7">
				<value column="Body_RV" xsi:type="decimal" na="" locale="de" na-action="drop-fact"/>
				<!--<start column="BodyDatum" format="d.M.u[ H[:m[:s]]]"/>-->
				<unit constant-value="L"/>
			</concept>
			<concept id="S:16162007">
				<value column="Body_Rtot" xsi:type="decimal" na="" locale="de" na-action="drop-fact"/>
				<!--<start column="BodyDatum" format="d.M.u[ H[:m[:s]]]"/>-->
				<unit constant-value="cm[H20]/(L/s)"/>
			</concept>
			<concept id="L:20150-9">
				<value column="Spiro_FEV1" xsi:type="decimal" na="" locale="de" na-action="drop-fact"/>
				<!--<start column="SpiroDatum" format="d.M.u[ H[:m[:s]]]"/>-->
				<unit constant-value="L"/>
			</concept>
			<concept id="L:19866-3">
				<value column="Spiro_VC" xsi:type="decimal" na="" locale="de" na-action="drop-fact"/>
				<!--<start column="SpiroDatum" format="d.M.u[ H[:m[:s]]]"/>-->
				<unit constant-value="L"/>
			</concept>
			<concept id="L:19911-7">
				<value column="Diffu_Absolut" xsi:type="decimal" na="" locale="de" na-action="drop-fact"/>
				<!--<start column="DiffuDatum" format="d.M.u[ H[:m[:s]]]"/>-->
				<unit constant-value="cm3/min/mm[Hg]"/>
			</concept>
			<concept id="L:69578-3">
				<value column="Diffu_HB_DURCH_AV" xsi:type="decimal" na="" locale="de" na-action="drop-fact"/>
				<!--<start column="DiffuDatum" format="d.M.u[ H[:m[:s]]]"/>-->
				<unit constant-value="L/min/mm [Hg]"/>
			</concept>
			<concept id="L:19913-3">
				<value column="Diffu_HB_PLUS_AV" xsi:type="decimal" na="" locale="de" na-action="drop-fact"/>
				<!--<start column="DiffuDatum" format="d.M.u[ H[:m[:s]]]"/>-->
				<unit constant-value="cm3/min/mm[Hg]"/>
			</concept>
		</mdat>
		<ignore column="*" xsi:type="string"/>	
	</wide-table>
	<wide-table>
		<source xsi:type="csv-file">
			<url>Diagnose.csv</url>
			<type>text/csv</type>
			<separator>;</separator>
		</source>
		<idat>
			<patient-id column="MedicoID"/>
			<visit-id column="Tumor_Diagnosedatum"/>
			<start column="Tumor_Diagnosedatum" format="d.M.u[ H[:m[:s]]]" na=""/>
		</idat>
		<mdat>		
			<!-- konstantes Lungenkrebs-Konzept -->
			<concept id="ICD10:C34">
				<value xsi:type="string" constant-value="" na=""/>
			</concept>
			<!-- <concept id="Tumordiagnose_ICD10">
				<value column="ICD10" na="" xsi:type="integer">
					<map>
						<case value="C34.0" set-concept="C34.0" set-value=""/>
						<case value="C34.1" set-concept="C34.1" set-value=""/>
						<case value="C34.2" set-concept="C34.2" set-value=""/>
						<case value="C34.3" set-concept="C34.3" set-value=""/>
						<case value="C34.8" set-concept="C34.8" set-value=""/>
						<case value="C34.9" set-concept="C34.9" set-value=""/>
						<case value="C45.0" set-concept="C45.0" set-value=""/>
						<case value="C45.1" set-concept="C45.1" set-value=""/>
						<case value="C45.2" set-concept="C45.2" set-value=""/>
						<case value="C45.7" set-concept="C45.7" set-value=""/>
						<case value="C45.9" set-concept="C45.9" set-value=""/>
						<case value="D38.1" set-concept="D38.1" set-value=""/>
						<otherwise log-warning="Tumorcode not maped" action="drop-fact"/>
					</map>
				</value>
			</concept> -->
			<concept id="Tumordiagnose_ICDO">
				<value column="ICD-O" na="" xsi:type="integer">
					<map>
						<case value="8012/3" set-concept="ICD-O-3:8012/3" set-value=""/>
						<case value="8013/3" set-concept="ICD-O-3:8013/3" set-value=""/>
						<case value="8014/3" set-concept="ICD-O-3:8014/3" set-value=""/>
						<case value="8022/3" set-concept="ICD-O-3:8022/3" set-value=""/>
						<case value="8031/3" set-concept="ICD-O-3:8031/3" set-value=""/>
						<case value="8032/3" set-concept="ICD-O-3:8032/3" set-value=""/>
						<case value="8033/3" set-concept="ICD-O-3:8033/3" set-value=""/>
						<case value="8041/3" set-concept="ICD-O-3:8041/3" set-value=""/>
						<case value="8045/3" set-concept="ICD-O-3:8045/3" set-value=""/>
						<case value="8046/3" set-concept="ICD-O-3:8046/3" set-value=""/>
						<case value="8052/3" set-concept="ICD-O-3:8052/3" set-value=""/>
						<case value="8070/3" set-concept="ICD-O-3:8070/3" set-value=""/>
						<case value="8071/3" set-concept="ICD-O-3:8071/3" set-value=""/>
						<case value="8073/3" set-concept="ICD-O-3:8073/3" set-value=""/>
						<case value="8082/3" set-concept="ICD-O-3:8082/3" set-value=""/>
						<case value="8083/3" set-concept="ICD-O-3:8083/3" set-value=""/>
						<case value="8084/3" set-concept="ICD-O-3:8084/3" set-value=""/>
						<case value="8123/3" set-concept="ICD-O-3:8123/3" set-value=""/>
						<case value="8140/3" set-concept="ICD-O-3:8140/3" set-value=""/>
						<case value="8200/3" set-concept="ICD-O-3:8200/3" set-value=""/>
						<case value="8230/3" set-concept="ICD-O-3:8230/3" set-value=""/>
						<case value="8240/3" set-concept="ICD-O-3:8240/3" set-value=""/>
						<case value="8240/3" set-concept="ICD-O-3:8240/3" set-value=""/>
						<case value="8249/3" set-concept="ICD-O-3:8249/3" set-value=""/>
						<case value="8250/3" set-concept="ICD-O-3:8250/3" set-value=""/>
						<case value="8252/3" set-concept="ICD-O-3:8252/3" set-value=""/>
						<case value="8253/3" set-concept="ICD-O-3:8253/3" set-value=""/>
						<case value="8254/3" set-concept="ICD-O-3:8254/3" set-value=""/>
						<case value="8255/3" set-concept="ICD-O-3:8255/3" set-value=""/>
						<case value="8260/3" set-concept="ICD-O-3:8260/3" set-value=""/>
						<case value="8310/3" set-concept="ICD-O-3:8310/3" set-value=""/>
						<case value="8333/3" set-concept="ICD-O-3:8333/3" set-value=""/>
						<case value="8430/3" set-concept="ICD-O-3:8430/3" set-value=""/>
						<case value="8470/3" set-concept="ICD-O-3:8470/3" set-value=""/>
						<case value="8480/3" set-concept="ICD-O-3:8480/3" set-value=""/>
						<case value="8490/3" set-concept="ICD-O-3:8490/3" set-value=""/>
						<case value="8550/3" set-concept="ICD-O-3:8550/3" set-value=""/>
						<case value="8560/3" set-concept="ICD-O-3:8560/3" set-value=""/>
						<case value="8562/3" set-concept="ICD-O-3:8562/3" set-value=""/>
						<case value="8806/3" set-concept="ICD-O-3:8806/3" set-value=""/>
						<case value="8972/3" set-concept="ICD-O-3:8972/3" set-value=""/>
						<case value="8980/3" set-concept="ICD-O-3:8980/3" set-value=""/>
						<case value="9040/3" set-concept="ICD-O-3:9040/3" set-value=""/>
						<case value="9050/3" set-concept="ICD-O-3:9050/3" set-value=""/>
						<case value="9051/3" set-concept="ICD-O-3:9051/3" set-value=""/>
						<case value="9052/3" set-concept="ICD-O-3:9052/3" set-value=""/>
						<case value="9053/3" set-concept="ICD-O-3:9053/3" set-value=""/>
						<case value="9120/3" set-concept="ICD-O-3:9120/3" set-value=""/>
						<case value="9133/3" set-concept="ICD-O-3:9133/3" set-value=""/>
						<case value="9678/3" set-concept="ICD-O-3:9678/3" set-value=""/>
						<otherwise log-warning="Tumorcode not maped" action="drop-fact"/>
					</map>
				</value>
			</concept>
			<concept id="TNM_T">
				<value column="TNM_T" na="" xsi:type="string">
					<map>
						<case value="1_T0" set-concept="S:58790005" set-value=""/>
						<case value="2_T0" set-concept="S:39880006" set-value=""/>
						<case value="1_T1" set-concept="S:23351008" set-value=""/>
						<case value="2_T1" set-concept="S:53786006" set-value=""/>
						<case value="1_T1a" set-concept="S:261646003" set-value=""/>
						<case value="2_T1a" set-concept="S:443357004" set-value=""/>
						<case value="1_T1b" set-concept="S:261649005" set-value=""/>
						<case value="2_T1b" set-concept="S:443506002" set-value=""/>
						<case value="1_T1c" set-concept="S:261650005" set-value=""/>
						<case value="2_T1c" set-concept="S:443642002" set-value=""/>
						<case value="1_T2" set-concept="S:67673008" set-value=""/>
						<case value="2_T2" set-concept="S:80898003" set-value=""/>
						<case value="1_T2a" set-concept="S:261651009" set-value=""/>
						<case value="2_T2a" set-concept="S:443812002" set-value=""/>
						<case value="1_T2b" set-concept="S:261652002" set-value=""/>
						<case value="2_T2b" set-concept="S:443896000" set-value=""/>
						<case value="1_T3" set-concept="S:14410001" set-value=""/>
						<case value="2_T3" set-concept="S:90402004" set-value=""/>
						<case value="1_T4" set-concept="S:65565005" set-value=""/>
						<case value="2_T4" set-concept="S:6123003" set-value=""/>
						<case value="1_Tis" set-concept="S:44401000" set-value=""/>
						<case value="2_Tis" set-concept="S:84921008" set-value=""/>
						<case value="1_TIS" set-concept="S:44401000" set-value=""/>
						<case value="2_TIS" set-concept="S:84921008" set-value=""/>
						<case value="1_TX" set-concept="S:67101007" set-value=""/>
						<case value="2_TX" set-concept="S:43189003" set-value=""/>
						<otherwise log-warning="Tumorcode not maped" action="drop-fact"/>
					</map>
				</value>
				<modifier id="Edition">
					<value column="Auflage" xsi:type="string" na="">
						<map>
							<case value="7. TNM Auflage" set-concept="edition7" set-value=""/> 
							<case value="8. TNM Auflage" set-concept="edition8" set-value=""/> 
						</map>	
					</value>
				</modifier>
			</concept>
			<concept id="TNM_N">
				<value column="TNM_N" na="" xsi:type="string">
					<map>
						<case value="1_N0" set-concept="S:62455006" set-value=""/>
						<case value="2_N0" set-concept="S:21917009" set-value=""/>
						<case value="1_N1" set-concept="S:53623008" set-value=""/>
						<case value="2_N1" set-concept="S:45552005" set-value=""/>
						<case value="1_N2" set-concept="S:46059003" set-value=""/>
						<case value="2_N2" set-concept="S:15076001" set-value=""/>
						<case value="1_N3" set-concept="S:5856006" set-value=""/>
						<case value="2_N3" set-concept="S:49182004" set-value=""/>
						<case value="1_NX" set-concept="S:79420006" set-value=""/>
						<case value="2_NX" set-concept="S:54452005" set-value=""/>
						<otherwise log-warning="Tumorcode not maped" action="drop-fact"/>
					</map>
				</value>
				<modifier id="Edition">
					<value column="Auflage" xsi:type="string" na="">
						<map>
							<case value="7. TNM Auflage" set-concept="edition7" set-value=""/> 
							<case value="8. TNM Auflage" set-concept="edition8" set-value=""/> 
						</map>	
					</value>
				</modifier>
			</concept>
			<concept id="TNM_M">
				<value column="TNM_M" na="" xsi:type="string">
					<map>
						<case value="1_M0" set-concept="S:30893008" set-value=""/>
						<case value="2_M0" set-concept="S:19408000" set-value=""/>
						<case value="1_M1" set-concept="S:55440008" set-value=""/>
						<case value="2_M1" set-concept="S:14926007" set-value=""/>
						<case value="1_M1a" set-concept="S:261927002" set-value=""/>
						<case value="2_M1a" set-concept="S:443841006" set-value=""/>
						<case value="1_M1b" set-concept="S:261928007" set-value=""/>
						<case value="2_M1b" set-concept="S:443840007" set-value=""/>
						<case value="1_M1c" set-concept="S:261929004" set-value=""/>
						<case value="2_M1c" set-concept="S:443839005" set-value=""/>
						<case value="1_MX" set-concept="S:27167007" set-value=""/>
						<otherwise log-warning="Tumorcode not maped" action="drop-fact"/>
					</map>
				</value>
				<modifier id="Edition">
					<value column="Auflage" xsi:type="string" na="">
						<map>
							<case value="7. TNM Auflage" set-concept="edition7" set-value=""/> 
							<case value="8. TNM Auflage" set-concept="edition8" set-value=""/> 
						</map>	
					</value>
				</modifier>
			</concept>
			<concept id="Stage">
				<value column="Stage" na="" xsi:type="string">
					<map>
						<case value="1_0" set-concept="S:399537006:261613009" set-value=""/>
						<case value="2_0" set-concept="S:405979002:261613009" set-value=""/>
						<case value="1_IA" set-concept="S:399537006:258215001:261634002" set-value=""/>
						<case value="2_IA" set-concept="S:405979002:258215001:261634002" set-value=""/>
						<case value="1_IA1" set-concept="S:399537006:258215001:261632003" set-value=""/>
						<case value="2_IA1" set-concept="S:405979002:258215001:261632003" set-value=""/>
						<case value="1_IA2" set-concept="S:399537006:258215001:261633008" set-value=""/>
						<case value="2_IA2" set-concept="S:405979002:258215001:261633008" set-value=""/>
						<case value="1_IA3" set-concept="S:399537006" set-value=""/> <!-- no code available yet -->
						<case value="2_IA3" set-concept="S:405979002" set-value=""/> <!-- no code available yet -->
						<case value="1_IB" set-concept="S:399537006:261635001" set-value=""/>
						<case value="2_IB" set-concept="S:405979002:261635001" set-value=""/>
						<case value="1_IIA" set-concept="S:399537006:261614003" set-value=""/>
						<case value="2_IIA" set-concept="S:405979002:261614003" set-value=""/>
						<case value="1_IIB" set-concept="S:399537006:261615002" set-value=""/>
						<case value="2_IIB" set-concept="S:405979002:261615002" set-value=""/>
						<case value="1_IIIA" set-concept="S:399537006:261638004" set-value=""/>
						<case value="2_IIIA" set-concept="S:405979002:261638004" set-value=""/>
						<case value="1_IIIB" set-concept="S:399537006:261639007" set-value=""/>
						<case value="2_IIIB" set-concept="S:405979002:261639007" set-value=""/>
						<case value="1_IIIC" set-concept="S:399537006:261640009" set-value=""/>
						<case value="2_IIIC" set-concept="S:405979002:261640009" set-value=""/>
						<case value="1_IV" set-concept="S:399537006:258228008" set-value=""/>
						<case value="2_IV" set-concept="S:405979002:258228008" set-value=""/>
						<case value="1_IVA" set-concept="S:399537006:261642001" set-value=""/>
						<case value="2_IVA" set-concept="S:405979002:261642001" set-value=""/>
						<case value="1_IVB" set-concept="S:399537006:261643006" set-value=""/>
						<case value="2_IVB" set-concept="S:405979002:261643006" set-value=""/>
						<case value="1_Okkultes Karzinom" set-concept="S:399537006:309689007" set-value=""/>
						<case value="2_Okkultes Karzinom" set-concept="S:405979002:309689007" set-value=""/>
						<otherwise log-warning="Tumorcode not maped" action="drop-fact"/>
					</map>
				</value>
				<modifier id="Edition_Stage">
					<value column="Auflage_Stage" xsi:type="string" na="">
						<map>
							<case value="7. TNM Auflage" set-concept="edition7" set-value=""/> 
							<case value="8. TNM Auflage" set-concept="edition8" set-value=""/> 
						</map>	
					</value>
				</modifier>
			</concept>
		</mdat>
		<ignore column="*" xsi:type="string"/>
	</wide-table>
	<eav-table>
		<source xsi:type="csv-file">
			<url>facts.csv</url>
			<separator>;</separator>
		</source>
		<idat>
			<patient-id column="patid"/>
			<visit-id column="event"/>
		</idat>
		<mdat>
			<concept column="concept"/>
			<start column="start" format="u[-M[-d['T'H[:m[:s[.SSS[XXX]]]]]]]"/>
			<end column="end" format="u[-M[-d]]" na=""/>
			<type column="type" na=""/>
			<value column="value" na=""/>
			<unit column="unit" na=""/>
		</mdat>
		<virtual>
	<!-- Quality of life questionnaire (EQ-5D) -->
			<value column="FF.2231.eq5d_vas" xsi:type="integer"><map set-concept="DV_0003"/></value>
			
	<!-- biometric data -->
			<!-- body height -->
			<value column="FF.15949.qspab_1" xsi:type="integer"><map set-concept="L:8302-2"/></value>
			<value column="FF.33174.qspab_1" xsi:type="integer"><map set-concept="L:8302-2"/></value>
			<value column="FF.2323.qspab_1" xsi:type="integer"><map set-concept="L:8302-2"/></value>
			<value column="FF.73302.qsphb_5_a_b" xsi:type="integer"><map set-concept="L:8302-2"/></value>
			<value column="FF.73198.qsphf_5_a_b" xsi:type="integer"><map set-concept="L:8302-2"/></value>
			<!-- body weight -->
			<value column="FF.15949.qspab_2" xsi:type="integer"><map set-concept="L:3141-9"/></value>
			<value column="FF.33174.qspab_2" xsi:type="integer"><map set-concept="L:3141-9"/></value>
			<value column="FF.2323.qspab_2" xsi:type="integer"><map set-concept="L:3141-9"/></value>
			<value column="FF.71805.qsphb_5_a_a" xsi:type="integer"><map set-concept="L:3141-9"/></value>
			<value column="FF.71371.qsphf_5_a_a" xsi:type="integer"><map set-concept="L:3141-9"/></value>
		
	<!-- distance walked in 6 minutes baseline -->
			<value column="FF.16492.qsphb_11_c" xsi:type="integer"><map set-concept="L:64098-7" set-unit="m"/></value>
			<value column="FF.2205.qsphb_11_c" xsi:type="integer"><map set-concept="L:64098-7" set-unit="m"/></value>
			<value column="FF.1913.qsphf_10_c" xsi:type="integer"><map set-concept="L:64098-7" set-unit="m"/></value>
			
	<!-- symptoms -->
			<!-- chest pain on breathing -->
			<value column="FF.15685.qspab_33" xsi:type="integer" na="1"><map set-concept="S:29857009"><case value="1"/><otherwise action="drop-fact"/></map></value>
			<value column="FF.32907.qspab_33" xsi:type="integer" na="1"><map set-concept="S:29857009"><case value="1"/><otherwise action="drop-fact"/></map></value>
			<value column="FF.2056.qspab_33" xsi:type="integer" na="1"><map set-concept="S:29857009"><case value="1"/><otherwise action="drop-fact"/></map></value>
		
	<!-- smoking -->
			<!-- Active Smoker -->
			<value column="FF.16084.qspab_37" xsi:type="integer" na="1"><map set-concept="S:266927001"><case value="1"/><otherwise action="drop-fact"/></map></value>
			<value column="FF.32553.qspab_37" xsi:type="integer" na="1"><map set-concept="S:266927001"><case value="1"/><otherwise action="drop-fact"/></map></value>
			<value column="FF.2307.qspab_37" xsi:type="integer" na="1"><map set-concept="S:266927001"><case value="1"/><otherwise action="drop-fact"/></map></value>
			<!-- ex-smoker -->			
			<value column="FF.16015.qspab_38" xsi:type="integer" na="1"><map set-concept="S:8517006"><case value="1"/><otherwise action="drop-fact"/></map></value>
			<value column="FF.32704.qspab_38" xsi:type="integer" na="1"><map set-concept="S:8517006"><case value="1"/><otherwise action="drop-fact"/></map></value>
			<value column="FF.2278.qspab_38" xsi:type="integer" na="1"><map set-concept="S:8517006"><case value="1"/><otherwise action="drop-fact"/></map></value>
			<!-- smoking started -->			
			<value column="FF.15632.qspab_39_a" xsi:type="integer"><map set-concept="S:266929003"/></value>
			<value column="FF.33326.qspab_39_a" xsi:type="integer"><map set-concept="S:266929003"/></value>
			<value column="FF.2024.qspab_39_a" xsi:type="integer"><map set-concept="S:266929003"/></value>
			<!-- cigarettes per day -->
			<value column="FF.15632.qspab_39_c" xsi:type="integer"><map set-concept="S:307438009"/></value>
			<value column="FF.33326.qspab_39_c" xsi:type="integer"><map set-concept="S:307438009"/></value>
			<value column="FF.2024.qspab_39_c" xsi:type="integer"><map set-concept="S:307438009"/></value>
			
    <!-- lung function -->
			<!-- Rtot -->
			<value column="FF.16051.qsphb_5_b_a" xsi:type="decimal"><map set-concept="S:16162007"/></value>
			<value column="FF.1956.qsphb_5_b_a" xsi:type="decimal"><map set-concept="S:16162007"/></value>
			<value column="FF.1958.qsphf_5_b_a" xsi:type="decimal"><map set-concept="S:16162007"/></value>
			<!-- Rtot % -->
			<value column="FF.16051.qsphb_5_b_b" xsi:type="decimal"><map set-concept="DV_0004"/></value>
			<value column="FF.1956.qsphb_5_b_b" xsi:type="decimal"><map set-concept="DV_0004"/></value>
			<value column="FF.1958.qsphf_5_b_b" xsi:type="decimal"><map set-concept="DV_0004"/></value>
			<!-- FEV 1 -->
			<value column="FF.15936.qsphb_5_c_a" xsi:type="decimal"><map set-concept="L:20150-9"/></value>
			<value column="FF.1892.qsphb_5_c_a" xsi:type="decimal"><map set-concept="L:20150-9"/></value>
			<value column="FF.2355.qsphf_5_c_a" xsi:type="decimal"><map set-concept="L:20150-9"/></value>
			<!-- FEV 1 % -->
			<value column="FF.15936.qsphb_5_c_b" xsi:type="decimal"><map set-concept=""><otherwise action="drop-fact"/></map></value>
			<value column="FF.1892.qsphb_5_c_b" xsi:type="decimal"><map set-concept=""><otherwise action="drop-fact"/></map></value>
			<value column="FF.2355.qsphf_5_c_b" xsi:type="decimal"><map set-concept=""><otherwise action="drop-fact"/></map></value>
			<!-- RV -->
			<value column="FF.16469.qsphb_5_f_a" xsi:type="decimal"><map set-concept="L:20146-7"/></value>
			<value column="FF.2399.qsphb_5_f_a" xsi:type="decimal"><map set-concept="L:20146-7"/></value>
			<value column="FF.2072.qsphf_5_f_a" xsi:type="decimal"><map set-concept="L:20146-7"/></value>
			<!-- RV % -->
			<value column="FF.16469.qsphb_5_f_b" xsi:type="decimal"><map set-concept="DV_0005"/></value>
			<value column="FF.2399.qsphb_5_f_b" xsi:type="decimal"><map set-concept="DV_0005"/></value>
			<value column="FF.2072.qsphf_5_f_b" xsi:type="decimal"><map set-concept="DV_0005"/></value>
			<!-- TLC -->
			<value column="FF.15956.qsphb_5_h_a" xsi:type="decimal"><map set-concept="L:19862-2"/></value>
			<value column="FF.2214.qsphb_5_h_a" xsi:type="decimal"><map set-concept="L:19862-2"/></value>
			<value column="FF.2021.qsphf_5_h_a" xsi:type="decimal"><map set-concept="L:19862-2"/></value>
			<!-- TLC % -->
			<value column="FF.15956.qsphb_5_h_b" xsi:type="decimal"><map set-concept="L:89085-5"/></value>
			<value column="FF.2214.qsphb_5_h_b" xsi:type="decimal"><map set-concept="L:89085-5"/></value>
			<value column="FF.2021.qsphf_5_h_b" xsi:type="decimal"><map set-concept="L:89085-5"/></value>
			<!-- VC -->
			<value column="FF.16271.qsphb_5_k_a" xsi:type="decimal"><map set-concept="L:19866-3"/></value>
			<value column="FF.1787.qsphb_5_k_a" xsi:type="decimal"><map set-concept="L:19866-3"/></value>
			<value column="FF.2358.qsphf_5_k_a" xsi:type="decimal"><map set-concept="L:19866-3"/></value>
			<!-- VC % -->
			<value column="FF.16271.qsphb_5_k_b" xsi:type="decimal"><map set-concept=""><otherwise action="drop-fact"/></map></value>
			<value column="FF.1787.qsphb_5_k_b" xsi:type="decimal"><map set-concept=""><otherwise action="drop-fact"/></map></value>
			<value column="FF.2358.qsphf_5_k_b" xsi:type="decimal"><map set-concept=""><otherwise action="drop-fact"/></map></value>
			<!-- FVC -->
			<value column="FF.15984.qsphb_5_l_a" xsi:type="decimal"><map set-concept="L:19868-9"/></value>
			<value column="FF.2363.qsphb_5_l_a" xsi:type="decimal"><map set-concept="L:19868-9"/></value>
			<value column="FF.1768.qsphf_5_l_a" xsi:type="decimal"><map set-concept="L:19868-9"/></value>
			<!-- FVC % -->
			<value column="FF.15984.qsphb_5_l_b" xsi:type="decimal"><map set-concept=""><otherwise action="drop-fact"/></map></value>
			<value column="FF.2363.qsphb_5_l_b" xsi:type="decimal"><map set-concept=""><otherwise action="drop-fact"/></map></value>
			<value column="FF.1768.qsphf_5_l_b" xsi:type="decimal"><map set-concept=""><otherwise action="drop-fact"/></map></value>
			
			<!-- DLCO -->	
			<value column="FF.16234.qsphb_5_p_a" xsi:type="decimal"><map set-concept="L:19911-7"/></value>
			<value column="FF.2191.qsphb_5_p_a" xsi:type="decimal"><map set-concept="L:19911-7"/></value>
			<value column="FF.2015.qsphb_5_p_a" xsi:type="decimal"><map set-concept="L:19911-7"/></value>
			<!-- DLCO corrected (VA) -->
			<value column="FF.16115.qsphb_5_n_a" xsi:type="decimal"><map set-concept="L:69578-3"/></value>
			<value column="FF.1895.qsphb_5_n_a" xsi:type="decimal"><map set-concept="L:69578-3"/></value>
			<value column="FF.2349.qsphf_5_n_a" xsi:type="decimal"><map set-concept="L:69578-3"/></value>
			<!-- DLCO corrected (Hb) -->
			<value column="FF.15867.qsphb_5_o_a" xsi:type="decimal"><map set-concept="L:19913-3"/></value>
			<value column="FF.1886.qsphb_5_o_a" xsi:type="decimal"><map set-concept="L:19913-3"/></value>
			<value column="FF.2398.qsphf_5_o_a" xsi:type="decimal"><map set-concept="L:19913-3"/></value>
			
<!-- TODO capillary VS arterial -->
			<!-- pO2 capillary -->
			<value column="FF.16216.qsphb_5_q_a" xsi:type="decimal"><map set-concept=""><otherwise action="drop-fact"/></map></value>
			<value column="FF.1772.qsphb_5_q_a" xsi:type="decimal"><map set-concept=""><otherwise action="drop-fact"/></map></value>
			<value column="FF.2113.qsphf_5_q_a" xsi:type="decimal"><map set-concept=""><otherwise action="drop-fact"/></map></value>
			<!-- pO2 arterial -->
			<value column="FF.16216.qsphb_5_q_b" xsi:type="decimal"><map set-concept=""><otherwise action="drop-fact"/></map></value>
			<value column="FF.1772.qsphb_5_q_b" xsi:type="decimal"><map set-concept=""><otherwise action="drop-fact"/></map></value>
			<value column="FF.2113.qsphf_5_q_b" xsi:type="decimal"><map set-concept=""><otherwise action="drop-fact"/></map></value>
			<!-- o2 capillary -->
			<value column="FF.16393.qsphb_5_r_a" xsi:type="decimal"><map set-concept=""><otherwise action="drop-fact"/></map></value>
			<value column="FF.1858.qsphb_5_r_a" xsi:type="decimal"><map set-concept=""><otherwise action="drop-fact"/></map></value>
			<value column="FF.1854.qsphf_5_r_a" xsi:type="decimal"><map set-concept=""><otherwise action="drop-fact"/></map></value>
			<!-- o2 arterial -->
			<value column="FF.16393.qsphb_5_r_b" xsi:type="decimal"><map set-concept=""><otherwise action="drop-fact"/></map></value>
			<value column="FF.1858.qsphb_5_r_b" xsi:type="decimal"><map set-concept=""><otherwise action="drop-fact"/></map></value>
			<value column="FF.1854.qsphf_5_r_b" xsi:type="decimal"><map set-concept=""><otherwise action="drop-fact"/></map></value>
			<!-- pCO2 capillary -->
			<value column="FF.16183.qsphb_5_s_a" xsi:type="decimal"><map set-concept=""><otherwise action="drop-fact"/></map></value>
			<value column="FF.1861.qsphb_5_s_a" xsi:type="decimal"><map set-concept=""><otherwise action="drop-fact"/></map></value>
			<value column="FF.2239.qsphb_5_s_a" xsi:type="decimal"><map set-concept=""><otherwise action="drop-fact"/></map></value>
			<!-- pCO2 arterial -->
			<value column="FF.16183.qsphb_5_s_b" xsi:type="decimal"><map set-concept=""><otherwise action="drop-fact"/></map></value>
			<value column="FF.1861.qsphb_5_s_b" xsi:type="decimal"><map set-concept=""><otherwise action="drop-fact"/></map></value>
			<value column="FF.2239.qsphb_5_s_b" xsi:type="decimal"><map set-concept=""><otherwise action="drop-fact"/></map></value>
			<!-- pH capillary -->
			<value column="FF.15965.qsphb_5_t_a" xsi:type="decimal"><map set-concept=""><otherwise action="drop-fact"/></map></value>
			<value column="FF.2245.qsphb_5_t_a" xsi:type="decimal"><map set-concept=""><otherwise action="drop-fact"/></map></value>
			<value column="FF.2273.qsphf_5_t_a" xsi:type="decimal"><map set-concept=""><otherwise action="drop-fact"/></map></value>
			<!-- pH arterial -->
			<value column="FF.15965.qsphb_5_t_b" xsi:type="decimal"><map set-concept=""><otherwise action="drop-fact"/></map></value>
			<value column="FF.2245.qsphb_5_t_b" xsi:type="decimal"><map set-concept=""><otherwise action="drop-fact"/></map></value>
			<value column="FF.2273.qsphf_5_t_b" xsi:type="decimal"><map set-concept=""><otherwise action="drop-fact"/></map></value>
			
			<!-- Echo -->
			<value column="FF.15810.qsphb_8" xsi:type="integer" na="1"><map set-concept="S:40701008"><case value="1"/><otherwise action="drop-fact"/></map></value>
			<value column="FF.1999.qsphb_8" xsi:type="integer" na="1"><map set-concept="S:40701008"><case value="1"/><otherwise action="drop-fact"/></map></value>
			<value column="FF.2383.qsphf_8" xsi:type="integer" na="1"><map set-concept="S:40701008"><case value="1"/><otherwise action="drop-fact"/></map></value>
			<!-- TAPSE -->
			<value column="FF.15639.qsphb_8_e" xsi:type="integer"><map set-concept="L:77903-3"/></value>			
			<value column="FF.2369.qsphb_8_e" xsi:type="integer"><map set-concept="L:77903-3"/></value>			
			<value column="FF.1995.qsphf_8_e" xsi:type="integer"><map set-concept="L:77903-3"/></value>			
			<!-- LV-Ejection fraction -->
			<value column="FF.15639.qsphb_8_h" xsi:type="integer"><map set-concept="L:10230-1"/></value>			
			<value column="FF.2369.qsphb_8_h" xsi:type="integer"><map set-concept="L:10230-1"/></value>			
			<value column="FF.1995.qsphf_8_h" xsi:type="integer"><map set-concept="L:10230-1"/></value>	
			
			<!-- RHC -->
			<value column="FF.15623.qsphb_9_a" xsi:type="integer" na="1"><map set-concept="S:40403005"><case value="1"/><otherwise action="drop-fact"/></map></value>
			<value column="FF.1908.qsphb_9_a" xsi:type="integer" na="1"><map set-concept="S:40403005"><case value="1"/><otherwise action="drop-fact"/></map></value>
			<value column="FF.1974.qsphf_9_a" xsi:type="integer" na="1"><map set-concept="S:40403005"><case value="1"/><otherwise action="drop-fact"/></map></value>
<!-- TODO Es gibt Werte für PAPmean in Ruhe und unter Belastung, verwende erst einmal nur den in Ruhe, sonst Duplikate. -->
			<!-- PAPmean -->
			<value column="FF.15623.qsphb_9_j" xsi:type="integer"><map set-concept="L:8414-5"/></value>	
			<value column="FF.15623.qsphb_9_t" xsi:type="integer"><map set-concept="L:8414-5"><otherwise action="drop-fact"/></map></value>	
			<value column="FF.1908.qsphb_9_j" xsi:type="integer"><map set-concept="L:8414-5"/></value>	
			<value column="FF.1908.qsphb_9_t" xsi:type="integer"><map set-concept="L:8414-5"><otherwise action="drop-fact"/></map></value>	
			<value column="FF.1974.qsphf_9_j" xsi:type="integer"><map set-concept="L:8414-5"/></value>	
			<value column="FF.1974.qsphf_9_t" xsi:type="integer"><map set-concept="L:8414-5"><otherwise action="drop-fact"/></map></value>	
			
			<!-- VO2 max -->
			<value column="FF.16348.qsphb_12_f" xsi:type="decimal"><map set-concept="S:251898000"/></value>	
			<value column="FF.2306.qsphb_12_f" xsi:type="decimal"><map set-concept="S:251898000"/></value>	
			<value column="FF.1834.qsphf_11_f" xsi:type="decimal"><map set-concept="S:251898000"/></value>	
			
	<!-- comorbidities -->
			<!-- Disorder of gastrointestinal tract -->
			<value column="FF.16065.qsphb_14_d" xsi:type="integer" na="1"><map set-concept="S:119292006"><case value="1"/><otherwise action="drop-fact"/></map></value>
			<value column="FF.1953.qsphb_14_d" xsi:type="integer" na="1"><map set-concept="S:119292006"><case value="1"/><otherwise action="drop-fact"/></map></value>
			<value column="FF.2187.qsphf_13_d" xsi:type="integer" na="1"><map set-concept="S:119292006"><case value="1"/><otherwise action="drop-fact"/></map></value>
			
	<!-- vital signs -->
			<!-- patient deceased -->
			<value column="FF.17678.q_1" xsi:type="string" na="1"><map set-concept="S:397709008"><case value="" action="drop-fact"/><otherwise set-value="1"/></map></value>
			
	<!-- diagnosis -->
			<!-- PH -->
			<value column="FF.16189.qspab_54" xsi:type="integer" na="1"><map set-concept="B:PH"><case value="1"/><otherwise action="drop-fact"/></map></value>
			<value column="FF.32568.qspab_54" xsi:type="integer" na="1"><map set-concept="B:PH"><case value="1"/><otherwise action="drop-fact"/></map></value>
			<value column="FF.2397.qspab_54" xsi:type="integer" na="1"><map set-concept="B:PH"><case value="1"/><otherwise action="drop-fact"/></map></value>
			
<!-- TODO generates duplicates -->			
			<!-- cancer -->
			<!-- Oesophageal / Gastric / Colon Cancer -->
			<value column="FF.15948.qspab_56_a" xsi:type="integer"><map set-concept="OTH:OTH"><otherwise action="drop-fact"/></map></value>
			<value column="FF.32666.qspab_56_a" xsi:type="integer"><map set-concept="OTH:OTH"><otherwise action="drop-fact"/></map></value>
			<value column="FF.2094.qspab_56_a" xsi:type="integer"><map set-concept="OTH:OTH"><otherwise action="drop-fact"/></map></value>
			<!-- Liver Carcinoma -->
			<value column="FF.16192.qspab_56_c" xsi:type="integer"><map set-concept="OTH:OTH"><otherwise action="drop-fact"/></map></value>
			<value column="FF.32855.qspab_56_c" xsi:type="integer"><map set-concept="OTH:OTH"><otherwise action="drop-fact"/></map></value>
			<value column="FF.2321.qspab_56_c" xsi:type="integer"><map set-concept="OTH:OTH"><otherwise action="drop-fact"/></map></value>
			<!-- Lung / Tracheal Cancer -->
			<value column="FF.15980.qspab_56_d" xsi:type="integer"><map set-concept="OTH:OTH"><otherwise action="drop-fact"/></map></value>
			<value column="FF.32219.qspab_56_d" xsi:type="integer"><map set-concept="OTH:OTH"><otherwise action="drop-fact"/></map></value>
			<value column="FF.2091.qspab_56_d" xsi:type="integer"><map set-concept="OTH:OTH"><otherwise action="drop-fact"/></map></value>
			<!-- Breast Cancer -->
			<value column="FF.15914.qspab_56_f" xsi:type="integer"><map set-concept="OTH:OTH"><otherwise action="drop-fact"/></map></value>
			<value column="FF.33111.qspab_56_f" xsi:type="integer"><map set-concept="OTH:OTH"><otherwise action="drop-fact"/></map></value>
			<value column="FF.1779.qspab_56_f" xsi:type="integer"><map set-concept="OTH:OTH"><otherwise action="drop-fact"/></map></value>
			<!-- Abdominal (= uterus) Cancer -->
			<value column="FF.15933.qspab_56_g" xsi:type="integer"><map set-concept="OTH:OTH"><otherwise action="drop-fact"/></map></value>
			<value column="FF.32624.qspab_56_g" xsi:type="integer"><map set-concept="OTH:OTH"><otherwise action="drop-fact"/></map></value>
			<value column="FF.1976.qspab_56_g" xsi:type="integer"><map set-concept="OTH:OTH"><otherwise action="drop-fact"/></map></value>
			<!-- Prostate Cancer -->
			<value column="FF.16070.qspab_56_h" xsi:type="integer"><map set-concept="OTH:OTH"><otherwise action="drop-fact"/></map></value>
			<value column="FF.33304.qspab_56_h" xsi:type="integer"><map set-concept="OTH:OTH"><otherwise action="drop-fact"/></map></value>
			<value column="FF.1783.qspab_56_h" xsi:type="integer"><map set-concept="OTH:OTH"><otherwise action="drop-fact"/></map></value>
			<!-- Renal / bladder Cancer -->
			<value column="FF.16547.qspab_56_i" xsi:type="integer"><map set-concept="OTH:OTH"><otherwise action="drop-fact"/></map></value>
			<value column="FF.32654.qspab_56_i" xsi:type="integer"><map set-concept="OTH:OTH"><otherwise action="drop-fact"/></map></value>
			<value column="FF.1921.qspab_56_i" xsi:type="integer"><map set-concept="OTH:OTH"><otherwise action="drop-fact"/></map></value>
			<!-- Mediastinal Cancer -->
			<value column="FF.16450.qspab_56_j" xsi:type="integer"><map set-concept="OTH:OTH"><otherwise action="drop-fact"/></map></value>
			<value column="FF.32971.qspab_56_j" xsi:type="integer"><map set-concept="OTH:OTH"><otherwise action="drop-fact"/></map></value>
			<value column="FF.1928.qspab_56_j" xsi:type="integer"><map set-concept="OTH:OTH"><otherwise action="drop-fact"/></map></value>
			<!-- Thyroid Cancer -->
			<value column="FF.15983.qspab_56_k" xsi:type="integer"><map set-concept="OTH:OTH"><otherwise action="drop-fact"/></map></value>
			<value column="FF.32390.qspab_56_k" xsi:type="integer"><map set-concept="OTH:OTH"><otherwise action="drop-fact"/></map></value>
			<value column="FF.1784.qspab_56_k" xsi:type="integer"><map set-concept="OTH:OTH"><otherwise action="drop-fact"/></map></value>
			<!-- Lymphoma -->
			<value column="FF.15813.qspab_56_l" xsi:type="integer"><map set-concept="OTH:OTH"><otherwise action="drop-fact"/></map></value>
			<value column="FF.33422.qspab_56_l" xsi:type="integer"><map set-concept="OTH:OTH"><otherwise action="drop-fact"/></map></value>
			<value column="FF.2277.qspab_56_l" xsi:type="integer"><map set-concept="OTH:OTH"><otherwise action="drop-fact"/></map></value>
			<!-- Leucemia -->
			<value column="FF.15802.qspab_56_m" xsi:type="integer"><map set-concept="OTH:OTH"><otherwise action="drop-fact"/></map></value>
			<value column="FF.33089.qspab_56_m" xsi:type="integer"><map set-concept="OTH:OTH"><otherwise action="drop-fact"/></map></value>
			<value column="FF.2175.qspab_56_m" xsi:type="integer"><map set-concept="OTH:OTH"><otherwise action="drop-fact"/></map></value>
			<!-- Bone Cancer -->
			<value column="FF.15840.qspab_56_o" xsi:type="integer"><map set-concept="OTH:OTH"><otherwise action="drop-fact"/></map></value>
			<value column="FF.33062.qspab_56_o" xsi:type="integer"><map set-concept="OTH:OTH"><otherwise action="drop-fact"/></map></value>
			<value column="FF.2220.qspab_56_o" xsi:type="integer"><map set-concept="OTH:OTH"><otherwise action="drop-fact"/></map></value>
			<!-- other cancer -->
			<value column="FF.16292.qspab_56_p" xsi:type="integer"><map set-concept="OTH:OTH"><otherwise action="drop-fact"/></map></value>
			<value column="FF.32209.qspab_56_p" xsi:type="integer"><map set-concept="OTH:OTH"><otherwise action="drop-fact"/></map></value>
			<value column="FF.1959.qspab_56_p" xsi:type="integer"><map set-concept="OTH:OTH"><otherwise action="drop-fact"/></map></value>
			
			<!-- Arterial hypertension (Hypertension) -->
			<value column="FF.15854.qspab_60" xsi:type="integer" na="1"><map set-concept="ICD10:I10-I15"><case value="1"/><otherwise action="drop-fact"/></map></value>
			<value column="FF.33050.qspab_60" xsi:type="integer" na="1"><map set-concept="ICD10:I10-I15"><case value="1"/><otherwise action="drop-fact"/></map></value>
			<value column="FF.2235.qspab_60" xsi:type="integer" na="1"><map set-concept="ICD10:I10-I15"><case value="1"/><otherwise action="drop-fact"/></map></value>
			
			<!-- myocardial infarction -->
			<value column="FF.15868.qspab_62_a" xsi:type="integer" na="1"><map set-concept="S:22298006"><case value="1"/><otherwise action="drop-fact"/></map></value>
			<value column="FF.32649.qspab_62_a" xsi:type="integer" na="1"><map set-concept="S:22298006"><case value="1"/><otherwise action="drop-fact"/></map></value>
			<value column="FF.17764.q_4_b_a" xsi:type="integer" na="1"><map set-concept="S:22298006"><case value="1"/><otherwise action="drop-fact"/></map></value>
			<value column="FF.1853.qspab_62_a" xsi:type="integer" na="1"><map set-concept="S:22298006"><case value="1"/><otherwise action="drop-fact"/></map></value>
			
			<!-- Diabetes mellitus -->
			<value column="FF.16005.qspab_81" xsi:type="integer" na="1"><map set-concept="S:73211009"><case value="1"/><otherwise action="drop-fact"/></map></value>
			<value column="FF.33232.qspab_80" xsi:type="integer" na="1"><map set-concept="S:73211009"><case value="1"/><otherwise action="drop-fact"/></map></value>
			<value column="FF.1937.qspab_80" xsi:type="integer" na="1"><map set-concept="S:73211009"><case value="1"/><otherwise action="drop-fact"/></map></value>
			
			<!-- Recognised occupational disease -->
			<value column="FF.16320.qspab_94" xsi:type="integer" na="1"><map set-concept="S:86157004"><case value="1"/><otherwise action="drop-fact"/></map></value>
			<value column="FF.32835.qspab_94" xsi:type="integer" na="1"><map set-concept="S:86157004"><case value="1"/><otherwise action="drop-fact"/></map></value>
			<value column="FF.2337.qspab_94" xsi:type="integer" na="1"><map set-concept="S:86157004"><case value="1"/><otherwise action="drop-fact"/></map></value>
			
			<!-- Fibrosis -->
			<value column="FF.2227.qsphb_18" xsi:type="integer" na="1"><map set-concept="S:700250006"><case value="1"/><otherwise action="drop-fact"/></map></value>
			<!-- NSIP -->
			<value column="FF.2188.qsphb_18_b" xsi:type="integer" na="1"><map set-concept="S:129452008"><case value="1"/><otherwise action="drop-fact"/></map></value>
			<!-- cellular NSIP -->
			<value column="FF.2188.qsphb_18_c" xsi:type="integer" na="1"><map><otherwise action="drop-fact"/></map></value>
			<!-- fibrotic NSIP -->
			<value column="FF.2188.qsphb_18_d" xsi:type="integer" na="1"><map><otherwise action="drop-fact"/></map></value>
			<!-- DIP -->
			<value column="FF.2367.qsphb_18_e" xsi:type="integer" na="1"><map set-concept="S:8549006"><case value="1"/><otherwise action="drop-fact"/></map></value>
			<!-- RB-ILD -->
			<value column="FF.1770.qsphb_18_f" xsi:type="integer" na="1"><map set-concept="S:129451001"><case value="1"/><otherwise action="drop-fact"/></map></value>
			<!-- COP -->
			<value column="FF.1792.qsphb_18_g" xsi:type="integer" na="1"><map><otherwise action="drop-fact"/></map></value>
			<!-- LIP -->
			<value column="FF.2017.qsphb_18_h" xsi:type="integer" na="1"><map set-concept="S:44274007"><case value="1"/><otherwise action="drop-fact"/></map></value>
			<!-- AIP -->
			<value column="FF.1918.qsphb_18_i" xsi:type="integer" na="1"><map set-concept="S:236302005"><case value="1"/><otherwise action="drop-fact"/></map></value>
			<!-- unclassifiable IIP -->
			<value column="FF.1852.qsphb_18_j" xsi:type="integer" na="1"><map><otherwise action="drop-fact"/></map></value>
			<!-- DPLD other than IIP -->
			<!-- Stand 12.10.2018 kommen folgende Diagnosen tatsächlich vor:
				1_, 11_, 13_, 17_, 19_, 21_, 23_, 25_, 27_, 29_, 3_, 5_, 681_, 7_, 9_
			-->
			<value column="FF.43862.qdiagitem_1" xsi:type="string" na="">
				<map>
					<!-- Healthy volunteer -->
					<case value="1__" set-concept="B:K" set-value=""/>
					<!-- Lung Cancer -->
					<case value="3__" set-concept="ICD10:C34" set-value=""/>
						<!-- Non small cell lung cancer -->
						<case value="3_1_" set-concept="ICD10:C34" set-value=""/>
							<!-- Adeno Carcinoma -->
							<case value="3_1_1" set-concept="ICD-O-3:8140/3" set-value=""/>
							<!-- Squamous Carcinoma -->
							<case value="3_1_3" set-concept="ICD-O-3:805-808" set-value=""/>
							<!-- Large cell Carcinoma -->
							<case value="3_1_5" set-concept="ICD-O-3:8012/3" set-value=""/>
						<!-- Small cell lung cancer -->
						<case value="3_3_" set-concept="ICD10:C34" set-value=""/>
						<!-- undefined lung cancer -->
						<case value="3_5_" set-concept="ICD10:C34" set-value=""/>
					<!-- Pleural Cancer -->
					<case value="5__" set-concept="OTH:OTH" set-value=""/>
					<!-- Other malignancies of the lung or the pleura -->
					<case value="7__" set-concept="" set-value="" action="drop-fact"/>
					<!-- COPD / Emphysema -->
					<case value="9__" set-concept="S:87433001" set-value=""/>
						<!-- primarily emphysema -->
						<case value="9_7_" set-concept="S:87433001" set-value=""/>
						<!-- primarily chronic bronchitis -->
						<case value="9_9_" set-concept="S:233703007" set-value=""/>
						<!-- alpha 1 antitrypsin deficiency -->
						<case value="9_11_" set-concept="B:COPD-A1" set-value=""/>
					<!-- Asthma bronchiale -->
					<case value="11__" set-concept="S:195967001" set-value=""/>
						<!-- allergic -->
						<case value="11_13_" set-concept="S:389145006" set-value=""/>
						<!-- intrinsic -->
						<case value="11_15_" set-concept="S:266361008" set-value=""/>
						<!-- mixed -->
						<case value="11_17_" set-concept="S:195977004" set-value=""/>
					<!-- Pulmonary Hypertension -->
					<case value="13__" set-concept="B:PH" set-value=""/>
						<!-- Pulmonary Arterial Hypertension (PAH) -->
						<case value="13_19_" set-concept="B:PH-1" set-value=""/>
							<!-- idiopathic PAH -->
							<case value="13_19_7" set-concept="B:PH-1" set-value=""/>
							<!-- familial PAH -->
							<case value="13_19_9" set-concept="B:PH-1" set-value=""/>
							<!-- PAH associated with collagen vascular diseases and others (APAH) -->
							<case value="13_19_11" set-concept="B:PH-1" set-value=""/>
							<!-- PAH associated with pulmonary venous or capillary disease -->
							<case value="13_19_13" set-concept="B:PH-1" set-value=""/>
							<!-- Persistent pulmonary hypertension of the newborn -->
							<case value="13_19_15" set-concept="B:PH-1" set-value=""/>
						<!-- Pulmonary Hypertension (PH) -->
						<case value="13_21_" set-concept="B:PH" set-value=""/>
							<!-- PH associated with left heart disease -->
							<case value="13_21_17" set-concept="B:PH-2" set-value=""/>
							<!-- PH associated with other lung diseases and/or hypoxemia -->
							<case value="13_21_19" set-concept="B:PH" set-value=""/>
						<!-- Pulmonary Hypertension due to chronic thrombotic and/or embolic disease (CTEPH) 	 -->
						<case value="13_23_" set-concept="B:PH-4" set-value=""/>
						<!-- Miscellaneous forms of PH (e.g. sarcoidosis) -->
						<case value="13_25_" set-concept="B:PH" set-value=""/>
					<!-- Carthageners Syndrome -->
					<case value="15__" set-concept="" set-value="" action="drop-fact"/>
					<!-- Cystic Fibrosis -->
					<case value="17__" set-concept="S:190905008" set-value=""/>
					<!-- Obstructive Sleep Apnea -->
					<case value="19__" set-concept="" set-value="" action="drop-fact"/>
					<!-- Obesitas Hypoventilation Syndrome -->
					<case value="21__" set-concept="" set-value="" action="drop-fact"/>
					<!-- Central forms of Sleep Apnea -->
					<case value="23__" set-concept="" set-value="" action="drop-fact"/>
					<!-- Pneumonia -->
					<case value="25__" set-concept="B:PN" set-value=""/>
						<!-- Community aquired pneumonia -->
						<case value="25_27_" set-concept="B:PN-CAP" set-value=""/>
						<!-- Hospital acquired pneumonia -->
						<case value="25_29_" set-concept="B:PN-HAP" set-value=""/>
						<!-- Ventilator associated pneumonia -->
						<case value="25_31_" set-concept="B:PN-VAP" set-value=""/>
						<!-- Bacterial pneumonia -->
						<case value="25_33_" set-concept="B:PN-I3" set-value=""/>
						<!-- Viral pneumonia -->
						<case value="25_35_" set-concept="B:PN-I2" set-value=""/>
					<!-- Acute bronchitis -->
					<case value="27__" set-concept="S:233703007" set-value=""/>
					<!-- DPLD other than IIP -->
					<case value="29__" set-concept="S:233703007" set-value=""/>
						<!-- Sarcoidosis -->
						<case value="29_37_" set-concept="S:31541009" set-value=""/>
						<!-- Exogenic Allergic Alveolitis -->
						<case value="29_61_" set-concept="S:37471005" set-value=""/>
						<!-- DPLD within the frame of collagenosis -->
						<case value="29_63_" set-concept="B:DP-KO" set-value=""/>
							<!-- DPLD with systemic lupus erythematosus -->
							<case value="29_63_21" set-concept="S:55464009" set-value=""/>
							<!-- DPLD with scleroderma / LSSC -->
							<case value="29_63_23" set-concept="S:89155008" set-value=""/>
							<!-- DPLD with rheumatoid arthritis -->
							<case value="29_63_25" set-concept="S:69896004" set-value=""/>
							<!-- DPLD with polymyositis/dermatomyositis -->
							<case value="29_63_27" set-concept="S:31384009" set-value=""/>
							<!-- DPLD with MCTD -->
							<case value="29_63_29" set-concept="S:398021003" set-value=""/>
							<!-- DPLD with ankylosing spondylitis -->
							<case value="29_63_31" set-concept="B:DP-KO6" set-value=""/>
							<!-- DPLD with other collagenosis -->
							<case value="29_63_33" set-concept="B:DP-KO" set-value=""/>
						<!-- DPLD within the frame of pneumoconiosis -->
						<case value="29_39_" set-concept="S:40122008" set-value=""/>
							<!-- pulmonary asbestosis -->
							<case value="29_39_35" set-concept="S:22607003" set-value=""/>
							<!-- silicosis -->
							<case value="29_39_37" set-concept="S:805002" set-value=""/>
							<!-- siderosis -->
							<case value="29_39_39" set-concept="S:62371005" set-value=""/>
							<!-- berylliosis -->
							<case value="29_39_41" set-concept="S:8247009" set-value=""/>
							<!-- DPLD with other pneumoconiosis -->
							<case value="29_39_43" set-concept="S:40122008" set-value=""/>
						<!-- DPLD within the frame of vasculitis -->
						<case value="29_41_" set-concept="S:31996006" set-value=""/>
							<!-- DPLD with Wegener’s granulomatosis -->
							<case value="29_41_45" set-concept="S:195353004" set-value=""/>
							<!-- DPLD with Churg-Strauss syndrome -->
							<case value="29_41_47" set-concept="S:82275008" set-value=""/>
							<!-- DPLD with panarteriitis nodosa -->
							<case value="29_41_49" set-concept="S:155441006" set-value=""/>
							<!-- DPLD with microcopic vasculitis -->
							<case value="29_41_51" set-concept="S:31996006" set-value=""/>
						<!-- DPLD caused by drugs -->
						<case value="29_43_" set-concept="S:233703007" set-value=""/>
							<!-- ILD caused by Amiodarone -->
							<case value="29_43_53" set-concept="S:233703007" set-value=""/>
							<!-- ILD caused by Bleomycin -->
							<case value="29_43_55" set-concept="S:233703007" set-value=""/>
							<!-- ILD caused by Nitrofurantoin -->
							<case value="29_43_57" set-concept="S:233703007" set-value=""/>
							<!-- ILD caused by other drugs -->
							<case value="29_43_59" set-concept="S:233703007" set-value=""/>
						<!-- DPLD caused by radiation -->
						<case value="29_45_" set-concept="S:71193007" set-value=""/>
						<!-- Post ARDS DPLD -->
						<case value="29_47_" set-concept="B:DP-ARDS" set-value=""/>
						<!-- DPLD with chronic inflammatory bowel disease -->
						<case value="29_49_" set-concept="S:24526004" set-value=""/>
						<!-- DPLD with lysosomal storage diseases  -->
						<case value="29_51_" set-concept="B:DP-LS" set-value=""/>
							<!-- Hermansky-Pudlack-Syndrome Interstitial Pneumonitis (HPSIP) -->
							<case value="29_51_61" set-concept="S:9311003" set-value=""/>
							<!-- DPLD with Niemann-Pick disease -->
							<case value="29_51_63" set-concept="S:58459009" set-value=""/>
							<!-- DPLD with Gaucher’s disease -->
							<case value="29_51_65" set-concept="S:190794006" set-value=""/>
							<!-- DPLD with other storage diseases -->
							<case value="29_51_67" set-concept="B:DP-LS" set-value=""/>
							<!-- DPLD with neurofibromatosis -->
							<case value="29_51_69" set-concept="S:19133005" set-value=""/>
						<!-- lymphangioleiomyomatosis -->
						<case value="29_53_" set-concept="S:277844007" set-value=""/>
						<!-- histiocytosis X (LCH) -->
						<case value="29_55_" set-concept="S:65399007" set-value=""/>
						<!-- DPLD with other disease -->
						<case value="29_57_" set-concept="S:233703007" set-value=""/>
						<!-- unclassifiable DPLD -->
						<case value="29_401_" set-concept="S:233703007" set-value=""/>
					<!-- Left heart failure -->
					<case value="681" set-concept="" set-value="" action="drop-fact"/>    
				</map>
			</value>
			
	<!-- biomaterial -->
			<!-- Leucocytes -->
			<value column="FF.15862.qsphb_2_a_c" xsi:type="decimal"><map set-concept="L:26464-8"/></value>
			<value column="FF.1808.qsphb_2_a_c" xsi:type="decimal"><map set-concept="L:26464-8"/></value>
			<value column="FF.2142.qsphf_3_a_c" xsi:type="decimal"><map set-concept="L:26464-8"/></value>
			
			<!-- Hb -->			
			<value column="FF.15862.qsphb_2_a_h" xsi:type="decimal"><map set-concept="L:718-7"/></value>
			<value column="FF.1808.qsphb_2_a_h" xsi:type="decimal"><map set-concept="L:718-7"/></value>
			<value column="FF.2142.qsphf_3_a_h" xsi:type="decimal"><map set-concept="L:718-7"/></value>
			
			<!-- bio material type of specim -->
			<value column="FF.2149.bio_3" xsi:type="integer" na="">
				<map>
					<case value="1" set-concept="B:LAS-LB" set-value=""/> <!-- BAL -->
					<case value="2" set-concept="B:B-SE" set-value=""/> <!-- serum -->
					<case value="3" set-concept="B:B-WE" set-value=""/> <!-- EDTA blood -->
					<case value="4" set-concept="B:LAS-EBC" set-value=""/> <!-- exhaled breath condensate -->
					<case value="5" set-concept="" set-value="" action="drop-fact"/> <!-- exhaled air sample -->
					<case value="6" set-concept="B:B-WNAP" set-value=""/> <!-- PAX gene blood -->    
					<case value="7" set-concept="" set-value="" action="drop-fact"/> <!-- transbronchial biopsy -->
					<case value="8" set-concept="" set-value="" action="drop-fact"/> <!-- lung tissue post VATS -->
					<case value="9" set-concept="" set-value="" action="drop-fact"/> <!-- lung tissue post LTX -->
					<case value="10" set-concept="" set-value="" action="drop-fact"/> <!-- histology slides from VATS biopsy -->
					<case value="11" set-concept="" set-value="" action="drop-fact"/> <!-- histology slides from LTX explants -->      
					<case value="12" set-concept="B:B-PL" set-value=""/> <!-- plasma -->
					<case value="13" set-concept="" set-value="" action="drop-fact"/> <!-- electric nose sample -->
					<otherwise action="drop-fact"/>
				</map>
			</value>
			<value column="FF.15861.bio_3" xsi:type="integer" na="">
				<map>
					<case value="1" set-concept="B:LAS-LB" set-value=""/> <!-- BAL -->
					<case value="2" set-concept="B:B-SE" set-value=""/> <!-- serum -->
					<case value="3" set-concept="B:B-WE" set-value=""/> <!-- EDTA blood -->
					<case value="4" set-concept="B:LAS-EBC" set-value=""/> <!-- exhaled breath condensate -->
					<case value="5" set-concept="" set-value="" action="drop-fact"/> <!-- exhaled air sample -->
					<case value="6" set-concept="B:B-WNAP" set-value=""/> <!-- PAX gene blood -->    
					<case value="7" set-concept="" set-value="" action="drop-fact"/> <!-- transbronchial biopsy -->
					<case value="8" set-concept="" set-value="" action="drop-fact"/> <!-- lung tissue post VATS -->
					<case value="9" set-concept="" set-value="" action="drop-fact"/> <!-- lung tissue post LTX -->
					<case value="10" set-concept="" set-value="" action="drop-fact"/> <!-- histology slides from VATS biopsy -->
					<case value="11" set-concept="" set-value="" action="drop-fact"/> <!-- histology slides from LTX explants -->      
					<case value="12" set-concept="B:B-PL" set-value=""/> <!-- plasma -->
					<case value="13" set-concept="" set-value="" action="drop-fact"/> <!-- electric nose sample -->
					<otherwise action="drop-fact"/>
				</map>
			</value>
	
	<!-- therapy -->
			<!-- Bronchoscopy -->
			<value column="FF.1952.qsphb_6" xsi:type="integer" na="1"><map set-concept="S:10847001"><case value="1"/><otherwise action="drop-fact"/></map></value>
			<value column="FF.1964.qsphf_6" xsi:type="integer" na="1"><map set-concept="S:10847001"><case value="1"/><otherwise action="drop-fact"/></map></value>
			
			<!-- Long term oxygen therapy (LTOT -->
			<value column="FF.1941.qsphb_19_d_a" xsi:type="integer" na="1"><map set-concept="S:243137006"><case value="1"/><otherwise action="drop-fact"/></map></value>
		</virtual>
	</eav-table>
</datasource>

  `;
  public feedback:string[]=[];
  constructor() { }

  ngOnInit() {
  }

  public inputFileSelected(fileInput: any){
    var dateien = fileInput.target.files;
    for (var i = 0, f; f = dateien[i]; i++) {
      if (!f.type.match('text/plain') && !f.type.match('text/xml')) {
        continue;
      }
      var reader = new FileReader();
      reader.onload = ((theFile) => {
        return ((e) => {
          this.xmlFileContent = e.target.result;
        });
      })(f);
      reader.readAsText(f, "UTF-8");
    }
  }

  public analyze(){
    parseString( this.xmlFileContent, ((err, result:IClientConfiguration) => {
      console.log(result);
      this.readConfig(result); // Prints JSON object!
    }));
  }

  private readConfig(config:IClientConfiguration) {
	  let cc = new ClientConfiguration(config);
	  cc.extractMappings();
	  cc.readMappings((s:string)=>{this.feedback.push(s)});
  }
}

class ClientConfiguration {
	config:IClientConfiguration;
	constructor(config: IClientConfiguration){
		this.config = config;
	}

	private mappings:Mapping[]=[];

	public extractMappings():Mapping[]{
		this.mappings = [];

		this.config.datasource["eav-table"].forEach(et => {
			let file = et.source[0].url[0];
			et.virtual[0].value.forEach(v => {
				let column = v.$.column;
				if (v.map[0]) {
					this.readMapIntoMappings(v.map[0], file, column, "");
				}
			});
		});

		this.config.datasource["wide-table"].forEach(wt => {
			let file = wt.source[0].url[0];
			wt.mdat[0].concept.forEach(c => {
				let concept = c.$.id;
				let value = c.value[0];
				let column = value.$.column;
				if (value.map) {
					this.readMapIntoMappings(value.map[0],file,column,concept);
				}
			});
		});

		return this.mappings;
	}

	/**
	 * TODO: otherwise speziell behandeln
	 * 
	 * @param map 
	 * @param file 
	 * @param column 
	 * @param concept 
	 */
	private readMapIntoMappings(map:Map, file:string, column:string, concept:string){
		let mapconcept = map.$ && map.$["set-concept"] || concept;
		let cases = map.case && map.otherwise && map.case.concat([map.otherwise]) || map.case || map.otherwise && [map.otherwise];
		if (cases) {
			cases.forEach(c => {
				let caseconcept = c.$ && c.$["set-concept"] || mapconcept;
				this.getMapping(caseconcept).occurances.push({
					column: column,
					file: file,
					value: c.$ && c.$.value,
					drop: c.$ && c.$.action == "drop-fact"
				});
			});
		}
		else {
			this.getMapping(mapconcept).occurances.push({
				column: column,
				file: file
			});
		}
	}

	private getMapping(concept:string):Mapping{
		let mapping = this.mappings.filter(m => m.concept == concept)[0];
		if (!mapping) {
			mapping = {
				concept: concept,
				occurances: []
			}
			this.mappings.push(mapping);
		}
		return mapping;
	}

	public readMappings(callback:(s:string)=>void){
		this.mappings.forEach(m => {
			let s = m.concept + ": ";
			m.occurances.forEach(o => {
				console.log(o);
				if (o.drop) return;
				s = s + o.file+"."+o.column;
				if (o.value) s+="=="+o.value;
				s+=" || ";
			});
			callback(s);
		})
	}
}

interface Mapping {
	concept:string,
	occurances:Occurance[]
}
interface Occurance {
	file:string,
	column:string,
	value?:string,
	drop?:boolean
}

interface IClientConfiguration {
  "datasource": {
    $:{},
    "eav-table":EAVTable[],
    meta:{},
    "patient-table":{},
	"visit-table":{},
	"wide-table":WideTable[]
  }
}

interface EAVTable {
  idat: IDat[],
  mdat: EAVMDat[],
  source: Source[],
  virtual: Virtual[]
}

interface WideTable {
	idat: IDat[],
	mdat: WideMdat[],
	source: Source[]
}

interface IDat {
  "patient-id":[],
  "visit-id":[],
  start:[]
}

interface WideMdat {
	concept: Concept[]
}

interface Concept {
	$:{id:string},
	unit: ColumnTag[],
	value: ColumnTag[]
}

interface EAVMDat {
  concept: ColumnTag[],
  end: ColumnTag[],
  start: ColumnTag[],
  type: ColumnTag[],
  unit: ColumnTag[],
  value: ColumnTag[]
}

interface Source {
  $: {},
  seperator: string[],
  url: string[]
}

interface Virtual {
  value: ColumnTag[]
}

interface Map {
  $: {
    "set-concept"?: string
  }
  case: Case[],
  otherwise: Case
}

interface Case {
	$: {
		value:string,
		"set-concept"?: string,
		action:string
	}
}

interface ColumnTag {
  $: {
	column:string,
	na:string,
	"na-action":string,
	"xsi:type":string
  },
  map: Map[]
}