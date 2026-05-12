import nodemailer from 'nodemailer'
import axios from 'axios'
import { LegalRegistry, LawRequirement, Department } from '@/types'

function generateRequirementMessage(
  law: LegalRegistry,
  requirements: LawRequirement[],
  department: Department
): string {
  const date = new Date().toLocaleDateString('th-TH', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  const reqText = requirements
    .map((req, i) => `
${i + 1}. ${req.section_name || `ข้อที่ ${req.item_number}`}
   👤 ผู้รับผิดชอบ : ${req.who_must_do}
   📋 สิ่งที่ต้องทำ : ${req.what_to_do}
   📍 สถานที่       : ${req.where_to_do || 'ไม่ระบุ'}
   🔧 วิธีการ       : ${req.how_to_do || 'ไม่ระบุ'}
   ⏰ ความถี่       : ${req.frequency || 'ไม่ระบุ'}
   📎 เอกสาร       : ${req.related_documents?.join(', ') || 'ไม่ระบุ'}
`)
    .join('\n')

  return `
📌 แจ้งเตือนกฎหมายความปลอดภัยใหม่
━━━━━━━━━━━━━━━━━━━━━━━━━━
เรียน ${department.name}

ชื่อกฎหมาย : ${law.title}
ประเภท      : ${law.law_type || 'ไม่ระบุ'}
วันบังคับใช้ : ${law.effective_date
    ? new Date(law.effective_date).toLocaleDateString('th-TH')
    : 'ไม่ระบุ'}

📋 ข้อกำหนดที่เกี่ยวข้องกับแผนกของท่าน:
${reqText}

🔗 ดูรายละเอียดในระบบ:
${process.env.NEXT_PUBLIC_APP_URL}/legal/${law.id}

${law.gazette_url ? `📄 ราชกิจจาฯ: ${law.gazette_url}` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━
ส่งโดยระบบอัตโนมัติ | ${date}
ฝ่ายความปลอดภัย
`.trim()
}

export async function sendEmail(
  to: string,
  subject: string,
  body: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    })
    await transporter.sendMail({
      from: `"ระบบกฎหมายความปลอดภัย" <${process.env.SMTP_USER}>`,
      to, subject,
      text: body,
      html: `
        <div style="font-family:Sarabun,sans-serif;max-width:600px;
                    margin:0 auto;padding:24px;background:#f8fafc;
                    border-radius:12px;">
          <div style="background:#1e40af;color:white;padding:16px 24px;
                      border-radius:8px;margin-bottom:16px;">
            <h2 style="margin:0;font-size:16px;">
              📌 แจ้งเตือนกฎหมายความปลอดภัย
            </h2>
          </div>
          <pre style="white-space:pre-wrap;font-family:Sarabun,sans-serif;
                      font-size:14px;line-height:1.8;background:white;
                      padding:20px;border-radius:8px;border:1px solid #e2e8f0;">
${body}
          </pre>
        </div>`,
    })
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function sendLineNotify(
  token: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await axios.post(
      'https://notify-api.line.me/api/notify',
      new URLSearchParams({ message }),
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    )
    return { success: true }
  } catch (error:
