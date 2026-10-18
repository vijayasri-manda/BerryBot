SAMPLE_RESUMES = {
    "fullstack": {
        "candidate_name": "Priya Sharma",
        "candidate_email": "priya.sharma@example.com",
        "candidate_phone": "+91 98451 23456",
        "summary": "Full Stack Developer with 2+ years of experience designing scalable web applications. Proficient in React, TypeScript, Node.js, and PostgreSQL. Experienced in micro-frontends, REST/GraphQL APIs, and Docker containerization.",
        "skills": {
            "languages": ["JavaScript", "TypeScript", "Python", "SQL", "HTML5", "CSS3"],
            "frameworks": ["React", "Next.js", "Node.js", "Express.js", "Tailwind CSS"],
            "databases": ["PostgreSQL", "MongoDB", "Redis"],
            "tools_and_platforms": ["Git", "Docker", "AWS (S3, EC2)", "Jest", "Postman", "CI/CD"],
            "other": ["REST API", "GraphQL", "Agile/Scrum", "Microservices Architecture"]
        },
        "projects": [
            {
                "title": "HealthSync: Telemedicine Appointment Portal",
                "technologies": ["React", "TypeScript", "Node.js", "PostgreSQL", "Socket.io"],
                "description": "Architected a real-time doctor-patient consultation platform serving 5,000+ monthly active users with end-to-end appointment scheduling.",
                "key_highlights": [
                    "Implemented real-time queue management with WebSockets and Redis pub/sub",
                    "Designed normalized PostgreSQL schemas with composite indexes reducing query latency by 45%",
                    "Built role-based access control (RBAC) with JWT authentication and refresh token rotation"
                ]
            },
            {
                "title": "ShopSmart: High-Throughput E-Commerce Platform",
                "technologies": ["React", "Redux Toolkit", "FastAPI", "Stripe API", "Docker"],
                "description": "Engineered an e-commerce platform with dynamic inventory tracking, server-side caching, and secure payment processing.",
                "key_highlights": [
                    "Optimized React bundle size by 35% through dynamic code-splitting and memoization",
                    "Containerized microservices using Docker Compose for staging and production parity"
                ]
            }
        ],
        "experience": [
            {
                "company": "Nexus Technologies Pvt Ltd",
                "role": "Associate Software Engineer",
                "duration": "Jul 2023 - Present",
                "responsibilities": [
                    "Developed and maintained React customer portal components with 95% test coverage",
                    "Collaborated with backend engineers to design idempotent RESTful APIs",
                    "Participated in bi-weekly sprint planning and code reviews"
                ]
            }
        ],
        "education": [
            {
                "degree": "Bachelor of Technology in Computer Science & Engineering",
                "institution": "JNTU College of Engineering, Hyderabad",
                "year": "2019 - 2023",
                "grade_or_gpa": "8.7 / 10 CGPA"
            }
        ],
        "certifications": [
            "AWS Certified Cloud Practitioner",
            "Meta Frontend Developer Professional Certificate"
        ],
        "topics_to_explore": [
            "React Virtual DOM reconciliation, memoization, and custom hooks architecture in HealthSync",
            "State synchronization and latency handling with Socket.io and Redis in doctor-patient consultations",
            "PostgreSQL index strategies, transaction isolation levels, and N+1 query prevention",
            "Handling API rate limiting, idempotent payment processing, and Stripe webhooks",
            "Behavioral: Handling production deployment incidents and managing conflicting team priorities"
        ]
    },
    "aiml": {
        "candidate_name": "Rahul Varma",
        "candidate_email": "rahul.varma@example.com",
        "candidate_phone": "+91 99123 45678",
        "summary": "AI/ML Engineer specializing in Computer Vision, Natural Language Processing, and production ML pipelines. Proficient in Python, PyTorch, Hugging Face, FastAPI, and MLflow.",
        "skills": {
            "languages": ["Python", "C++", "SQL", "R"],
            "frameworks": ["PyTorch", "TensorFlow", "FastAPI", "Scikit-Learn", "Hugging Face Transformers"],
            "databases": ["PostgreSQL", "Milvus (Vector DB)", "Redis"],
            "tools_and_platforms": ["Docker", "Kubernetes", "MLflow", "Git", "Weights & Biases", "AWS SageMaker"],
            "other": ["Deep Learning", "Transfer Learning", "Model Quantization (ONNX)", "REST APIs"]
        },
        "projects": [
            {
                "title": "MediScan: Automated Chest X-Ray Diagnostic Classifier",
                "technologies": ["Python", "PyTorch", "TorchVision", "FastAPI", "Docker"],
                "description": "Trained and deployed a DenseNet-121 model to detect pneumonia and cardiomegaly from 100k+ radiological images with 94.2% ROC-AUC.",
                "key_highlights": [
                    "Mitigated severe class imbalance using focal loss and dynamic data augmentation",
                    "Exported model to ONNX runtime, achieving 3x inference acceleration on CPU endpoints",
                    "Packaged FastAPI service in a lightweight Docker container deployed on AWS ECS"
                ]
            },
            {
                "title": "LegalDoc-Summarizer: Multilingual Document Insight Engine",
                "technologies": ["Hugging Face", "LangChain", "Milvus", "Python"],
                "description": "Built a Retrieval-Augmented Generation (RAG) system for Indian legal contracts across English and Hindi.",
                "key_highlights": [
                    "Segmented multi-page legal contracts into semantic chunks with overlapping token windows",
                    "Integrated Milvus vector search with hybrid BM25 re-ranking for accurate clause retrieval"
                ]
            }
        ],
        "experience": [
            {
                "company": "Cognitive AI Labs",
                "role": "Machine Learning Engineer Intern",
                "duration": "Jan 2024 - Jun 2024",
                "responsibilities": [
                    "Benchmarked transformer backbones for domain-specific sentiment analysis",
                    "Automated data preprocessing pipelines using Python and Celery workers"
                ]
            }
        ],
        "education": [
            {
                "degree": "Bachelor of Technology in Data Science & Artificial Intelligence",
                "institution": "Vellore Institute of Technology (VIT)",
                "year": "2020 - 2024",
                "grade_or_gpa": "9.1 / 10 CGPA"
            }
        ],
        "certifications": [
            "DeepLearning.AI Deep Learning Specialization",
            "TensorFlow Developer Certificate"
        ],
        "topics_to_explore": [
            "Loss function selection and handling class imbalance with Focal Loss in MediScan",
            "Model quantization, ONNX execution providers, and latency trade-offs during live inference",
            "Vector embeddings, chunking strategies, and hallucination mitigation in LegalDoc-Summarizer RAG",
            "Evaluation metrics for multi-class medical classification: Precision vs Recall vs F1-score",
            "Behavioral: Communicating model limitations and confidence scores to non-technical stakeholders"
        ]
    },
    "javadeveloper": {
        "candidate_name": "Ananya Reddy",
        "candidate_email": "ananya.reddy@example.com",
        "candidate_phone": "+91 97000 11223",
        "summary": "Backend Java Developer with strong grounding in Object-Oriented Design, Spring Boot microservices, multithreading, and distributed transactional systems. Passionate about high reliability and clean code.",
        "skills": {
            "languages": ["Java", "SQL", "Python", "C++"],
            "frameworks": ["Spring Boot", "Spring Data JPA", "Spring Security", "Hibernate", "JUnit 5"],
            "databases": ["MySQL", "PostgreSQL", "Redis"],
            "tools_and_platforms": ["Git", "Maven", "Docker", "Apache Kafka", "Postman", "Linux"],
            "other": ["Microservices", "Design Patterns", "Multithreading & Concurrency", "Event-Driven Architecture"]
        },
        "projects": [
            {
                "title": "SwiftPay: Distributed Payment Settlement Engine",
                "technologies": ["Java 17", "Spring Boot", "Apache Kafka", "MySQL", "Redis"],
                "description": "Engineered a resilient event-driven payment ledger processing 2,000 transactions/second with two-phase commit simulation.",
                "key_highlights": [
                    "Leveraged Apache Kafka partitioned topics to guarantee strictly ordered wallet balance updates",
                    "Prevented double-spend race conditions using Redis distributed locks (Redlock algorithm)",
                    "Wrote automated integration test suites with Testcontainers and JUnit 5"
                ]
            },
            {
                "title": "Hospital Bed & Asset Tracking System",
                "technologies": ["Spring Boot", "Hibernate", "MySQL", "Thymeleaf", "JWT"],
                "description": "Developed an enterprise resource management service for multi-wing healthcare facilities.",
                "key_highlights": [
                    "Configured Spring Security with fine-grained role authorization for doctors, nurses, and admins",
                    "Eliminated Hibernate N+1 query overhead by implementing custom JPQL join fetches"
                ]
            }
        ],
        "experience": [
            {
                "company": "Infosys Ltd",
                "role": "Systems Engineer / Java Backend Trainee",
                "duration": "Oct 2023 - Present",
                "responsibilities": [
                    "Maintained backend Spring Boot microservices and REST endpoints for retail banking client",
                    "Resolved high-priority production defects and optimized slow database batch jobs"
                ]
            }
        ],
        "education": [
            {
                "degree": "Bachelor of Technology in Information Technology",
                "institution": "Osmania University, Hyderabad",
                "year": "2019 - 2023",
                "grade_or_gpa": "8.5 / 10 CGPA"
            }
        ],
        "certifications": [
            "Oracle Certified Professional: Java SE 11 Developer",
            "HackerRank Java (Gold Badge)"
        ],
        "topics_to_explore": [
            "Concurrency control, Synchronized vs ReentrantLock, and ThreadPoolExecutor configuration in Java",
            "Distributed transactions, Kafka consumer group offsets, and idempotent message handling in SwiftPay",
            "Spring Bean lifecycle, Dependency Injection, and circular dependency resolution",
            "Database transaction isolation levels (Read Committed vs Repeatable Read) and pessimistic locking",
            "Behavioral: Handling high-pressure production bugs and root-cause analysis"
        ]
    }
}
