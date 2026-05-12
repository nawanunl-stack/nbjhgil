import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export interface AnalyzedRequirement {
  item_number: string
  section_name: string
  who_must_do: string
  what_to_do: string
  where_to_do: string
  how_to_do: string
  related_documents: string[]
  frequency: string
  priority: 'high' | 'medium' | 'low'
  related_department_keywords: string[]
}

export async function analyzeLawContent(
  title: string,
  content: string
): Promise<AnalyzedRequirement[]> {
  const prompt = `
คุณเป็นผู้เชี่ยวชาญด้านกฎหมายความปลอดภัยในการทำงานของประเทศไทย
วิเคราะห์กฎหมายต่อไปนี้และแยกข้อกำหนดที่ต้องปฏิบัติออกมาเป็นรายข้อ

ชื่อกฎหมาย: ${title}

เนื้อหา:
${content.substring(0, 4000)}

ให้ตอบเป็น JSON Array โดยแต่ละรายการมีโครงสร้างดังนี้:
{
  "item_number": "ข้อที่ / มาตราที่",
  "section_name": "ชื่อหัวข้อ",
  "who_must_do": "ใครต้องทำ (นายจ้าง/ลูกจ้าง/จป./แผนกใด)",
  "what_to_do": "ต้องทำอะไร (อธิบายให้ชัดเจน)",
  "where_to_do": "ทำที่ไหน (สถานที่/ส่วนงาน)",
  "how_to_do": "ทำอย่างไร (วิธีการ/ขั้นตอน)",
  "related_documents": ["เอกสารที่เกี่ยวข้อง"],
  "frequency": "ความถี่ (รายวัน/รายเดือน/รายปี/ตามกำหนด)",
  "priority": "high/medium/low",
  "related_department_keywords": ["ฝ่ายผลิต","ฝ่ายวิศวกรรม","ฝ่ายบุคคล","ฝ่ายคลังสินค้า","ฝ่ายความปลอดภัย"]
}

ตอบเฉพาะ JSON Array เท่านั้น ไม่ต้องมีข้อความอื่น
`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    })

    const result = JSON.parse(response.choices[0].message.content || '{}')
    return result.requirements || result.items || []
  } catch (error) {
    console.error('AI Analysis error:', error)
    return []
  }
}

export async function generateLawSummary(
  title: string,
  content: string
): Promise<string> {
  const prompt = `
สรุปกฎหมายต่อไปนี้ให้เข้าใจง่าย ภายใน 3-5 ประโยค โดยเน้น:
1. วัตถุประสงค์หลัก
2. ผู้ที่เกี่ยวข้อง
3. สาระสำคัญที่ต้องรู้

ชื่อกฎหมาย: ${title}
เนื้อหา: ${content.substring(0, 2000)}

ตอบเป็นภาษาไทยที่เข้าใจง่าย
`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
    })
    return response.choices[0].message.content || ''
  } catch {
    return ''
  }
}
