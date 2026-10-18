import json,re,sys
from pathlib import Path
from xml.sax.saxutils import escape
from reportlab.platypus import SimpleDocTemplate,Paragraph,Spacer,PageBreak,Image,Table,TableStyle,KeepTogether
from reportlab.lib.styles import getSampleStyleSheet,ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.utils import ImageReader
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
sys.path.insert(0,str(Path('backend').resolve()))
from app.sample_data.sample_resumes import SAMPLE_RESUMES
root=Path('documentation'); r=json.loads((root/'evidence/run_record.json').read_text(encoding='utf-8'))
first,second=r['sessions']; report=first['report']; report2=second['report']
styles=getSampleStyleSheet()
styles.add(ParagraphStyle(name='ReportTitle',fontName='Helvetica-Bold',fontSize=16,leading=18.4,spaceAfter=14,textColor=colors.black))
styles['Normal'].fontSize=12; styles['Normal'].leading=13.8; styles['Normal'].spaceAfter=8
for key in ['Heading1','Heading2','Heading3']:
 styles[key].textColor=colors.black; styles[key].spaceBefore=12; styles[key].spaceAfter=8
 styles[key].fontSize=16 if key=='Heading1' else 14
 styles[key].leading=styles[key].fontSize*1.15
styles.add(ParagraphStyle(name='SmallText',parent=styles['Normal'],fontSize=12,leading=13.8))
styles.add(ParagraphStyle(name='PromptText',parent=styles['Normal'],fontName='Courier',fontSize=12,leading=13.8))
story=[]; width=A4[0]-3.5*cm; height=A4[1]-2*cm
def p(text,style='Normal'): story.append(Paragraph(escape(str(text)).replace('\n','<br/>'),styles[style]))
def h(text): p(text,'Heading1' if re.match(r'^[1-8] ',text) else 'Heading2')
def page(): story.append(PageBreak())
def table(rows,widths=None):
 data=[[Paragraph(escape(str(v)),styles['SmallText']) for v in row] for row in rows]
 t=Table(data,colWidths=widths or [width/len(rows[0])]*len(rows[0]),repeatRows=1,hAlign='LEFT')
 t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#dce8f1')),('GRID',(0,0),(-1,-1),.4,colors.HexColor('#d9d9d9')),('VALIGN',(0,0),(-1,-1),'MIDDLE'),('LEFTPADDING',(0,0),(-1,-1),8),('RIGHTPADDING',(0,0),(-1,-1),8),('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),7)]))
 story.extend([t,Spacer(1,10)])
def img(path,maxh=630):
 iw,ih=ImageReader(str(path)).getSize(); scale=min(width/iw,maxh/ih)
 story.append(Image(str(path),width=iw*scale,height=ih*scale))
def footer(canvas,doc):
 canvas.setFont('Helvetica',11); canvas.setFillColor(colors.black)
 canvas.drawRightString(A4[0]-cm,A4[1]-16,'Seshadri Rao Gudlavalleru Engineering College')
 canvas.drawRightString(A4[0]-cm,12,'Page No:')
