import json
import re
import os
import httpx
from typing import Dict, Any, List, Optional
from app.config import settings

class AIService:
    @classmethod
    def get_active_provider(cls) -> str:
        if settings.GEMINI_API_KEY:
            return "Gemini 2.5 Flash"
        elif settings.OPENAI_API_KEY:
            return "OpenAI GPT-4o-mini"
        elif settings.GROQ_API_KEY:
            return "Groq LLaMA 3.3"
        return "Berry Bot Heuristic AI (Local / Demo Mode)"

    @classmethod
    async def generate_interview_plan(
        cls,
        job_role: str,
        experience_level: str,
        interview_type: str,
        language: str,
        total_questions: int,
        parsed_resume: Optional[Dict[str, Any]] = None,
        job_description: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Generates structured questions rooted in the candidate's resume, job role, and language.
        """
        # If Gemini API key is configured, call Gemini
        if settings.GEMINI_API_KEY:
            try:
                plan = await cls._generate_plan_gemini(
                    job_role, experience_level, interview_type, language, total_questions, parsed_resume, job_description
                )
                if plan and len(plan) == total_questions:
                    return plan
            except Exception as e:
                print(f"[AIService] Gemini API error: {e}. Falling back to internal engine.")

        # Fallback to local heuristic engine
        return cls._generate_plan_heuristic(
            job_role, experience_level, interview_type, language, total_questions, parsed_resume, job_description
        )

    @classmethod
    async def evaluate_answer(
        cls,
        question_text: str,
        candidate_answer: str,
        category: str,
        job_role: str,
        experience_level: str,
        language: str,
        expected_topics: List[str],
        rubric_weights: Dict[str, float]
    ) -> Dict[str, Any]:
        """
        Evaluates candidate answer across:
        - Technical correctness
        - Relevance
        - Depth of understanding
        - Problem solving
        - Clarity of explanation
        """
        if settings.GEMINI_API_KEY and len(candidate_answer.strip()) > 10:
            try:
                evaluation = await cls._evaluate_answer_gemini(
                    question_text, candidate_answer, category, job_role, experience_level, language, expected_topics, rubric_weights
                )
                if evaluation:
                    return evaluation
            except Exception as e:
                print(f"[AIService] Gemini evaluation error: {e}. Falling back to local evaluator.")

        return cls._evaluate_answer_heuristic(
            question_text, candidate_answer, category, job_role, experience_level, language, expected_topics, rubric_weights
        )

    @classmethod
    async def generate_dynamic_follow_up(
        cls,
        parent_question: str,
        candidate_answer: str,
        job_role: str,
        language: str,
        parsed_resume: Optional[Dict[str, Any]] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Generates a targeted follow-up question based on the candidate's actual answer content.
        """
        ans_lower = candidate_answer.lower()

        # Follow-up prompts in supported languages
        translations = {
            "caching": {
                "en": "You mentioned caching and performance. How did you handle cache invalidation, expiration policies, and the cache stampede problem?",
                "te": "మీరు కాషింగ్ మరియు పనితీరు గురించి ప్రస్తావించారు. Cache invalidation, expiration policies, మరియు cache stampede సమస్యను ఎలా పరిష్కరించారు?",
                "hi": "आपने कैशिंग और परफॉरमेंस का उल्लेख किया। आपने Cache invalidation, expiration policies और cache stampede की समस्या को कैसे संभाला?",
                "ta": "நீங்கள் caching மற்றும் செயல்திறனைக் குறிப்பிட்டீர்கள். Cache invalidation மற்றும் cache stampede சிக்கலை நீங்கள் எவ்வாறு கையாண்டீர்கள்?",
                "kn": "ನೀವು caching ಮತ್ತು ಕಾರ್ಯಕ್ಷಮತೆಯನ್ನು ಉಲ್ಲೇಖಿಸಿದ್ದೀರಿ. Cache invalidation ಮತ್ತು cache stampede ಸಮಸ್ಯೆಯನ್ನು ಹೇಗೆ ನಿರ್ವಹಿಸಿದ್ದೀರಿ?"
            },
            "security": {
                "en": "Regarding authentication and security: how did you protect your endpoints against CSRF, SQL injection, and token tampering?",
                "te": "Security మరియు authentication కి సంబంధించి: CSRF, SQL Injection, మరియు Token tampering నుండి మీ endpoints ని ఎలా సురక్షితం చేశారు?",
                "hi": "सुरक्षा और प्रमाणीकरण के संबंध में: आपने CSRF, SQL Injection और टोकन छेड़छाड़ से अपने endpoints को कैसे सुरक्षित किया?",
                "ta": "பாதுகாப்பு மற்றும் அங்கீகாரம் தொடர்பாக: CSRF, SQL Injection மற்றும் token முறைகேடுகளிலிருந்து உங்கள் endpoints ஐ எவ்வாறு பாதுகாத்தீர்கள்?",
                "kn": "ಭದ್ರತೆ ಮತ್ತು ದೃಢೀಕರಣಕ್ಕೆ ಸಂಬಂಧಿಸಿದಂತೆ: CSRF, SQL Injection ಮತ್ತು token ರಕ್ಷಣೆಯನ್ನು ಹೇಗೆ ಖಚಿತಪಡಿಸಿದ್ದೀರಿ?"
            },
            "database": {
                "en": "In your database design, what indexing strategy did you choose, and how did you prevent locking or N+1 query bottlenecks under load?",
                "te": "మీ Database డిజైన్ లో ఏ indexing విధానాన్ని ఎంచుకున్నారు, మరియు load సమయంలో N+1 query లేదా locking సమస్యలను ఎలా నివారించారు?",
                "hi": "अपने डेटाबेस डिज़ाइन में, आपने कौन सी इंडेक्सिंग रणनीति चुनी, और लोड के तहत N+1 query या लॉकिंग बॉटलनेक्स को कैसे रोका?",
                "ta": "உங்கள் Database வடிவமைப்பில், எந்த indexing உத்தியை தேர்வு செய்தீர்கள், மற்றும் N+1 query சிக்கல்களை எவ்வாறு தவிர்த்தீர்கள்?",
                "kn": "ನಿಮ್ಮ ಡೇಟಾಬೇಸ್ ವಿನ್ಯಾಸದಲ್ಲಿ ಯಾವ indexing ತಂತ್ರವನ್ನು ಆರಿಸಿದ್ದೀರಿ, ಮತ್ತು N+1 query ಸಮಸ್ಯೆಗಳನ್ನು ಹೇಗೆ ತಪ್ಪಿಸಿದ್ದೀರಿ?"
            },
            "scaling": {
                "en": "If traffic surges tenfold tomorrow, what component in this design would bottleneck first, and how would you scale it horizontally?",
                "te": "ట్రాఫిక్ పది రెట్లు పెరిగితే, ఈ డిజైన్ లో ఏ component మొదట bottleneck అవుతుంది, మరియు దానిని horizontally ఎలా scale చేస్తారు?",
                "hi": "यदि कल ट्रैफ़िक दस गुना बढ़ जाता है, तो इस डिज़ाइन में कौन सा कॉम्पोनेन्ट पहले बॉटलनेक होगा, और आप इसे क्षैतिज रूप से (horizontally) कैसे स्केल करेंगे?",
                "ta": "ட்ராஃபிக் பத்து மடங்கு அதிகரித்தால், இந்த வடிவமைப்பில் எந்த பகுதி முதலில் bottleneck ஆகும், மற்றும் அதை எவ்வாறு கிடைமட்டமாக scale செய்வீர்கள்?",
                "kn": "ಟ್ರಾಫಿಕ್ ಹತ್ತು ಪಟ್ಟು ಹೆಚ್ಚಾದರೆ, ಈ ವಿನ್ಯಾಸದಲ್ಲಿ ಯಾವ ಭಾಗ ಮೊದಲು bottleneck ಆಗುತ್ತದೆ, ಮತ್ತು ಅದನ್ನು horizontally ಹೇಗೆ scale ಮಾಡುತ್ತೀರಿ?"
            }
        }

        chosen_key = None
        if any(w in ans_lower for w in ["redis", "cache", "latency", "memcached"]):
            chosen_key = "caching"
        elif any(w in ans_lower for w in ["jwt", "auth", "token", "security", "permission", "login"]):
            chosen_key = "security"
        elif any(w in ans_lower for w in ["postgres", "mysql", "sql", "query", "database", "orm", "table"]):
            chosen_key = "database"
        elif any(w in ans_lower for w in ["scale", "concurrency", "traffic", "load", "microservice", "cluster"]):
            chosen_key = "scaling"

        if chosen_key:
            lang_code = language if language in translations[chosen_key] else "en"
            text = translations[chosen_key][lang_code]
            return {
                "category": "Dynamic Follow-up",
                "question_text": text,
                "question_text_en": translations[chosen_key]["en"],
                "audio_caption": text,
                "is_follow_up": True,
                "expected_topics": ["Deep dive into trade-offs", "Edge cases & failure recovery", "Practical implementation details"]
            }
        return None

    # =========================================================================
    # Internal Heuristic Plan Generator (Rooted in Resume)
    # =========================================================================
    @classmethod
    def _generate_plan_heuristic(
        cls,
        job_role: str,
        experience_level: str,
        interview_type: str,
        language: str,
        total_questions: int,
        parsed_resume: Optional[Dict[str, Any]],
        job_description: Optional[str]
    ) -> List[Dict[str, Any]]:
        projects = parsed_resume.get("projects", []) if parsed_resume else []
        skills = parsed_resume.get("skills", {}) if parsed_resume else {}
        
        top_project = projects[0]["title"] if projects else "your recent technical project"
        top_project_tech = ", ".join(projects[0].get("technologies", [])) if projects and projects[0].get("technologies") else "the tech stack"
        second_project = projects[1]["title"] if len(projects) > 1 else None

        lang_skill = skills.get("languages", ["Java", "Python", "JavaScript"])[0] if skills.get("languages") else "your primary programming language"
        framework_skill = skills.get("frameworks", ["React", "Spring Boot", "FastAPI"])[0] if skills.get("frameworks") else "your core framework"
        db_skill = skills.get("databases", ["PostgreSQL", "MySQL", "MongoDB"])[0] if skills.get("databases") else "your database of choice"

        # Templates per category
        multilingual_bank = {
            "proj1": {
                "en": f"In your project '{top_project}' built with {top_project_tech}, can you explain the architectural structure, how data flows through the application, and the most challenging technical hurdle you personally resolved?",
                "te": f"మీరు {top_project_tech} తో రూపొందించిన '{top_project}' ప్రాజెక్ట్ ఆర్కిటెక్చర్ ఎలా నిర్మించారు? Data flow ఎలా జరుగుతుంది మరియు మీరు స్వయంగా ఎదుర్కొన్న అతిపెద్ద సాంకేతిక సవాలు ఏమిటి?",
                "hi": f"आपने {top_project_tech} के साथ '{top_project}' प्रोजेक्ट बनाया है। कृपया इसका architectural structure समझाएं, डेटा फ्लो कैसे होता है और आपने व्यक्तिगत रूप से किस तकनीकी चुनौती का समाधान किया?",
                "ta": f"நீங்கள் {top_project_tech} மூலம் உருவாக்கிய '{top_project}' திட்டத்தின் architectural structure, data flow மற்றும் நீங்கள் தீர்த்த மிக முக்கியமான தொழில்நுட்ப சவாலை விளக்க முடியுமா?",
                "kn": f"{top_project_tech} ಬಳಸಿ ನಿರ್ಮಿಸಿದ ನಿಮ್ಮ '{top_project}' ಪ್ರಾಜೆಕ್ಟ್ ನ architectural structure, data flow ಮತ್ತು ನೀವು ಪರಿಹರಿಸಿದ ಪ್ರಮುಖ ತಾಂತ್ರಿಕ ಸವಾಲನ್ನು ವಿವರಿಸಬಹುದೇ?"
            },
            "tech_core": {
                "en": f"As a candidate for {job_role}, could you explain how memory management, concurrency, and async execution work in {lang_skill}? What pitfalls like deadlocks or memory leaks should an engineer watch out for?",
                "te": f"{job_role} పాత్రకు సంబంధించి, {lang_skill} లో memory management, concurrency మరియు async execution ఎలా పనిచేస్తాయో వివరించగలరా? Deadlocks లేదా memory leaks వంటి సమస్యలను ఎలా నివారిస్తారు?",
                "hi": f"{job_role} के लिए, {lang_skill} में memory management, concurrency और async execution कैसे काम करता है? Deadlocks या memory leaks से बचने के लिए क्या ध्यान रखना चाहिए?",
                "ta": f"{job_role} பதவிக்கு, {lang_skill} இல் memory management, concurrency மற்றும் async execution எவ்வாறு செயல்படுகின்றன? Deadlocks அல்லது memory leaks போன்ற சிக்கல்களை எவ்வாறு கையாளுவீர்கள்?",
                "kn": f"{job_role} ಹುದ್ದೆಗೆ ಸಂಬಂಧಿಸಿದಂತೆ, {lang_skill} ನಲ್ಲಿ memory management, concurrency ಮತ್ತು async execution ಹೇಗೆ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ? Deadlocks ತಪ್ಪಿಸಲು ಏನು ಮಾಡಬೇಕು?"
            },
            "db_opt": {
                "en": f"When scaling applications with {db_skill}, how do you design tables and indexes for high-throughput reads and writes? How would you identify and fix a slow-running query in production?",
                "te": f"{db_skill} తో పనిచేసేటప్పుడు high-throughput reads మరియు writes కోసం tables మరియు indexes ని ఎలా design చేస్తారు? Production లో slow query ని ఎలా గుర్తించి fix చేస్తారు?",
                "hi": f"{db_skill} के साथ उच्च-थ्रूपुट के लिए तालिकाओं और अनुक्रमितों (indexes) को कैसे डिज़ाइन करते हैं? प्रोडक्शन में धीमी क्वेरी की पहचान और सुधार कैसे करेंगे?",
                "ta": f"{db_skill} பயன்பாட்டில் அதிக எண்ணிக்கையிலான reads மற்றும் writes க்கு tables மற்றும் indexes ஐ எவ்வாறு வடிவமைப்பீர்கள்? ஒரு மெதுவான query ஐ எவ்வாறு சரிசெய்வீர்கள்?",
                "kn": f"{db_skill} ಬಳಸಿ ಹೆಚ್ಚಿನ ಸಂಚಾರಕ್ಕಾಗಿ tables ಮತ್ತು indexes ಅನ್ನು ಹೇಗೆ ವಿನ್ಯಾಸಗೊಳಿಸುತ್ತೀರಿ? Production ನಲ್ಲಿ ನಿಧಾನವಾದ query ಯನ್ನು ಹೇಗೆ ಪತ್ತೆಹಚ್ಚಿ ಪರಿಹರಿಸುತ್ತೀರಿ?"
            },
            "problem_solving": {
                "en": f"Design scenario: Imagine we need to build an idempotent REST API for payments or notifications in {framework_skill} that processes 5,000 requests per second. How do you guarantee zero duplicate operations and handle network timeouts?",
                "te": f"డిజైన్ దృశ్యం: {framework_skill} లో సెకనుకు 5,000 requests ప్రాసెస్ చేసే ఒక idempotent API ని నిర్మించాల్సి వస్తే, duplicate operations జరగకుండా మరియు network timeouts ని ఎలా నిర్ధారిస్తారు?",
                "hi": f"डिज़ाइन परिदृश्य: मान लीजिए हमें {framework_skill} में प्रति सेकंड 5,000 अनुरोधों को संसाधित करने वाला एक idempotent API बनाना है। आप शून्य डुप्लिकेट संचालन कैसे सुनिश्चित करेंगे और नेटवर्क टाइमआउट को कैसे संभालेंगे?",
                "ta": f"வடிவமைப்பு காட்சி: {framework_skill} இல் வினாடிக்கு 5,000 கோரிக்கைகளைக் கையாளும் ஒரு idempotent API ஐ உருவாக்கினால், நகல் செயல்பாடுகள் இல்லாமல் மற்றும் network timeouts ஐ எவ்வாறு கையாளுவீர்கள்?",
                "kn": f"ಡಿಸೈನ್ ಸನ್ನಿವೇಶ: {framework_skill} ನಲ್ಲಿ ಪ್ರತಿ ಸೆಕೆಂಡಿಗೆ 5,000 ವಿನಂತಿಗಳನ್ನು ಪ್ರಕ್ರಿಯೆಗೊಳಿಸುವ idempotent API ಅನ್ನು ನಿರ್ಮಿಸಲು, ನಕಲಿ ಕಾರ್ಯಾಚರಣೆಗಳಾಗದಂತೆ ಹೇಗೆ ಖಚಿತಪಡಿಸುತ್ತೀರಿ?"
            },
            "behavioral": {
                "en": "Tell me about a situation where you had a disagreement with a team member or reviewer regarding a technical choice or pull request. How did you communicate, evaluate trade-offs, and reach a consensus?",
                "te": "ఒక technical choice లేదా code review విషయంలో మీ సహోద్యోగితో విభేదం వచ్చిన సందర్భం గురించి చెప్పండి. మీరు ఎలా మాట్లాడారు, trade-offs ని ఎలా అంచనా వేశారు మరియు ఏకాభిప్రాయానికి ఎలా వచ్చారు?",
                "hi": "किसी ऐसी स्थिति के बारे में बताएं जब किसी तकनीकी निर्णय या कोड समीक्षा को लेकर आपका किसी टीम के सदस्य से मतभेद हुआ हो। आपने संवाद कैसे किया और सहमति पर कैसे पहुंचे?",
                "ta": "தொழில்நுட்ப முடிவு அல்லது pull request தொடர்பாக சக ஊழியருடன் கருத்து வேறுபாடு ஏற்பட்ட ஒரு சூழ்நிலையைப் பற்றி கூறுங்கள். அதை எவ்வாறு தீர்த்து ஒருமித்த கருத்தை அடைந்தீர்கள்?",
                "kn": "ತಾಂತ್ರಿಕ ಆಯ್ಕೆ ಅಥವಾ code review ಕುರಿತು ತಂಡದ ಸದಸ್ಯರೊಂದಿಗೆ ಭಿನ್ನಾಭಿಪ್ರಾಯ ಉಂಟಾದ ಸನ್ನಿವೇಶವನ್ನು ಹಂಚಿಕೊಳ್ಳಿ. ನೀವು ಹೇಗೆ ಸಂವಹನ ನಡೆಸಿ ಒಮ್ಮತಕ್ಕೆ ಬಂದಿರಿ?"
            },
            "proj2": {
                "en": f"Looking at your experience with '{second_project or 'testing and deployment'}', what testing strategies (unit, integration, end-to-end) did you adopt, and how did you verify code quality before deploying to production?",
                "te": f"మీరు '{second_project or 'Testing & Deployment'}' లో అనుసరించిన unit, integration మరియు automated testing వ్యూహాల గురించి మరియు production కి deploy చేసే ముందు code quality ని ఎలా ధృవీకరించారో చెప్పండి.",
                "hi": f"'{second_project or 'Testing और Deployment'}' के संदर्भ में, आपने किन टेस्टिंग रणनीतियों (unit, integration) को अपनाया और प्रोडक्शन में जाने से पहले कोड गुणवत्ता को कैसे सत्यापित किया?",
                "ta": f"'{second_project or 'Testing & Deployment'}' இல் நீங்கள் பயன்படுத்திய unit மற்றும் integration testing முறைகள் மற்றும் code quality ஐ எவ்வாறு உறுதிசெய்தீர்கள் என்பதை விளக்குங்கள்.",
                "kn": f"'{second_project or 'Testing & Deployment'}' ನಲ್ಲಿ ನೀವು ಅಳವಡಿಸಿಕೊಂಡ unit ಮತ್ತು integration testing ತಂತ್ರಗಳ ಬಗ್ಗೆ ಮತ್ತು code quality ಅನ್ನು ಹೇಗೆ ಪರಿಶೀಲಿಸಿದಿರಿ ಎಂದು ವಿವರಿಸಿ."
            }
        }

        lang_key = language if language in ["en", "te", "hi", "ta", "kn"] else "en"
        
        sequence = [
            ("Resume & Project Deep Dive", "proj1", ["Component architecture", "Data flow", "Technical obstacles", "State/Lifecycle"]),
            ("Core Programming & Concurrency", "tech_core", ["Memory model", "Thread safety", "Asynchronous execution", "Deadlocks"]),
            ("Database & High Performance", "db_opt", ["Index structures", "Slow query profiling", "ACID guarantees", "N+1 query avoidance"]),
            ("System Design & Idempotency", "problem_solving", ["Idempotency keys", "Distributed locks", "Retry policies", "Graceful degradation"]),
            ("Engineering Collaboration & Behavioral", "behavioral", ["Conflict resolution", "Data-driven debate", "Active listening", "Team alignment"]),
            ("Testing, CI/CD & Production Readiness", "proj2", ["Mocking vs integration tests", "Automated pipelines", "Test coverage", "Rollback strategy"])
        ]

        # Filter by interview type if necessary
        if interview_type == "Technical":
            sequence = [s for s in sequence if s[0] != "Engineering Collaboration & Behavioral"]
        elif interview_type == "Behavioral" or interview_type == "HR":
            sequence = [s for s in sequence if "Behavioral" in s[0] or "Collaboration" in s[0] or "Resume" in s[0]]

        # Adjust to total_questions count
        plan = []
        for i in range(total_questions):
            seq_item = sequence[i % len(sequence)]
            cat, template_key, topics = seq_item
            
            q_text = multilingual_bank[template_key].get(lang_key, multilingual_bank[template_key]["en"])
            q_text_en = multilingual_bank[template_key]["en"]

            plan.append({
                "order_index": i + 1,
                "category": cat,
                "question_text": q_text,
                "question_text_en": q_text_en,
                "audio_caption": q_text,
                "expected_topics": topics
            })

        return plan

    # =========================================================================
    # Internal Heuristic Answer Evaluator (Rigorous & Rubric-driven)
    # =========================================================================
    @classmethod
    def _evaluate_answer_heuristic(
        cls,
        question_text: str,
        candidate_answer: str,
        category: str,
        job_role: str,
        experience_level: str,
        language: str,
        expected_topics: List[str],
        rubric_weights: Dict[str, float]
    ) -> Dict[str, Any]:
        ans = candidate_answer.strip()
        ans_lower = ans.lower()
        word_count = len(ans.split())

        # If answer is practically empty
        if word_count < 4:
            return {
                "score_overall": 15.0,
                "score_technical": 10.0,
                "score_relevance": 20.0,
                "score_depth": 10.0,
                "score_problem_solving": 10.0,
                "score_clarity": 30.0,
                "feedback_justification": "The response was minimal or lacked substantive technical details.",
                "strengths": "Prompt acknowledgment of the question.",
                "missing_concepts": "Detailed architectural rationale, core terminology, and practical code/design solutions.",
                "ideal_answer_summary": "A comprehensive answer should address the architectural components, trade-offs, and concrete failure-handling techniques."
            }

        # Check topic coverage
        matches = 0
        technical_keywords = [
            "component", "state", "redux", "hook", "index", "cache", "redis", "async", "await", "thread",
            "transaction", "acid", "lock", "api", "rest", "idempotent", "token", "jwt", "kafka", "docker",
            "microservice", "query", "orm", "join", "latency", "scale", "retry", "test", "metric", "log",
            "architecture", "database", "security", "exception", "validation", "git", "pipeline"
        ]

        found_keywords = [kw for kw in technical_keywords if kw in ans_lower]
        
        # Scoring logic
        # 1. Technical Correctness (30%)
        tech_score = min(95.0, 50.0 + len(found_keywords) * 7.0 + min(word_count * 0.4, 25.0))
        # 2. Relevance (20%)
        relevance_score = min(95.0, 60.0 + min(word_count * 0.5, 30.0))
        # 3. Depth of Understanding (20%)
        depth_score = min(92.0, 45.0 + (len(found_keywords) * 6.5) + (15.0 if word_count > 45 else 5.0))
        # 4. Problem Solving (20%)
        has_solution_words = any(w in ans_lower for w in ["handle", "solve", "prevent", "implemented", "optimized", "used", "created", "designed"])
        problem_score = min(95.0, (70.0 if has_solution_words else 50.0) + min(word_count * 0.3, 20.0))
        # 5. Clarity of Explanation (10%)
        clarity_score = min(95.0, 70.0 + (15.0 if 30 <= word_count <= 250 else 5.0))

        # Apply Rubric Weights
        w_tech = rubric_weights.get("technical_correctness", 0.30)
        w_rel = rubric_weights.get("relevance", 0.20)
        w_depth = rubric_weights.get("depth_of_understanding", 0.20)
        w_prob = rubric_weights.get("problem_solving", 0.20)
        w_clarity = rubric_weights.get("clarity_of_explanation", 0.10)

        overall = (tech_score * w_tech) + (relevance_score * w_rel) + (depth_score * w_depth) + (problem_score * w_prob) + (clarity_score * w_clarity)
        overall = round(min(98.0, max(20.0, overall)), 1)

        # Formulate feedback
        strengths = []
        if found_keywords:
            strengths.append(f"Demonstrated good awareness of core terms: {', '.join(found_keywords[:4])}.")
        if has_solution_words:
            strengths.append("Articulated a concrete engineering approach to solving the scenario.")
        if not strengths:
            strengths.append("Addressed the general premise of the question.")

        missing = []
        if len(found_keywords) < 3:
            missing.append("Deep architectural trade-offs and edge-case handling.")
        if word_count < 40:
            missing.append("Elaboration on production constraints, latency metrics, and failure recovery.")
        if not missing:
            missing.append("Additional discussion of automated observability and telemetry.")

        justification = (
            f"Candidate provided a {'thorough' if overall >= 80 else 'satisfactory' if overall >= 60 else 'basic'} explanation. "
            f"Demonstrated technical understanding in {', '.join(found_keywords[:3]) if found_keywords else 'general principles'}. "
            f"Explanation was clear and directly targeted to the role of {job_role}."
        )

        ideal = (
            "An exemplary response outlines the architectural structure, evaluates specific trade-offs (e.g. latency vs consistency, memory vs CPU), "
            "and mentions production safeguards like automated retries, rate limiting, and observability."
        )

        return {
            "score_overall": overall,
            "score_technical": round(tech_score, 1),
            "score_relevance": round(relevance_score, 1),
            "score_depth": round(depth_score, 1),
            "score_problem_solving": round(problem_score, 1),
            "score_clarity": round(clarity_score, 1),
            "feedback_justification": justification,
            "strengths": " ".join(strengths),
            "missing_concepts": " ".join(missing),
            "ideal_answer_summary": ideal
        }

    # =========================================================================
    # Gemini API Integrations (When API Key is Present)
    # =========================================================================
    @classmethod
    async def _generate_plan_gemini(
        cls,
        job_role: str,
        experience_level: str,
        interview_type: str,
        language: str,
        total_questions: int,
        parsed_resume: Optional[Dict[str, Any]],
        job_description: Optional[str]
    ) -> Optional[List[Dict[str, Any]]]:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
        
        prompt = f"""You are Berri Bot, an expert AI Technical Interviewer at a premier technology enterprise.
Generate exactly {total_questions} structured interview questions tailored specifically for:
Job Role: {job_role}
Experience Level: {experience_level}
Interview Type: {interview_type}
Target Language: {settings.SUPPORTED_LANGUAGES.get(language, 'English')} (Language code: {language})

Candidate Resume Details:
{json.dumps(parsed_resume, indent=2) if parsed_resume else 'No resume provided; generate standard industry questions.'}

Job Description:
{job_description or 'Standard industry benchmark'}

CRITICAL RULES:
1. Root the questions in the candidate's actual projects, frameworks, and listed tools. NEVER invent projects or qualifications.
2. If language is 'te' (Telugu), 'hi' (Hindi), 'ta' (Tamil), or 'kn' (Kannada), write the question_text naturally in that script, but keep technical terms (e.g. React, Spring Boot, REST API, indexing) in standard technical form so it sounds professional and natural.
3. Provide question_text_en with the English translation.
4. Output valid JSON array with objects containing:
   - "order_index": int (1 to {total_questions})
   - "category": str (e.g. "Resume Project Deep Dive", "Technical Architecture", "System Design", "Behavioral")
   - "question_text": str (in target language)
   - "question_text_en": str (in English)
   - "audio_caption": str (same as question_text)
   - "expected_topics": list of str
Return ONLY raw JSON, no markdown fences.
"""
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, json={"contents": [{"parts": [{"text": prompt}]}]})
            if resp.status_code == 200:
                data = resp.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                text = re.sub(r'^```json\s*', '', text)
                text = re.sub(r'\s*```$', '', text)
                plan = json.loads(text)
                return plan
        return None

    @classmethod
    async def _evaluate_answer_gemini(
        cls,
        question_text: str,
        candidate_answer: str,
        category: str,
        job_role: str,
        experience_level: str,
        language: str,
        expected_topics: List[str],
        rubric_weights: Dict[str, float]
    ) -> Optional[Dict[str, Any]]:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
        
        prompt = f"""You are Berri Bot's rigorous AI Answer Evaluation Engine.
Evaluate the candidate's answer based on the following rubric:
Question: {question_text}
Candidate's Answer: {candidate_answer}
Job Role: {job_role}
Level: {experience_level}
Category: {category}
Expected Key Topics: {json.dumps(expected_topics)}
Rubric Weights: {json.dumps(rubric_weights)}

CRITICAL EVALUATION GUIDELINES:
- Assess technical correctness, relevance, depth, problem solving, and clarity on a 0-100 scale.
- Calculate overall weighted score using the provided rubric weights.
- Evaluate the meaning and semantic correctness; DO NOT penalize accents, language dialect, or minor grammatical imperfections.
- Distinguish between factual inaccuracies versus merely incomplete answers.
- Return ONLY a JSON object with:
  "score_overall": float,
  "score_technical": float,
  "score_relevance": float,
  "score_depth": float,
  "score_problem_solving": float,
  "score_clarity": float,
  "feedback_justification": str,
  "strengths": str,
  "missing_concepts": str,
  "ideal_answer_summary": str
No markdown fences.
"""
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, json={"contents": [{"parts": [{"text": prompt}]}]})
            if resp.status_code == 200:
                data = resp.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                text = re.sub(r'^```json\s*', '', text)
                text = re.sub(r'\s*```$', '', text)
                return json.loads(text)
        return None

    @classmethod
    def generate_final_recommendation(
        cls,
        overall_score: float,
        scores_by_cat: Dict[str, float],
        job_role: str,
        experience_level: str,
        questions: List[Any]
    ) -> Dict[str, Any]:
        """
        Synthesizes the overall interview performance into a fair, evidence-based recommendation:
        - Strong Match (>= 80%)
        - Potential Match (65% - 79.9%)
        - Further Assessment Recommended (50% - 64.9%)
        - Does Not Yet Meet the Defined Criteria (< 50%)
        """
        if overall_score >= 80.0:
            rec = "Strong Match"
            justification = (
                f"Candidate demonstrated comprehensive mastery for the {job_role} ({experience_level}) profile, achieving an aggregate score of {overall_score}%. "
                "Responses showed high technical precision, sound architectural problem-solving, and clear articulation of design trade-offs."
            )
        elif overall_score >= 65.0:
            rec = "Potential Match"
            justification = (
                f"Candidate exhibited solid foundational knowledge in core areas for {job_role} with an overall score of {overall_score}%. "
                "Demonstrated strong practical experience on resume projects; would benefit from deeper exploration of distributed edge cases and high-scale concurrency."
            )
        elif overall_score >= 50.0:
            rec = "Further Assessment Recommended"
            justification = (
                f"Candidate achieved {overall_score}%. While showing promising basic concepts, answers lacked sufficient depth in systems architecture, "
                "production failure handling, or specialized role requirements. A targeted follow-up technical assessment is advised."
            )
        else:
            rec = "Does Not Yet Meet the Defined Criteria"
            justification = (
                f"Candidate attained an aggregate score of {overall_score}%, falling short of the standard benchmark for {job_role} ({experience_level}). "
                "Significant knowledge gaps were identified in core programming principles and scenario problem solving."
            )

        # Generate strengths & gaps summaries
        strengths_list = []
        gaps_list = []
        for q in questions:
            if hasattr(q, "score_overall") and q.score_overall >= 75.0:
                strengths_list.append(f"Q{q.order_index} ({q.category}): Scored {q.score_overall}%")
            elif hasattr(q, "score_overall") and q.score_overall < 60.0:
                gaps_list.append(f"Q{q.order_index} ({q.category}): Scored {q.score_overall}% - {q.missing_concepts or 'Needs deeper explanation'}")

        strengths_summary = "Key Strengths: " + ("; ".join(strengths_list) if strengths_list else "Basic conceptual awareness across all sections.")
        gaps_summary = "Areas for Improvement: " + ("; ".join(gaps_list) if gaps_list else "Continuous refinement in large-scale system patterns.")

        # Tailored learning roadmap
        learning_recs = [
            {
                "topic": f"Advanced {job_role} Systems Architecture",
                "description": "Deep dive into microservices communication patterns, idempotency, and distributed transaction management.",
                "resources": ["Designing Data-Intensive Applications (Martin Kleppmann)", "System Design Primer (GitHub)"],
                "priority": "High"
            },
            {
                "topic": "Concurrency, Memory, and Async Runtimes",
                "description": "Master non-blocking I/O, event loops, thread pooling, and prevention of race conditions.",
                "resources": ["Official Language Documentation & Concurrency Guides", "High Performance Browser Networking"],
                "priority": "Medium"
            },
            {
                "topic": "Observability & Production Reliability",
                "description": "Learn to monitor metrics, traces, and logs using OpenTelemetry, Prometheus, and Grafana.",
                "resources": ["Google Site Reliability Engineering (SRE) Handbook"],
                "priority": "Medium"
            }
        ]

        return {
            "recommendation": rec,
            "recommendation_justification": justification,
            "strengths_summary": strengths_summary,
            "knowledge_gaps_summary": gaps_summary,
            "learning_recommendations": learning_recs
        }
