import sys,json,shutil
from pathlib import Path
sys.path.append(str(Path('backend/venv/Lib/site-packages').resolve()))
import httpx
sys.path.insert(0,str(Path('backend').resolve()))
from app.sample_data.sample_resumes import SAMPLE_RESUMES
from reportlab.platypus import SimpleDocTemplate,Paragraph,Spacer
from reportlab.lib.styles import getSampleStyleSheet
from xml.sax.saxutils import escape
out=Path('documentation'); evidence=out/'evidence'; styles=getSampleStyleSheet()
shutil.copy2(r'D:\New Resume\Vijaya_Sri_Manda_Resume.pdf',out/'resumes/Vijaya_Sri_Manda_Resume.pdf')
for key in ['fullstack','aiml']:
    if key not in SAMPLE_RESUMES: print('KEYS',list(SAMPLE_RESUMES)); continue
    sample=SAMPLE_RESUMES[key]; flow=[Paragraph(sample['candidate_name']+' Sample Resume',styles['Title']),Paragraph('Fictional demonstration profile supplied with Berri Bot',styles['Normal'])]
    for field in ['summary','skills','projects','experience','education','certifications']:
        flow.append(Paragraph(field.title(),styles['Heading2']))
        value=sample[field]
        for item in (value if isinstance(value,list) else [value]):
            flow.append(Paragraph(escape(json.dumps(item,ensure_ascii=True) if not isinstance(item,str) else item),styles['BodyText']))
            flow.append(Spacer(1,6))
    SimpleDocTemplate(str(out/f'resumes/Sample_{key}_Resume.pdf')).build(flow)
c=httpx.Client(base_url='http://127.0.0.1:8000/api',timeout=60)
record={'health':c.get('/health').json(),'date':'18 October 2026','answers_provenance':'AI-authored demonstration answers; not supplied or confirmed by the candidate.'}
email='vijaya.documentation@example.com'; password='Documentation2026!'
r=c.post('/auth/register',json={'email':email,'password':password,'full_name':'Manda Vijaya Sri','role':'candidate'})
if r.status_code!=200: r=c.post('/auth/login',json={'email':email,'password':password})
r.raise_for_status(); auth=r.json(); c.headers['Authorization']='Bearer '+auth['access_token']
# Retain local test login for screenshot session, separate from publishable evidence.
(out/'local_session.json').write_text(json.dumps(auth))
record['resumes']=[]
for file in (out/'resumes').glob('*.pdf'):
    with file.open('rb') as f: r=c.post('/resumes/upload',files={'file':(file.name,f,'application/pdf')})
    r.raise_for_status(); record['resumes'].append(r.json())
primary=next(r for r in record['resumes'] if r['filename']=='Vijaya_Sri_Manda_Resume.pdf')
config={'job_role':'Full Stack Developer','experience_level':'Fresher','interview_type':'Mixed','language':'en','duration_minutes':15,'total_questions':5,'resume_id':primary['id']}
record['config']=config
record['sessions']=[]
for run in range(2):
    r=c.post('/interviews',json=config); r.raise_for_status(); session=r.json(); sid=session['id']
    if run==0: print(json.dumps({'parsed':primary,'questions':session['questions']},indent=2))
    c.post(f'/interviews/{sid}/start').raise_for_status()
    answers=[
      'For my Quantum Traffic Optimization System, the resume lists Python, Qiskit, Streamlit and Google Maps API. In this demonstration I would separate route data collection, optimization and dashboard presentation. I would validate missing traffic inputs, compare routes against a classical baseline and test response latency. The resume does not establish quantum advantage or measured performance, so those claims require supporting experiments.',
      'I would handle API concurrency with asynchronous I/O for network calls and a bounded worker pool for CPU intensive tasks. I would prevent shared state races using isolated request data and transaction boundaries. I would test simultaneous requests, measure latency and log failures before choosing a deployment scale. This is a proposed approach rather than a verified description of my implementation.',
      'I would design database indexes around frequent filters and joins, inspect the query plan and measure latency using representative data. To handle consistency I would use a transaction for related updates, validate inputs and test rollback paths. Indexes speed reads but consume storage and make writes more expensive, so I would retain only indexes justified by measurements.',
      'For a reliable API I would validate requests, enforce authentication and authorization, use parameterized database queries and return safe error messages. I would handle timeouts with bounded retry policies for idempotent operations. I would add tests, structured logs and metrics so failures can be reproduced and security issues investigated. This describes my proposed design for the scenario.',
      'During a team disagreement I would first ask each member to explain the requirement and the evidence behind their preferred design. I would document the options, agree on a small test and compare the results against shared acceptance criteria. If the issue remained unresolved I would ask the project mentor to help decide. This is a hypothetical behavioral answer for the demonstration.'
    ]
    evaluations=[]
    for q,answer in zip(session['questions'],answers):
        r=c.post(f'/interviews/{sid}/answer',json={'answer_text':answer,'input_type':'text'}); r.raise_for_status(); evaluations.append(r.json())
        c.post(f'/interviews/{sid}/next-question').raise_for_status()
    report=c.get(f'/interviews/{sid}/report'); report.raise_for_status()
    record['sessions'].append({'id':sid,'report':report.json(),'evaluations':evaluations})
record['repeat_identical_questions']=[a['question_text']==b['question_text'] for a,b in zip(record['sessions'][0]['report']['questions'],record['sessions'][1]['report']['questions'])]
record['repeat_identical_evaluations']=record['sessions'][0]['evaluations']==record['sessions'][1]['evaluations']
(evidence/'run_record.json').write_text(json.dumps(record,indent=2,ensure_ascii=False),encoding='utf-8')
print('DONE',[(s['id'],s['report']['overall_score'],s['report']['recommendation']) for s in record['sessions']])
