const { chromium }=require('C:/Users/HP/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 const page=await browser.newPage({viewport:{width:1440,height:1050}});
 await page.goto('http://127.0.0.1:5173'); await page.waitForTimeout(1800);
 await page.screenshot({path:'documentation/evidence/01_landing.png',fullPage:true});
 const auth=JSON.parse(fs.readFileSync('documentation/local_session.json'));
 await page.evaluate(token=>localStorage.setItem('berry_bot_token',token),auth.access_token);
 await page.reload(); await page.waitForTimeout(1400);
 await page.screenshot({path:'documentation/evidence/02_dashboard.png',fullPage:true});
 await page.getByRole('button',{name:'Resume Analysis',exact:true}).first().click(); await page.waitForTimeout(500);
 for (const [file,num] of [['Sample_fullstack_Resume.pdf','03'],['Sample_aiml_Resume.pdf','04'],['Vijaya_Sri_Manda_Resume.pdf','05']]) {
  const response=page.waitForResponse(r=>r.url().endsWith('/api/resumes/upload')&&r.request().method()==='POST');
  await page.locator('input[type=file]').setInputFiles('documentation/resumes/'+file);
  const res=await response; var uploaded=await res.json(); await page.waitForTimeout(500);
  await page.screenshot({path:`documentation/evidence/${num}_upload.png`,fullPage:true});
 }
 const headers={Authorization:'Bearer '+auth.access_token};
 const correction=JSON.parse(fs.readFileSync('documentation/corrected_profile.json'));
 const updated=await page.request.put(`http://127.0.0.1:8000/api/resumes/${uploaded.id}`,{headers,data:correction});
 if(!updated.ok()) throw Error(await updated.text());
 const record=JSON.parse(fs.readFileSync('documentation/evidence/run_record.json'));
 record.corrected_resume=await updated.json(); record.config.resume_id=uploaded.id;
 await page.getByRole('button',{name:'Proceed to Interview Config'}).click();
 await page.getByRole('button',{name:'Resume Analysis',exact:true}).first().click(); await page.waitForTimeout(600);
 await page.screenshot({path:'documentation/evidence/06_corrected_profile.png',fullPage:true});
 await page.getByRole('button',{name:'Proceed to Interview Config'}).click(); await page.waitForTimeout(300);
 await page.screenshot({path:'documentation/evidence/07_config.png',fullPage:true});
 await page.getByRole('button',{name:'Enter Live AI Interview',exact:true}).click();
 await page.screenshot({path:'documentation/evidence/08_consent.png'});
 const createdPromise=page.waitForResponse(r=>r.url().endsWith('/api/interviews')&&r.request().method()==='POST');
 await page.getByRole('button',{name:'I Agree & Enter Interview'}).click();
 const created=await (await createdPromise).json(); record.sessions=[];
 await page.waitForTimeout(1000);
 await page.screenshot({path:'documentation/evidence/09_live.png',fullPage:true});
 record.ui_session_id=created.id;
 const answers=record.initial_sessions[0].report.questions.map(q=>q.candidate_answer);
 const evaluations=[];
 for(let i=0;i<5;i++) {
   await page.getByRole('button',{name:'Type Answer',exact:true}).click();
   await page.locator('textarea').fill(answers[i]);
   const evalPromise=page.waitForResponse(r=>r.url().endsWith(`/interviews/${created.id}/answer`));
   await page.getByRole('button',{name:'Submit Answer',exact:true}).click();
   evaluations.push(await (await evalPromise).json()); await page.waitForTimeout(350);
   await page.screenshot({path:`documentation/evidence/10_question_${i+1}.png`,fullPage:true});
   console.log('answered',i+1);
   await page.getByRole('button',{name:i===4?'Complete & View Final Report':'Continue to Next Question',exact:true}).click();
   await page.waitForTimeout(400);
 }
 await page.waitForTimeout(1200);
 await page.screenshot({path:'documentation/evidence/11_results.png',fullPage:true});
 const report=await (await page.request.get(`http://127.0.0.1:8000/api/interviews/${created.id}/report`,{headers})).json();
 record.sessions.push({id:created.id,report,evaluations});
 let response=await page.request.post('http://127.0.0.1:8000/api/interviews',{headers,data:record.config});
 const repeat=await response.json();
 await page.request.post(`http://127.0.0.1:8000/api/interviews/${repeat.id}/start`,{headers});
 const eval2=[];
 for(const answer of answers){
   eval2.push(await (await page.request.post(`http://127.0.0.1:8000/api/interviews/${repeat.id}/answer`,{headers,data:{answer_text:answer,input_type:'text'}})).json());
   await page.request.post(`http://127.0.0.1:8000/api/interviews/${repeat.id}/next-question`,{headers});
 }
 const report2=await (await page.request.get(`http://127.0.0.1:8000/api/interviews/${repeat.id}/report`,{headers})).json();
 record.sessions.push({id:repeat.id,report:report2,evaluations:eval2});
 record.repeat_identical_questions=report.questions.map((q,i)=>q.question_text===report2.questions[i].question_text);
 record.repeat_identical_scores=evaluations.map((q,i)=>q.score_overall===eval2[i].score_overall);
 await page.getByRole('button',{name:'History',exact:true}).click(); await page.waitForTimeout(600);
 await page.screenshot({path:'documentation/evidence/12_repeat_history.png',fullPage:true});
 console.log('COMPLETE',created.id,repeat.id,report.overall_score,report2.overall_score);
 fs.writeFileSync('documentation/evidence/run_record.json',JSON.stringify(record,null,2));
 await browser.close();
})();