p('Berri Bot Project Documentation','ReportTitle')
p('Resume based interview workflow and test record','Heading2')
p('Prepared for Manda Vijaya Sri\nExecution date 18 October 2026\nProject E:\\Berry Bot')
p('This record explains how Berri Bot was run locally, how three resumes were uploaded, and how the supplied resume was used in a five-question demonstration interview. It records the actual questions, submitted demonstration answers, evaluations, repeated test results and screenshots in the requested order.')
p('The completed sessions both returned 88.0 percent and Strong Match. The answers were authored for this demonstration and were not spoken, supplied or confirmed by Manda Vijaya Sri. The result measures the local heuristic demonstration, and does not establish the candidate\'s ability or constitute a hiring decision.')
h('1 Introduction to the Chatbot')
p('Berri Bot is a resume based interview practice and assessment application. Candidates upload a PDF or DOCX resume, configure a role and interview language, answer questions, and receive scores and feedback. Recruiters can inspect reports and record reviewed recommendations.')
h('Purpose and features')
p('The application supports candidate authentication, resume extraction, interview configuration, an animated interviewer, typed responses, browser speech controls, question evaluations, history and PDF reports. Its interface lists English, Telugu, Hindi, Tamil and Kannada. This run tested English with typed answers; microphone recognition and other languages were not verified.')
page(); p('1 Introduction to the Chatbot continued','Heading1')
h('How the system works')
p('The React and TypeScript frontend calls a FastAPI backend. SQLAlchemy stores accounts, resumes, sessions and question evaluations in SQLite. The parser uses pypdf for PDF text and python-docx for Word files. The interview service builds a question plan from the structured resume; each answer is evaluated and stored. Completing the interview averages the answered-question scores and generates a recommendation.')
p('The health endpoint identified version 2.0.0 and Berry Bot Heuristic AI Local Demo Mode. No cloud model was used. In this mode the question generator fills fixed language templates using the first project, first programming language, first framework and first database. Scoring uses answer length, technical keyword matches and solution words. A function for dynamic follow-ups exists, but the inspected interview route advances through the stored plan and did not insert follow-up questions in this test.')
table([['Criterion','Weight'],['Technical correctness','30 percent'],['Relevance','20 percent'],['Depth of understanding','20 percent'],['Problem solving','20 percent'],['Clarity of explanation','10 percent']],[width*.7,width*.3])
p('An answer score is the weighted sum of the five dimension scores. The final score is the arithmetic mean of answered questions. These are five criteria on a 0 to 100 scale, rather than a score out of five.')
h('Observed limitations')
p('The first PDF upload produced a generic Full-Stack Web Application project and an incorrect degree, institution and GPA. Its extracted email joined adjacent PDF text. Correcting projects, education, experience, summary and topics through the existing resume update API fixed the main question context. That API does not persist candidate email or phone updates; the malformed parsed email remains visible in screenshots. The original PDF is the authoritative resume.')
p('The heuristic evaluator does not substantively check correctness or expected topic coverage. For example, the system-design answer did not explain idempotency-key storage or atomic deduplication but scored 90.5. The system-design question also described a REST API in React, illustrating mechanically substituted templates. Strong scores should therefore be read as software outputs requiring human review.')
page(); p('2 Resume Upload','Heading1')
p('Three PDF files were uploaded through the API and then through the browser interface. Resume one is the user supplied original. Resumes two and three are fictional profiles distributed with this project, converted to PDF for upload testing. They are not additional real candidates. The main interview uses only the corrected user profile.')
table([['Resume','Source','Use'],['Manda Vijaya Sri','Supplied PDF','Main interview and repeat test'],['Priya Sharma','Built-in fullstack sample','Additional PDF upload test'],['Rahul Varma','Built-in aiml sample','Additional PDF upload test']],[140,155,width-295])
h('Upload and review findings')
p('All three PDFs were accepted. Successful extraction did not guarantee faithful field parsing. For the main resume the uncorrected test sessions 7 and 8 generated generic project questions. The primary completed browser session '+str(first['id'])+' and repeat session '+str(second['id'])+' used corrected resume record '+str(r['corrected_resume']['id'])+'. Earlier configured or exploratory records visible in History are not the final comparison.')
p('The reviewed profile retains the four project names from the PDF: Quantum Traffic Optimization System, CarePulse Healthcare Management System, Drone Detection AI, and Fresh Cart MERN Web App. Education was corrected to B.Tech AI and DS at Seshadri Rao Gudlavalleru Engineering College, CGPA 9.01 till date, and Diploma CME at VKR, VNB and AGK College, CGPA 9.13. Internship organizations were corrected to SmartInternz, Indian Servers and SkillDzire.')
h('Resume one original document')
p('The next page reproduces the supplied resume. The two following profiles reproduce the project sample data in a readable record format. Original and generated upload PDFs are included in the accompanying project folder.')
page(); p('Resume one Manda Vijaya Sri','Heading1'); img(root/'evidence/resume_original.png',650)
for key in ['fullstack','aiml']:
 sample=SAMPLE_RESUMES[key]; page(); p('Resume '+('two ' if key=='fullstack' else 'three ')+sample['candidate_name'],'Heading1')
 p('Fictional project sample profile','SmallText'); p(sample['candidate_email']+' | '+sample['candidate_phone']); p(sample['summary'])
 h('Skills')
 for category,values in sample['skills'].items(): p(category.replace('_',' ').title()+': '+', '.join(values))
 h('Projects')
 for proj in sample['projects']:
  p(proj['title'],'Heading3'); p('Technologies: '+', '.join(proj['technologies'])); p(proj['description'])
  for line in proj.get('key_highlights',[]): p('- '+line,'SmallText')
 h('Experience and education')
 for item in sample['experience']+sample['education']:
  p(' | '.join(str(v) for k,v in item.items() if not isinstance(v,list)),'SmallText')
  for line in item.get('responsibilities',[]): p('- '+line,'SmallText')
 p('Certifications: '+', '.join(sample['certifications']),'SmallText')
