"""
Invoice Generator Script
Generates a professional PDF invoice
"""

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.pdfgen import canvas
from datetime import datetime

def create_invoice():
    """Generate PDF invoice"""
    
    # Create PDF file with A4 size
    import time
    timestamp = str(int(time.time()))
    filename = f"INVOICE_INV-2025-122_{timestamp}.pdf"
    doc = SimpleDocTemplate(
        filename, 
        pagesize=A4,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )
    
    # Container for the 'Flowable' objects
    elements = []
    
    # Define styles
    styles = getSampleStyleSheet()
    
    # Custom styles - optimized for A4
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=28,
        textColor=colors.HexColor('#667eea'),
        spaceAfter=15,
        alignment=1,  # Center alignment
        fontName='Helvetica-Bold'
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=12,
        textColor=colors.HexColor('#667eea'),
        spaceAfter=8,
        fontName='Helvetica-Bold'
    )
    
    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontSize=9,
        spaceAfter=6,
    )
    
    # Title
    title = Paragraph("INVOICE", title_style)
    elements.append(title)
    
    # Invoice Number
    invoice_number = Paragraph("<b>Invoice Number:</b> INV-2025-122", normal_style)
    elements.append(invoice_number)
    elements.append(Spacer(1, 0.15*inch))
    
    # Invoice Details Table
    details_data = [
        ['Invoice Date:', 'October 31, 2025'],
    ]
    
    details_table = Table(details_data, colWidths=[1.5*inch, 2*inch])
    details_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8f9fa')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 1, colors.white),
    ]))
    elements.append(details_table)
    elements.append(Spacer(1, 0.15*inch))
    
    # Bill To and From Section
    billing_data = [
        [Paragraph('<b>Bill To:</b>', heading_style), Paragraph('<b>From:</b>', heading_style)],
        [
            Paragraph('<b>William</b><br/><br/>Total Hours: 26 hours<br/>Hourly Rate: $10.00 USD<br/>Total: $260.00 USD', normal_style),
            Paragraph('<b>FindApply</b><br/>Algeria<br/>admin@findapply.com', normal_style)
        ],
    ]
    
    billing_table = Table(billing_data, colWidths=[3*inch, 3*inch])
    billing_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 1), (0, 1), colors.HexColor('#e8eaf6')),
        ('BACKGROUND', (1, 1), (1, 1), colors.HexColor('#f5f5f5')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('BOX', (0, 1), (0, 1), 2, colors.HexColor('#667eea')),
        ('BOX', (1, 1), (1, 1), 2, colors.HexColor('#764ba2')),
    ]))
    elements.append(billing_table)
    elements.append(Spacer(1, 0.2*inch))
    
    # Services Provided
    services_heading = Paragraph('<b>SERVICES PROVIDED</b>', heading_style)
    elements.append(services_heading)
    elements.append(Spacer(1, 0.05*inch))
    
    services_data = [
        ['✓ Bug Fixes & Improvements'],
        ['✓ Add multi-language support (including Chinese)'],
        ['✓ Improve UX and UI design inspired by InvokeAI'],
        ['✓ Add Asset & Gallery Management as a standard feature'],
        ['✓ Add Categorized Prompt Library feature'],
    ]
    
    services_table = Table(services_data, colWidths=[6*inch])
    services_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8f9fa')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LINEBELOW', (0, 0), (-1, -2), 0.5, colors.HexColor('#e0e0e0')),
    ]))
    elements.append(services_table)
    elements.append(Spacer(1, 0.2*inch))
    
    # Summary Section
    summary_heading = Paragraph('<b>SUMMARY</b>', heading_style)
    elements.append(summary_heading)
    elements.append(Spacer(1, 0.05*inch))
    
    summary_data = [
        ['Total Due', '$260.00'],
    ]
    
    summary_table = Table(summary_data, colWidths=[4.5*inch, 1.5*inch])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#e8eaf6')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#667eea')),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 14),
        ('LEFTPADDING', (0, 0), (-1, -1), 15),
        ('RIGHTPADDING', (0, 0), (-1, -1), 15),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('BOX', (0, 0), (-1, -1), 2, colors.HexColor('#667eea')),
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 0.2*inch))
    
    # Payment Terms
    payment_heading = Paragraph('<b>PAYMENT TERMS</b>', heading_style)
    elements.append(payment_heading)
    
    payment_text = """
    • Payment is due within 30 days of invoice date<br/>
    • Total Hours: <b>26 hours</b><br/>
    • Hourly Rate: <b>$10.00 USD</b><br/>
    • Total Amount: <b>$260.00 USD</b>
    """
    payment_para = Paragraph(payment_text, normal_style)
    elements.append(payment_para)
    elements.append(Spacer(1, 0.1*inch))
    
    # Payment Method
    payment_method_heading = Paragraph('<b>Payment Method</b>', heading_style)
    elements.append(payment_method_heading)
    
    payment_method = Paragraph('💳 <b>WeChat Pay / Weixin Pay</b>', normal_style)
    elements.append(payment_method)
    elements.append(Spacer(1, 0.2*inch))
    
    # Notes
    notes_text = """
    <para align=center>
    <b>Thank you for your business!</b><br/>
    If you have any questions about this invoice, please contact us.<br/><br/>
    <i>This invoice was generated on October 31, 2025</i>
    </para>
    """
    notes = Paragraph(notes_text, normal_style)
    elements.append(notes)
    
    # Build PDF
    doc.build(elements)
    print(f"✅ Invoice generated successfully: {filename}")
    return filename

if __name__ == "__main__":
    try:
        create_invoice()
    except ImportError:
        print("❌ Error: reportlab library not found!")
        print("Please install it using: pip install reportlab")
    except Exception as e:
        print(f"❌ Error generating invoice: {e}")
