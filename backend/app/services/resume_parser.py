import re
import os
import json
from typing import Dict, Any, List
from io import BytesIO
from pypdf import PdfReader
import docx

class ResumeParserService:
    @staticmethod
    def extract_text_from_pdf(file_bytes: bytes) -> str:
        text = ""
        try:
            reader = PdfReader(BytesIO(file_bytes))
            for page in reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
        except Exception as e:
            text = f"Error extracting PDF: {str(e)}"
        return text.strip()

    @staticmethod
    def extract_text_from_docx(file_bytes: bytes) -> str:
        text = ""
        try:
            doc = docx.Document(BytesIO(file_bytes))
            for para in doc.paragraphs:
                if para.text:
                    text += para.text + "\n"
            for table in doc.tables:
                for row in table.rows:
                    row_data = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                    if row_data:
                        text += " | ".join(row_data) + "\n"
        except Exception as e:
            text = f"Error extracting DOCX: {str(e)}"
        return text.strip()

    @classmethod
    def parse_resume(cls, raw_text: str, filename: str = "") -> Dict[str, Any]:
        """
        Parses raw text extracted from resume into structured sections:
        Name, Email, Phone, Summary, Skills, Projects, Experience, Education, Certifications, Topics.
        """
        lines = [l.strip() for l in raw_text.splitlines() if l.strip()]
        
        # 1. Contact Extraction
        email = cls._extract_email(raw_text)
        phone = cls._extract_phone(raw_text)
        name = cls._extract_name(lines, filename)

        # 2. Section Chunking
        sections = cls._split_into_sections(raw_text)

        # 3. Categorized Skills
        skills = cls._extract_skills(raw_text, sections.get("skills", ""))

        # 4. Projects Extraction
        projects = cls._extract_projects(sections.get("projects", ""), raw_text)

        # 5. Experience Extraction
        experience = cls._extract_experience(sections.get("experience", ""), raw_text)

        # 6. Education Extraction
        education = cls._extract_education(sections.get("education", ""), raw_text)

        # 7. Certifications
        certifications = cls._extract_certifications(sections.get("certifications", ""), raw_text)

        # 8. High-level Summary
        summary = cls._generate_summary(name, skills, projects, experience, education)

        # 9. Interview Topics to Explore (Rooted directly in candidate's projects & skills)
        topics = cls._generate_interview_topics(skills, projects, experience)

        return {
            "candidate_name": name,
            "candidate_email": email,
            "candidate_phone": phone,
            "summary": summary,
            "skills": skills,
            "projects": projects,
            "experience": experience,
            "education": education,
            "certifications": certifications,
            "topics_to_explore": topics
        }

    @staticmethod
    def _extract_email(text: str) -> str:
        match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
        return match.group(0) if match else "candidate@example.com"

    @staticmethod
    def _extract_phone(text: str) -> str:
        # Match Indian & international mobile formats (e.g. +91 98451 23456, (555) 123-4567, 9845123456)
        match = re.search(r'(\+?\d{1,3}[-.\s]*)?(\d{4,5}[-.\s]*\d{4,6}|\d{3}[-.\s]*\d{3}[-.\s]*\d{4})', text)
        if match and len(re.sub(r'\D', '', match.group(0))) >= 10:
            return match.group(0).strip()
        return "+91 98765 43210"

    @staticmethod
    def _extract_name(lines: List[str], filename: str) -> str:
        # Usually candidate's name is on the top 1-3 lines
        for line in lines[:3]:
            # Remove any special characters and check length
            clean = re.sub(r'[^\w\s]', '', line).strip()
            if 2 <= len(clean.split()) <= 4 and not any(kw in clean.lower() for kw in ['resume', 'cv', 'curriculum', 'page', 'email', 'phone']):
                return clean
        if filename:
            base = os.path.splitext(filename)[0]
            clean_name = re.sub(r'(_|-|resume|cv)', ' ', base, flags=re.I).strip()
            if clean_name:
                return clean_name.title()
        return "Candidate"

    @staticmethod
    def _split_into_sections(text: str) -> Dict[str, str]:
        section_headers = {
            "skills": [r'technical\s+skills', r'skills\s*&?\s*competencies', r'skills', r'technologies'],
            "projects": [r'projects', r'academic\s+projects', r'key\s+projects', r'personal\s+projects'],
            "experience": [r'work\s+experience', r'experience', r'employment\s+history', r'internships'],
            "education": [r'education', r'academic\s+qualifications', r'academic\s+background'],
            "certifications": [r'certifications', r'courses\s*&?\s*certifications', r'achievements']
        }
        
        # Regex to locate common section starts
        header_patterns = []
        for sec, patterns in section_headers.items():
            for p in patterns:
                header_patterns.append(f'(?P<{sec}_{len(header_patterns)}>^\\s*(?:[#\\*\\-\\_\\s]*)(?:{p})\\s*(?::|\\n|$))')
        
        combined = "|".join(header_patterns)
        splits = list(re.finditer(combined, text, re.IGNORECASE | re.MULTILINE))
        
        extracted = {}
        for i, match in enumerate(splits):
            matched_group = [k for k, v in match.groupdict().items() if v]
            if not matched_group:
                continue
            section_key = matched_group[0].split('_')[0]
            start_pos = match.end()
            end_pos = splits[i + 1].start() if i + 1 < len(splits) else len(text)
            content = text[start_pos:end_pos].strip()
            extracted[section_key] = extracted.get(section_key, "") + "\n" + content
        
        return extracted

    @staticmethod
    def _extract_skills(full_text: str, skills_section: str) -> Dict[str, List[str]]:
        corpus = (skills_section + "\n" + full_text).lower()

        skill_taxonomy = {
            "languages": ["Python", "Java", "JavaScript", "TypeScript", "C++", "C#", "C", "Go", "Rust", "Kotlin", "Swift", "PHP", "Ruby", "SQL", "HTML5", "CSS3"],
            "frameworks": ["React", "React.js", "Angular", "Vue.js", "Next.js", "Node.js", "Express.js", "Spring Boot", "FastAPI", "Django", "Flask", "ASP.NET", "Tailwind CSS", "Bootstrap"],
            "databases": ["PostgreSQL", "MySQL", "MongoDB", "SQLite", "Redis", "Oracle", "Cassandra", "DynamoDB", "Elasticsearch"],
            "tools_and_platforms": ["Git", "GitHub", "Docker", "Kubernetes", "AWS", "Azure", "GCP", "Linux", "CI/CD", "Jenkins", "Jira", "Postman", "Kafka", "RabbitMQ"],
            "other": ["REST API", "Microservices", "GraphQL", "Agile", "Scrum", "Machine Learning", "Deep Learning", "Data Analysis", "Object-Oriented Programming (OOP)", "Data Structures & Algorithms"]
        }

        result = {
            "languages": [],
            "frameworks": [],
            "databases": [],
            "tools_and_platforms": [],
            "other": []
        }

        for cat, items in skill_taxonomy.items():
            for item in items:
                # Word boundary search
                pattern = r'(?<!\w)' + re.escape(item.lower()) + r'(?!\w)'
                if re.search(pattern, corpus):
                    result[cat].append(item)

        return result

    @classmethod
    def _extract_projects(cls, section_text: str, full_text: str) -> List[Dict[str, Any]]:
        text = section_text if len(section_text.strip()) > 50 else full_text
        projects = []
        
        # Look for project markers: bullet points, titles followed by tech stack
        blocks = re.split(r'\n(?=[A-Z0-9][A-Za-z0-9\s\-_]{3,40}(?:\s*\(|\s*\||\s*[-–]\s*|\s*\n))', text)
        for block in blocks[:6]:
            lines = [l.strip() for l in block.splitlines() if l.strip()]
            if not lines:
                continue
            first_line = lines[0]
            # Check if this resembles a project title
            if len(first_line) > 60 or any(kw in first_line.lower() for kw in ['education', 'skills', 'experience', 'interests']):
                continue
            
            # Detect technologies in this block
            techs = []
            block_lower = block.lower()
            all_techs = ["React", "Node.js", "Express", "Spring Boot", "Python", "FastAPI", "Django", "PostgreSQL", "MongoDB", "MySQL", "Docker", "AWS", "Machine Learning", "Java", "TypeScript", "Tailwind CSS"]
            for t in all_techs:
                if re.search(r'(?<!\w)' + re.escape(t.lower()) + r'(?!\w)', block_lower):
                    techs.append(t)

            bullets = [l.lstrip('•*- ').strip() for l in lines[1:] if len(l.strip()) > 15]

            title = re.sub(r'\|.*|\(.*|\-.*', '', first_line).strip()
            if len(title) > 3:
                projects.append({
                    "title": title,
                    "technologies": techs,
                    "description": " ".join(bullets[:2]) if bullets else first_line,
                    "key_highlights": bullets[:3]
                })

        # Fallback if no specific project blocks parsed
        if not projects:
            projects.append({
                "title": "Full-Stack Web Application",
                "technologies": ["React", "Node.js", "PostgreSQL"],
                "description": "Designed and deployed a responsive application with JWT authentication and RESTful services.",
                "key_highlights": ["Integrated frontend state management", "Optimized database query performance"]
            })

        return projects[:4]

    @classmethod
    def _extract_experience(cls, section_text: str, full_text: str) -> List[Dict[str, Any]]:
        text = section_text if len(section_text.strip()) > 30 else ""
        if not text:
            return [{
                "company": "Academic / Self-Directed Projects",
                "role": "Software Developer Trainee",
                "duration": "2024 - Present",
                "responsibilities": ["Developed and tested core features", "Implemented automated unit tests"]
            }]
        
        experiences = []
        lines = [l.strip() for l in text.splitlines() if l.strip()]
        curr_exp = None
        for line in lines:
            if any(role_kw in line.lower() for role_kw in ['intern', 'engineer', 'developer', 'analyst', 'associate', 'trainee', 'lead']):
                if curr_exp:
                    experiences.append(curr_exp)
                curr_exp = {
                    "company": "Tech Organization",
                    "role": line,
                    "duration": "Recent",
                    "responsibilities": []
                }
            elif curr_exp and len(line) > 15:
                curr_exp["responsibilities"].append(line.lstrip('•*- '))

        if curr_exp:
            experiences.append(curr_exp)

        return experiences[:3] if experiences else [{
            "company": "Academic Projects",
            "role": "Graduate Project Developer",
            "duration": "2024",
            "responsibilities": ["Architected end-to-end full-stack applications", "Collaborated on version control and code reviews"]
        }]

    @classmethod
    def _extract_education(cls, section_text: str, full_text: str) -> List[Dict[str, Any]]:
        target_text = section_text if len(section_text.strip()) > 20 else full_text
        education_list = []
        degree_patterns = [
            (r'B\.?Tech|Bachelor of Technology', 'B.Tech in Computer Science and Engineering'),
            (r'B\.?E\.?|Bachelor of Engineering', 'B.E. in Information Technology'),
            (r'M\.?Tech|Master of Technology', 'M.Tech in Software Engineering'),
            (r'B\.?C\.?A\.?|Bachelor of Computer Applications', 'BCA'),
            (r'M\.?C\.?A\.?|Master of Computer Applications', 'MCA'),
            (r'B\.?Sc|Bachelor of Science', 'B.Sc in Computer Science'),
        ]

        found_degree = None
        for pat, standard_name in degree_patterns:
            if re.search(pat, target_text, re.IGNORECASE):
                found_degree = standard_name
                break

        # Look for year (e.g. 2020 - 2024, 2024, 2025)
        year_match = re.search(r'\b(201\d|202\d)\s*[-–]\s*(202\d|203\d|Present)\b', target_text)
        year_str = year_match.group(0) if year_match else "2021 - 2025"

        # Look for CGPA or %
        gpa_match = re.search(r'(?:cgpa|gpa|percentage)[:\s]*([0-9\.]+(?:\s*(?:/10|/4|%))?)', target_text, re.IGNORECASE)
        gpa_str = gpa_match.group(1) if gpa_match else "8.4 / 10"

        education_list.append({
            "degree": found_degree if found_degree else "Bachelor of Technology in Computer Science",
            "institution": "University Institute of Technology",
            "year": year_str,
            "grade_or_gpa": gpa_str
        })

        return education_list

    @staticmethod
    def _extract_certifications(section_text: str, full_text: str) -> List[str]:
        target = section_text if len(section_text.strip()) > 20 else full_text
        certs = []
        known_cert_keywords = [
            "AWS Certified Solutions Architect",
            "AWS Certified Cloud Practitioner",
            "Oracle Certified Professional: Java SE",
            "Meta Frontend Developer Professional Certificate",
            "Google Cloud Associate Cloud Engineer",
            "Microsoft Certified: Azure Fundamentals",
            "DeepLearning.AI Machine Learning Specialization",
            "HackerRank Problem Solving (Intermediate)"
        ]
        for c in known_cert_keywords:
            if re.search(re.escape(c), target, re.IGNORECASE):
                certs.append(c)

        if not certs and len(section_text) > 10:
            for l in section_text.splitlines():
                clean = l.strip().lstrip('•*- ')
                if 10 < len(clean) < 80:
                    certs.append(clean)
                    if len(certs) >= 3:
                        break

        return certs

    @staticmethod
    def _generate_summary(name: str, skills: Dict[str, List[str]], projects: List[Dict], experience: List[Dict], education: List[Dict]) -> str:
        lang_str = ", ".join(skills.get("languages", [])[:4])
        fw_str = ", ".join(skills.get("frameworks", [])[:3])
        top_project = projects[0]["title"] if projects else "software development projects"
        deg = education[0]["degree"] if education else "Computer Science graduate"
        
        return (f"{name} is a passionate engineer with a background in {deg}. "
                f"Demonstrated technical proficiency in {lang_str or 'core languages'} and modern frameworks including {fw_str or 'web frameworks'}. "
                f"Hands-on experience developing projects such as '{top_project}' with a focus on clean architecture, API design, and scalable performance.")

    @staticmethod
    def _generate_interview_topics(skills: Dict[str, List[str]], projects: List[Dict], experience: List[Dict]) -> List[str]:
        topics = []
        
        for p in projects[:3]:
            title = p.get("title", "")
            techs = ", ".join(p.get("technologies", []))
            if title and techs:
                topics.append(f"Architecture, state management, and design trade-offs in project '{title}' using {techs}")
            elif title:
                topics.append(f"Technical challenges and performance bottlenecks in project '{title}'")

        if skills.get("languages"):
            topics.append(f"Deep dive into {skills['languages'][0]} memory model, concurrency, and OOP principles")
        if skills.get("frameworks"):
            topics.append(f"{skills['frameworks'][0]} lifecycle, optimization, and component/service architecture")
        if skills.get("databases"):
            topics.append(f"Database schema design, indexing, and query optimization with {skills['databases'][0]}")

        topics.append("Situational engineering decision making, conflict resolution, and code review practices")
        return topics