page(); p('3 Procedure','Heading1')
steps=[('Start the backend','Open PowerShell in E:\\Berry Bot\\backend and run .\\venv\\Scripts\\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000. The no-reload command avoids the Windows named-pipe failure encountered with run.py.'),('Start the frontend','The normal developer command is npm run dev in frontend. In this environment Vite failed to bundle native Tailwind dependencies and spawn a helper. The existing frontend/dist build was served with documentation/serve.py, which proxies /api to port 8000. Run the bundled Python executable with documentation/serve.py from the repository root.'),('Verify the running service','Open http://127.0.0.1:5173 and inspect http://127.0.0.1:8000/api/health. Confirm the healthy status and local heuristic provider.'),('Sign in or register','Create a candidate account with the candidate name. This test used a dedicated documentation account, not the resume email. Demo Candidate is also available for general practice.'),('Upload all three resumes','Choose Resume Analysis, select the PDF and wait for the successful extraction message. Repeat for both sample PDFs. Upload the user resume last so it is active for the main interview.'),('Review the parsed profile','Compare the extracted projects, skills, education and experience with the original. In this run structured corrections were submitted through PUT /api/resumes/{id}, because the visible editor only changes the summary. The submitted correction is retained in corrected_profile.json.'),('Configure the interview','Select Proceed to Interview Config. Use Full Stack Developer, Fresher, Mixed, English, 15 minutes and five questions. Confirm the selected resume is the corrected user record.'),('Enter the interview','Click Enter Live AI Interview and review Audio Setup and Privacy Consent. This demonstration used the typed mode and did not test the microphone.'),('Answer and evaluate','Choose Type Answer, enter a response and click Submit Answer. Read the immediate rubric and feedback. Capture the output, then choose Continue to Next Question. Repeat for all five questions.'),('Finish and inspect','On question five choose Complete and View Final Report. Review the score, recommendation, question transcript, strengths and knowledge gaps. Use the report download control for the application report if needed.'),('Repeat and compare','Create a new session with the same resume and settings. Submit exactly the same five answers. Compare question text, criterion scores, feedback and recommendation. This repeat was executed against the same live API, with its results visible in History.'),('Prepare the record','Retain exact questions and answers, raw JSON, screenshots and source prompt templates. Build this PDF and inspect every rendered page before sharing.')]
for i,(title,body) in enumerate(steps,1):
 if i==7: page(); p('3 Procedure continued','Heading1')
 p(str(i)+' '+title,'Heading3'); p(body)
