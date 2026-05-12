import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatThaiDate(date: string | Date | null): string {
  if (!date) return 'ไม่ระบุ'
  return new Date(date).toLocaleDateString('th-TH', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

export function formatThaiDateShort(date: string | Date | null): string {
  if (!date) return 'ไม่ระบุ'
  return new Date(date).toLocaleDateString('th-TH', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

export function getPriorityLabel(priority: string) {
  const map: Record<string, { label: string; color: string }> = {
    high: { label: 'เร่งด่วนสูง', color: 'text-red-600 bg-red-50' },
    medium: { label: 'ปานกลาง', color: 'text-yellow-600 bg-yellow-50' },
    low: { label: 'ต่ำ', color: 'text-green-600 bg-green-50' },
  }
  return map[priority] || { label: priority, color: 'text-gray-600 bg-gray-50' }
}

export function getComplianceLabel(status: string) {
  const map: Record<string, { label: string; color: string }> = {
    compliant: { label: 'ปฏิบัติแล้ว', color: 'text-green-700 bg-green-100' },
    non_compliant: { label: 'ยังไม่ปฏิบัติ', color: 'text-red-700 bg-red-100' },
    in_progress: { label: 'กำลังดำเนินการ', color: 'text-yellow-700 bg-yellow-100' },
    not_started: { label: 'ยังไม่เริ่ม', color: 'text-gray-700 bg-gray-100' },
    not_applicable: { label: 'ไม่เกี่ยวข้อง', color: 'text-blue-700 bg-blue-100' },
  }
  return map[status] || { label: status, color: 'text-gray-600 bg-gray-50' }
}

export function getDaysRemaining(dueDate: string | null): number | null {
  if (!dueDate) return null
  const diff = Math.ceil(
    (new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  )
  return diff
}

export function generateLawCode(sequence: number): string {
  const year = new Date().getFullYear()
  return `LAW-${year}-${String(sequence).padStart(4, '0')}`
}

export function detectLawType(title: string): string {
  if (title.includes('พระราชบัญญัติ')) return 'พระราชบัญญัติ'
  if (title.includes('พระราชกฤษฎีกา')) return 'พระราชกฤษฎีกา'
  if (title.includes('กฎกระทรวง')) return 'กฎกระทรวง'
  if (title.includes('ประกาศกระทรวง')) return 'ประกาศกระทรวง'
  if (title.includes('ระเบียบ')) return 'ระเบียบ'
  return 'ประกาศ'
}
