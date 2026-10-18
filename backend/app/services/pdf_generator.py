import io
import json
from datetime import datetime
from typing import Dict, Any, List
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether, HRFlowable
)

class PDFReportGenerator:
    @classmethod
    def generate_interview_pdf(cls, report_data: Dict[str, Any]) -> bytes:
        """
        Generates a comprehensive, professional PDF report of the interview evaluation.
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        
        # Custom Typography Styles
        title_style = ParagraphStyle(
            'ReportTitle',
            parent=styles['Heading1'],
            fontSize=22,
            leading=26,
            textColor=colors.HexColor('#1E293B'),
            fontName='Helvetica-Bold'
        )
        subtitle_style = ParagraphStyle(
            'ReportSubtitle',
            parent=styles['Normal'],
            fontSize=11,
            leading=14,
            textColor=colors.HexColor('#64748B')
        )
        section_heading = ParagraphStyle(
            'SectionHeading',
            parent=styles['Heading2'],
            fontSize=14,
            leading=18,
            textColor=colors.HexColor('#0F172A'),
            fontName='Helvetica-Bold',
            spaceBefore=14,
            spaceAfter=6
        )
        body_style = ParagraphStyle(
            'Body',
            parent=styles['Normal'],
            fontSize=9.5,
            leading=13,
            textColor=colors.HexColor('#334155')
        )
        bold_label = ParagraphStyle(
            'BoldLabel',
            parent=styles['Normal'],
            fontSize=9.5,
            leading=13,
            textColor=colors.HexColor('#0F172A'),
            fontName='Helvetica-Bold'
        )

        elements = []

        # 1. Header with Branding
        elements.append(Paragraph("BERRI BOT – AI INTERVIEW ASSESSMENT REPORT", title_style))
        elements.append(Paragraph(
            f"Generated on {datetime.utcnow().strftime('%B %d, %Y at %H:%M UTC')} | Confidential Candidate Evaluation",
            subtitle_style
        ))
        elements.append(Spacer(1, 10))
        elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#3B82F6'), spaceAfter=14))

        # 2. Candidate & Session Details Grid
        cand_name = report_data.get("candidate_name", "Candidate")
        cand_email = report_data.get("candidate_email", "N/A")
        job_role = report_data.get("job_role", "Software Engineer")
        level = report_data.get("experience_level", "Fresher")
        itype = report_data.get("interview_type", "Technical")
        lang = report_data.get("language", "English")
        overall = report_data.get("overall_score", 0.0)
        rec = report_data.get("recommendation", "Evaluation in Progress")

        # Color-coded badge color
        badge_color = colors.HexColor('#10B981') if overall >= 80 else colors.HexColor('#3B82F6') if overall >= 65 else colors.HexColor('#F59E0B') if overall >= 50 else colors.HexColor('#EF4444')

        details_data = [
            [
                Paragraph("<b>Candidate Name:</b>", body_style), Paragraph(cand_name, body_style),
                Paragraph("<b>Target Job Role:</b>", body_style), Paragraph(job_role, body_style)
            ],
            [
                Paragraph("<b>Email:</b>", body_style), Paragraph(cand_email, body_style),
                Paragraph("<b>Experience Level:</b>", body_style), Paragraph(level, body_style)
            ],
            [
                Paragraph("<b>Interview Type:</b>", body_style), Paragraph(itype, body_style),
                Paragraph("<b>Interview Language:</b>", body_style), Paragraph(lang.upper(), body_style)
            ],
            [
                Paragraph("<b>Overall Score:</b>", body_style),
                Paragraph(f"<b><font size=12 color='#1E40AF'>{overall}%</font></b>", body_style),
                Paragraph("<b>Final Recommendation:</b>", body_style),
                Paragraph(f"<b><font color='{badge_color.hexval()}'>{rec}</font></b>", body_style)
            ]
        ]

        details_table = Table(details_data, colWidths=[110, 160, 110, 160])
        details_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#E2E8F0')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ]))
        elements.append(details_table)
        elements.append(Spacer(1, 14))

        # 3. Transparent Recommendation Justification
        elements.append(Paragraph("Recommendation Rationale & Audit Evidence", section_heading))
        justification_text = report_data.get("recommendation_justification", "Performance evaluated via standard rubric.")
        elements.append(Paragraph(justification_text, body_style))
        elements.append(Spacer(1, 10))

        # 4. Score Breakdown by Rubric Competency
        elements.append(Paragraph("Core Competency Breakdown (Configurable Rubric)", section_heading))
        tech = report_data.get("technical_score", 0.0)
        rel = report_data.get("relevance_score", 0.0)
        depth = report_data.get("depth_score", 0.0)
        prob = report_data.get("problem_solving_score", 0.0)
        clarity = report_data.get("clarity_score", 0.0)

        score_matrix = [
            [
                Paragraph("<b>Competency</b>", bold_label),
                Paragraph("<b>Rubric Weight</b>", bold_label),
                Paragraph("<b>Score Achieved</b>", bold_label),
                Paragraph("<b>Evaluation Standard</b>", bold_label)
            ],
            [
                Paragraph("Technical Correctness", body_style), Paragraph("30%", body_style),
                Paragraph(f"{tech}%", body_style), Paragraph("Accuracy of technical principles, syntax, & APIs", body_style)
            ],
            [
                Paragraph("Relevance to Question", body_style), Paragraph("20%", body_style),
                Paragraph(f"{rel}%", body_style), Paragraph("Direct alignment to the prompt and problem parameters", body_style)
            ],
            [
                Paragraph("Depth of Understanding", body_style), Paragraph("20%", body_style),
                Paragraph(f"{depth}%", body_style), Paragraph("Grasp of underlying architecture, memory, & concurrency", body_style)
            ],
            [
                Paragraph("Problem Solving", body_style), Paragraph("20%", body_style),
                Paragraph(f"{prob}%", body_style), Paragraph("Systematic analysis, trade-off evaluation, & practical design", body_style)
            ],
            [
                Paragraph("Clarity of Explanation", body_style), Paragraph("10%", body_style),
                Paragraph(f"{clarity}%", body_style), Paragraph("Structured articulation without undue verbosity", body_style)
            ],
        ]

        score_table = Table(score_matrix, colWidths=[140, 80, 90, 230])
        score_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#EDE9FE')),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#CBD5E1')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(score_table)
        elements.append(Spacer(1, 14))

        # 5. Question-by-Question Deep Dive
        elements.append(Paragraph("Question-by-Question Evaluation Audit", section_heading))
        questions = report_data.get("questions", [])

        for q in questions:
            q_num = q.get("order_index", 1)
            cat = q.get("category", "Technical")
            q_text = q.get("question_text", "")
            q_ans = q.get("candidate_answer", "No answer submitted.")
            q_score = q.get("score_overall", 0.0)
            feedback = q.get("feedback_justification", "")
            strengths = q.get("strengths", "")
            missing = q.get("missing_concepts", "")

            q_flow = []
            q_flow.append(Paragraph(f"<b>Question {q_num} [{cat}] — Score: {q_score}%</b>", bold_label))
            q_flow.append(Paragraph(f"<b>Prompt:</b> {q_text}", body_style))
            q_flow.append(Spacer(1, 4))
            q_flow.append(Paragraph(f"<b>Candidate Answer:</b> <i>\"{q_ans}\"</i>", body_style))
            q_flow.append(Spacer(1, 4))
            if feedback:
                q_flow.append(Paragraph(f"<b>AI Rubric Feedback:</b> {feedback}", body_style))
            if strengths:
                q_flow.append(Paragraph(f"<b>Identified Strengths:</b> {strengths}", body_style))
            if missing:
                q_flow.append(Paragraph(f"<b>Missing Concepts / Gaps:</b> {missing}", body_style))
            q_flow.append(Spacer(1, 8))
            q_flow.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#CBD5E1'), spaceAfter=8))

            elements.append(KeepTogether(q_flow))

        # 6. Recruiter Override Section & Human Sign-off
        elements.append(Spacer(1, 10))
        elements.append(Paragraph("Authorized Human Reviewer Sign-Off", section_heading))
        rec_override_score = report_data.get("recruiter_override_score")
        rec_override_rec = report_data.get("recruiter_override_recommendation")
        rec_notes = report_data.get("recruiter_notes")

        if rec_override_score is not None or rec_notes:
            override_content = f"<b>Recruiter Adjusted Score:</b> {rec_override_score}% | <b>Recruiter Decision:</b> {rec_override_rec or 'Pending'}<br/><b>Reviewer Notes:</b> {rec_notes}"
        else:
            override_content = "<i>Pending human reviewer sign-off. AI evaluations serve as decision-support recommendations and do not constitute an automated hiring determination.</i>"
        
        elements.append(Paragraph(override_content, body_style))
        elements.append(Spacer(1, 20))

        # Footer Notice
        elements.append(Paragraph(
            "<font size=8 color='#94A3B8'>Notice: This report is generated by Berri Bot AI Interview Platform. Candidates are evaluated without bias towards accent or non-job-essential language fluency.</font>",
            body_style
        ))

        doc.build(elements)
        return buffer.getvalue()