h('Verification outcome')
p('The backend test suite completed with 9 passed and 36 warnings. Warnings include deprecated library APIs and pytest cache permission messages. The observed resume fidelity and heuristic scoring limitations remain despite those passing tests. Frontend development build startup was not successful; the existing compiled UI was used for browser testing.')
page(); p('4 Prompts Used','Heading1')
h('Build and documentation instruction provenance')
p('The historical conversational prompts used to create the original project are not present in the supplied repository or this chat. They cannot be reconstructed as factual records. The available implementation prompts are reproduced below. They are source templates, not cloud requests executed during this local demo.')
p('Documentation request used for this work: Prepare a document in the order Introduction to the Chatbot, Resume Upload, Procedure, Prompts Used, Interview Questions and Answers, Repeated Question Testing, Final Selection Decision, and Screenshots. First run the project and use Vijaya_Sri_Manda_Resume.pdf.')
h('Operating configuration')
p(json.dumps(r['config'],indent=2),'PromptText')
p('The resume_id value identifies the corrected user upload. Operation requests were POST /api/interviews, POST /api/interviews/{id}/start, POST /api/interviews/{id}/answer with answer_text and input_type text, and POST /api/interviews/{id}/next-question. GET /api/interviews/{id}/report retrieved the recorded result. The application has no general free-form user prompt box; it asks questions and accepts answers.')
h('Testing inputs')
p('The exact five local question prompts, five submitted answers and returned feedback are printed in section 5. The repeated test resubmitted those strings without edits under the same settings. Section 6 records the repeated responses and score comparison. No new conversational build prompt was executed to alter the application code.')
source=Path('backend/app/services/ai_service.py').read_text(encoding='utf-8')
templates=re.findall(r'prompt = f"""(.*?)"""',source,re.S)
for idx,template in enumerate(templates,1):
 page(); p('Implementation prompt '+str(idx),'Heading2')
 p('Gemini interview planning template' if idx==1 else 'Gemini answer evaluation template','Heading3')
 p('Source backend/app/services/ai_service.py. Braced values are runtime substitutions. This template was not sent to an external provider in the documented run.','SmallText')
 p(template.strip(),'PromptText')
page(); p('5 Interview Questions and Answers','Heading1')
p('Primary browser session '+str(first['id'])+'. All answers below are AI-authored demonstration inputs submitted on behalf of the workflow test. They must not be attributed to the candidate as actual interview testimony. The chatbot text below is transcribed from the live API record.')
for i,(q,e) in enumerate(zip(report['questions'],first['evaluations'])):
 if i: page()
 p('Question '+str(i+1)+' '+q['category'],'Heading2'); p(q['question_text'])
 h('Submitted demonstration answer'); p(q['candidate_answer'])
 h('Chatbot response'); p(e['feedback_justification']); p('Strengths: '+e['strengths']); p('Missing concepts: '+e['missing_concepts']); p('Ideal answer summary: '+e['ideal_answer_summary'])
 table([['Overall','Technical','Relevance','Depth','Problem solving','Clarity'],[e[k] for k in ['score_overall','score_technical','score_relevance','score_depth','score_problem_solving','score_clarity']]])
page(); p('6 Repeated Question Testing','Heading1')
p('A second session '+str(second['id'])+' used the same corrected resume, role, level, language, interview type and five-question count. The exact questions from section 5 were generated again, and the identical answer text was submitted to each. Record IDs and timestamps differ between sessions; these metadata differences are expected.')
rows=[['Question','Same text','Run one','Run two','Feedback match']]
for i,(q,q2) in enumerate(zip(report['questions'],report2['questions'])):
 rows.append([i+1,'Yes' if q['question_text']==q2['question_text'] else 'No',q['score_overall'],q2['score_overall'],'Yes' if q['feedback_justification']==q2['feedback_justification'] else 'No'])
