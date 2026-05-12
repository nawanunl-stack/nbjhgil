import axios from 'axios'
import * as cheerio from 'cheerio'

export interface GazetteLaw {
  title: string
  law_type: string
  gazette_date: string | null
  gazette_url: string | null
  gazette_volume: string | null
  gazette_issue: string | null
  full_content: string | null
  source: string
}

const SAFETY_KEYWORDS = [
  'ความปลอดภัย อาชีวอนามัย',
  'สภาพแวดล้อมในการทำงาน',
  'เครื่องจักร',
  'สารเคมีอันตราย',
  'ป้องกันอัคคีภัย',
  'แรงงานสัมพันธ์',
]

function parseThaiDate(dateStr: string): string | null {
  const thaiMonths: Record<string, string> = {
    มกราคม: '01', กุมภาพันธ์: '02', มีนาคม: '03',
    เมษายน: '04', พฤษภาคม: '05', มิถุนายน: '06',
    กรกฎาคม: '07', สิงหาคม: '08', กันยายน: '09',
    ตุลาคม: '10', พฤศจิกายน: '11', ธันวาคม: '12',
  }
  const thaiNums: Record<string, string> = {
    '๐': '0', '๑': '1', '๒': '2', '๓': '3', '๔': '4',
    '๕': '5', '๖': '6', '๗': '7', '๘': '8', '๙': '9',
  }
  let norm = dateStr
  Object.entries(thaiNums).forEach(([t, a]) => {
    norm = norm.replace(new RegExp(t, 'g'), a)
  })
  const parts = norm.trim().split(' ')
  if (parts.length >= 3) {
    const day = parts[0].padStart(2, '0')
    const month = thaiMonths[parts[1]] || '01'
    const year = parseInt(parts[2]) - 543
    return `${year}-${month}-${day}`
  }
  return null
}

function detectLawType(title: string): string {
  if (title.includes('พระราชบัญญัติ')) return 'พระราชบัญญัติ'
  if (title.includes('พระราชกฤษฎีกา')) return 'พระราชกฤษฎีกา'
  if (title.includes('กฎกระทรวง')) return 'กฎกระทรวง'
  if (title.includes('ประกาศกระทรวง')) return 'ประกาศกระทรวง'
  if (title.includes('ระเบียบ')) return 'ระเบียบ'
  return 'ประกาศ'
}

export async function fetchFromGazette(keyword: string): Promise<GazetteLaw[]> {
  try {
    // ⚠️ หมายเหตุ: ควรตรวจสอบ API/Terms of Service ของราชกิจจาฯ ก่อนใช้งานจริง
    const response = await axios.get(
      `https://ratchakitchanubeksa.go.th/th/content/category/detail/id/21/iid/1`,
      {
        params: { keyword },
        timeout: 15000,
        headers: { 'User-Agent': 'SafetyLegalBot/1.0' },
      }
    )

    const $ = cheerio.load(response.data)
    const results: GazetteLaw[] = []

    $('.content-list .item, .search-result, tr.law-item').each((_, el) => {
      const titleEl = $(el).find('a, .title, td:nth-child(2)')
      const title = titleEl.first().text().trim()
      const url = titleEl.first().attr('href')
      const dateText = $(el).find('.date, td:nth-child(3)').text().trim()
      const volume = $(el).find('.volume, td:nth-child(1)').text().trim()

      if (title && title.length > 10) {
        results.push({
          title,
          law_type: detectLawType(title),
          gazette_date: dateText ? parseThaiDate(dateText) : null,
          gazette_url: url
            ? url.startsWith('http') ? url : `https://ratchakitchanubeksa.go.th${url}`
            : null,
          gazette_volume: volume || null,
          gazette_issue: null,
          full_content: null,
          source: 'gazette',
        })
      }
    })

    return results
  } catch (error) {
    console.error(`Gazette fetch error for "${keyword}":`, error)
    return []
  }
}

export async function fetchFromLaborDept(keyword: string): Promise<GazetteLaw[]> {
  try {
    // ⚠️ หมายเหตุ: ควรตรวจสอบ API ของกรมสวัสดิการแรงงานก่อนใช้งานจริง
    const response = await axios.get(
      `https://www.labour.go.th/th/search`,
      {
        params: { q: keyword, type: 'law' },
        timeout: 15000,
        headers: { 'User-Agent': 'SafetyLegalBot/1.0' },
      }
    )

    const $ = cheerio.load(response.data)
    const results: GazetteLaw[] = []

    $('.search-result-item, .law-item').each((_, el) => {
      const title = $(el).find('.title, h3, h4').first().text().trim()
      const url = $(el).find('a').first().attr('href')
      const dateText = $(el).find('.date, .publish-date').text().trim()

      if (title && title.length > 5) {
        results.push({
          title,
          law_type: detectLawType(title),
          gazette_date: dateText ? parseThaiDate(dateText) : null,
          gazette_url: url
            ? url.startsWith('http') ? url : `https://www.labour.go.th${url}`
            : null,
          gazette_volume: null,
          gazette_issue: null,
          full_content: null,
          source: 'labour_dept',
        })
      }
    })

    return results
  } catch (error) {
    console.error(`Labour dept fetch error for "${keyword}":`, error)
    return []
  }
}

export async function fetchAllSafetyLaws(): Promise<GazetteLaw[]> {
  const allResults: GazetteLaw[] = []
  const seen = new Set<string>()

  for (const keyword of SAFETY_KEYWORDS) {
    const [gazetteResults, labourResults] = await Promise.allSettled([
      fetchFromGazette(keyword),
      fetchFromLaborDept(keyword),
    ])

    const results = [
      ...(gazetteResults.status === 'fulfilled' ? gazetteResults.value : []),
      ...(labourResults.status === 'fulfilled' ? labourResults.value : []),
    ]

    for (const law of results) {
      const key = law.gazette_url || law.title
      if (!seen.has(key)) {
        seen.add(key)
        allResults.push(law)
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 2000))
  }

  return allResults
}
