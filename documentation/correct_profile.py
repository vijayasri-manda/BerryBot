import json,sys
from pathlib import Path
sys.path.append(str(Path('backend/venv/Lib/site-packages').resolve()))
import httpx
p=Path('documentation/evidence/run_record.json'); r=json.loads(p.read_text(encoding='utf-8'))
r['initial_sessions']=r.pop('sessions')
primary=next(x for x in r['resumes'] if x['filename']=='Vijaya_Sri_Manda_Resume.pdf')
d=primary['parsed_data'].copy()
d['projects']=[
 {'title':'Quantum Traffic Optimization System','technologies':['Python','Qiskit','Streamlit','Google Maps API'],'description':'Quantum-inspired traffic optimization engine and interactive route analytics dashboard.'},
 {'title':'CarePulse Healthcare Management System','technologies':['React.js','Spring Boot','MySQL'],'description':'Patient, doctor and appointment management with JWT authentication and REST APIs.'},
 {'title':'Drone Detection AI','technologies':['YOLO','OpenCV','Firebase'],'description':'Real-time drone detection from video feeds.'},
 {'title':'Fresh Cart MERN Web App','technologies':['React.js','Node.js','Express.js','MongoDB'],'description':'E-commerce product catalog and shopping cart management.'}]
d['education']=[{'degree':'B.Tech AI and DS','institution':'Seshadri Rao Gudlavalleru Engineering College','year':'Pursuing','grade_or_gpa':'9.01 till date'},{'degree':'Diploma CME','institution':'VKR, VNB and AGK College','year':'2021-2024','grade_or_gpa':'9.13'}]
d['experience']=[{'company':'SmartInternz','role':'Full Stack MERN Intern','duration':'May 2025 to Jul 2025'},{'company':'Indian Servers','role':'Cybersecurity Intern','duration':'Apr 2025 to Jul 2025'},{'company':'SkillDzire','role':'Data Science Intern','duration':'May 2025 to Jun 2025'}]
d['summary']='B.Tech AI and DS student with MERN, cybersecurity and data science internships and projects in traffic optimization, healthcare management, drone detection and e-commerce.'
d['topics_to_explore']=['Quantum Traffic Optimization System architecture and validation','Python concurrency and memory','Database indexing and query plans','API reliability and idempotency','Engineering collaboration']
Path('documentation/corrected_profile.json').write_text(json.dumps({'candidate_name':'Manda Vijaya Sri','summary':d['summary'],'parsed_data':d},indent=2))
p.write_text(json.dumps(r,indent=2),encoding='utf-8')