table(rows,[55,95,80,80,width-310])
p('Both aggregate scores were 88.0 percent. Both recommendations were Strong Match. All five criterion scores, overall scores, strengths, missing concepts and ideal-answer summaries matched for each repeated question. This demonstrates repeatability of the local heuristic for identical inputs; it does not validate semantic accuracy or predict cloud model behavior.')
h('Exact repeated chatbot responses')
for i,e in enumerate(second['evaluations'],1):
 if i==3: page(); p('6 Repeated Question Testing continued','Heading1')
 p('Repeated question '+str(i)+' response','Heading3'); p(e['feedback_justification']); p('Strengths: '+e['strengths'],'SmallText'); p('Missing concepts: '+e['missing_concepts'],'SmallText'); p('Ideal answer summary: '+e['ideal_answer_summary'],'SmallText')
page(); p('7 Final Selection Decision','Heading1')
p('Recorded chatbot recommendation Strong Match','Heading2'); p('Overall score 88.0 percent in primary session '+str(first['id'])+' and repeat session '+str(second['id'])+'.')
h('Chatbot explanation verbatim'); p(report['recommendation_justification'])
h('Evidence used by the application')
table([['Dimension','Session score'],['Technical correctness',report['technical_score']],['Relevance',report['relevance_score']],['Depth',report['depth_score']],['Problem solving',report['problem_solving_score']],['Clarity',report['clarity_score']]])
p('The final mean is (85.9 + 91.1 + 90.5 + 90.5 + 82.1) / 5 = 88.02, rounded to 88.0. The local recommendation thresholds are Strong Match at 80 or above, Potential Match from 65 to below 80, Further Assessment Recommended from 50 to below 65, and Does Not Yet Meet the Defined Criteria below 50.')
p(report['strengths_summary']); p(report['knowledge_gaps_summary'])
h('Interpretation and final authority')
p('The software recommendation is recorded as requested. No actual candidate selection has been made. The responses were demonstration inputs and the local evaluator relies heavily on keywords and length. It awarded high scores even where an answer omitted the main requested concept. A recruiter should review the authentic resume, obtain the candidate\'s own answers, and verify technical claims before making any selection decision. No recruiter override was applied in these sessions.')
screens=[('01_landing.png','Application landing screen','The running compiled frontend introduces the workflow and languages.'),('03_upload.png','Additional resume one upload','The Priya Sharma sample PDF was accepted by the upload endpoint.'),('04_upload.png','Additional resume two upload','The Rahul Varma sample PDF was accepted by the upload endpoint.'),('05_upload.png','User resume upload before correction','Successful extraction message and generic project data illustrate the parser fidelity problem.'),('06_corrected_profile.png','Reviewed user profile','Corrected project names are shown. The malformed parsed contact field remains an API limitation.'),('07_config.png','Interview configuration','Full Stack Developer, Fresher, Mixed, English, 15 minutes and five questions.'),('08_consent.png','Audio setup and consent screen','The workflow proceeded with typed inputs. Microphone behavior was not tested.'),('09_live.png','Live interview question','The first question uses Quantum Traffic Optimization System from the corrected resume.')]
screens +=[(f'10_question_{i}.png',f'Question {i} evaluation','Real submitted demonstration answer and the returned rubric feedback.') for i in range(1,6)]
screens +=[('11_results.png','Completed interview results','The primary session reports 88 percent and Strong Match.'),('12_repeat_history.png','Repeated test history','The completed repeat appears alongside earlier exploratory test records.')]
for i,(file,title,caption) in enumerate(screens):
 page()
 if i==0: p('8 Screenshots','Heading1'); p('Screenshots captured from the running application on 18 October 2026. Images show actual UI outputs; captions distinguish observed behavior from untested features.','SmallText')
 p('Figure '+str(i+1)+' '+title,'Heading2'); p(caption,'SmallText'); img(root/'evidence'/file,560 if i==0 else 650)
out=root/'Berri_Bot_Project_Documentation_Formatted.pdf'
SimpleDocTemplate(str(out),pagesize=A4,rightMargin=cm,leftMargin=2.5*cm,topMargin=cm,bottomMargin=cm,title='Berri Bot Project Documentation',author='Project documentation for Manda Vijaya Sri').build(story,onFirstPage=footer,onLaterPages=footer)
print(out.resolve())
