import Papa from 'papaparse'
import type { AppData, ClassRecord, Student } from '../types/appData'

const REQUIRED_HEADERS = ['ClassName', 'StudentID', 'StudentName'] as const

export type ParsedRow = {
  className: string
  studentId: string
  studentName: string
}

export type ClassRosterParseResult =
  | { ok: true; rows: ParsedRow[] }
  | { ok: false; errors: string[] }

export type RosterImportStats = {
  classesCreated: number
  classesUpdated: number
  studentsNew: number
  studentsRenamed: number
}

export type ImportCsvResult =
  | { ok: false; errors: string[] }
  | { ok: true; data: AppData; stats: RosterImportStats }

function validateHeaders(fields: string[] | undefined): string[] {
  const errs: string[] = []
  if (!fields?.length) {
    errs.push('CSV has no header row.')
    return errs
  }
  for (const h of REQUIRED_HEADERS) {
    if (!fields.includes(h)) {
      errs.push(`Missing required column: "${h}". Found: ${fields.join(', ')}`)
    }
  }
  return errs
}

/** Parse and normalize rows; does not mutate AppData. */
export function parseClassRosterCsv(text: string): ClassRosterParseResult {
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => h.trim(),
  })

  const headerErrs = validateHeaders(parsed.meta.fields)
  if (headerErrs.length) return { ok: false, errors: headerErrs }

  if (parsed.errors.length) {
    const msgs = parsed.errors.map((e) => e.message || String(e))
    return { ok: false, errors: msgs }
  }

  const rows: ParsedRow[] = []
  for (const record of parsed.data) {
    const className = (record.ClassName ?? '').trim()
    const studentId = (record.StudentID ?? '').trim()
    const studentName = (record.StudentName ?? '').trim()
    if (!className && !studentId && !studentName) continue
    if (!className || !studentId || !studentName) {
      return {
        ok: false,
        errors: [
          'Each non-empty row must have ClassName, StudentID, and StudentName.',
          `Invalid row: ClassName="${className}", StudentID="${studentId}", StudentName="${studentName}"`,
        ],
      }
    }
    rows.push({ className, studentId, studentName })
  }

  if (rows.length === 0) {
    return { ok: false, errors: ['No data rows found after the header.'] }
  }

  return { ok: true, rows }
}

function studentIdsForClass(rows: ParsedRow[], className: string): string[] {
  const lineIndexById = new Map<string, number>()
  rows.forEach((r, i) => {
    if (r.className !== className) return
    lineIndexById.set(r.studentId, i)
  })
  return [...lineIndexById.entries()]
    .sort((a, b) => a[1] - b[1])
    .map(([id]) => id)
}

function distinctClassNamesInOrder(rows: ParsedRow[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const r of rows) {
    if (seen.has(r.className)) continue
    seen.add(r.className)
    out.push(r.className)
  }
  return out
}

/** Last row wins for global StudentID -> StudentName. */
function studentNamesFromRows(rows: ParsedRow[]): Map<string, string> {
  const m = new Map<string, string>()
  for (const r of rows) {
    m.set(r.studentId, r.studentName)
  }
  return m
}

export function applyRosterImport(prev: AppData, rows: ParsedRow[]): ImportCsvResult {
  const namesById = studentNamesFromRows(rows)
  const studentIdsInCsv = new Set(namesById.keys())

  const prevById = new Map(prev.students.map((s) => [s.id, s]))
  let studentsNew = 0
  let studentsRenamed = 0

  const mergedStudents: Student[] = []

  for (const s of prev.students) {
    if (!studentIdsInCsv.has(s.id)) {
      mergedStudents.push(s)
    }
  }

  for (const [id, name] of namesById) {
    const existing = prevById.get(id)
    if (!existing) {
      mergedStudents.push({ id, name, notes: [] })
      studentsNew++
    } else {
      if (existing.name !== name) studentsRenamed++
      mergedStudents.push({ ...existing, name })
    }
  }

  const namesInCsv = new Set(rows.map((r) => r.className))
  const unchangedClasses = prev.classes.filter((c) => !namesInCsv.has(c.name))
  const classNamesOrdered = distinctClassNamesInOrder(rows)

  let classesCreated = 0
  let classesUpdated = 0
  const fromCsv: ClassRecord[] = []

  for (const name of classNamesOrdered) {
    const studentIds = studentIdsForClass(rows, name)
    const existing = prev.classes.find((c) => c.name === name)
    if (existing) {
      fromCsv.push({ ...existing, studentIds })
      classesUpdated++
    } else {
      fromCsv.push({
        id: crypto.randomUUID(),
        name,
        subject: '',
        studentIds,
        notes: [],
      })
      classesCreated++
    }
  }

  const data: AppData = {
    ...prev,
    students: mergedStudents,
    classes: [...unchangedClasses, ...fromCsv],
  }

  return {
    ok: true,
    data,
    stats: {
      classesCreated,
      classesUpdated,
      studentsNew,
      studentsRenamed,
    },
  }
}

export function runClassRosterImport(prev: AppData, text: string): ImportCsvResult {
  const parsed = parseClassRosterCsv(text)
  if (!parsed.ok) return parsed
  return applyRosterImport(prev, parsed.rows)
}
