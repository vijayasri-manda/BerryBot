const { chromium } = require('C:/Users/HP/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const base = 'http://127.0.0.1:5173';
  let hrHeaders, original;
  try {
    await page.goto(base);
    await page.getByRole('button', { name: 'Demo Recruiter', exact: true }).click();
    await page.getByRole('heading', { name: 'Candidate Evaluation Hub' }).waitFor();
    let nav = page.locator('nav');
    assert.equal(await nav.getByRole('button', { name: 'Start Interview', exact: true }).count(), 0);
    assert.equal(await nav.getByRole('button', { name: 'My Resume', exact: true }).count(), 0);
    await nav.getByRole('button', { name: 'Interview Settings', exact: true }).filter({ visible: true }).click();
    await page.locator('#hr-question-count').waitFor();
    const token = await page.evaluate(() => localStorage.getItem('berry_bot_token'));
    hrHeaders = { Authorization: 'Bearer ' + token };
    original = await (await page.request.get(base + '/api/interviews/policy', { headers: hrHeaders })).json();
    await page.locator('#hr-question-count').selectOption('7');
    await page.getByRole('button', { name: 'Save Interview Settings', exact: true }).click();
    await page.getByRole('status').filter({ hasText: '7 questions' }).waitFor();
    fs.mkdirSync('documentation/ui_checks', { recursive: true });
    await page.screenshot({ path: 'documentation/ui_checks/hr_settings.png', fullPage: true });
    await nav.getByRole('button', { name: 'Rubric Weights', exact: true }).filter({ visible: true }).click();
    await page.getByRole('heading', { name: 'Scoring Rubric Weight Allocator' }).waitFor();
    await nav.getByRole('button', { name: 'Audit Trail', exact: true }).filter({ visible: true }).click();
    await page.getByRole('heading', { name: 'Evaluation Audit Log' }).waitFor();
    await nav.getByRole('button', { name: 'Logout', exact: true }).click();
    await page.getByRole('button', { name: 'Demo Candidate', exact: true }).click();
    await nav.getByRole('button', { name: 'Start Interview', exact: true }).filter({ visible: true }).waitFor();
    assert.equal(await nav.getByRole('button', { name: 'Interview Settings', exact: true }).count(), 0);
    assert.equal(await nav.getByRole('button', { name: 'Candidates', exact: true }).count(), 0);
    await nav.getByRole('button', { name: 'Start Interview', exact: true }).filter({ visible: true }).click();
    await page.getByText('7 Questions', { exact: true }).waitFor();
    assert.equal(await page.locator('input[type=range]').count(), 0);
    await page.screenshot({ path: 'documentation/ui_checks/candidate_config.png', fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await nav.getByRole('button', { name: 'My Interviews', exact: true }).filter({ visible: true }).click();
    await page.screenshot({ path: 'documentation/ui_checks/candidate_mobile.png', fullPage: true });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await nav.getByRole('button', { name: 'Start Interview', exact: true }).filter({ visible: true }).click();
    await page.getByText('7 Questions', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Enter Live AI Interview', exact: true }).click();
    const createdPromise = page.waitForResponse(res => res.url().endsWith('/api/interviews') && res.request().method() === 'POST');
    await page.getByRole('button', { name: 'I Agree & Enter Interview', exact: true }).click();
    const created = await (await createdPromise).json();
    assert.equal(created.total_questions, 7);
    assert.equal(created.questions.length, 7);
    await page.getByText('Question 1 of 7', { exact: true }).waitFor();
    await page.screenshot({ path: 'documentation/ui_checks/seven_question_interview.png', fullPage: true });
    assert.deepEqual(errors, []);
    console.log('PASS: HR/candidate navigation, policy save, candidate read-only count, mobile navigation, and seven-question interview. No browser errors.');
  } finally {
    if (hrHeaders && original) {
      const restored = await page.request.put(base + '/api/recruiter/interview-policy', { headers: hrHeaders, data: original });
      assert.equal(restored.status(), 200);
    }
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
