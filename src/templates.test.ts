import { describe, it, expect } from 'vitest'
import { templates, getTemplatesByCategory, CATEGORIES } from './templates'

describe('templates', () => {
  it('has at least 5 templates', () => {
    expect(templates.length).toBeGreaterThanOrEqual(5)
  })

  it('every template has required fields', () => {
    for (const t of templates) {
      expect(t.id).toBeTruthy()
      expect(t.title).toBeTruthy()
      expect(t.description).toBeTruthy()
      expect(t.category).toBeTruthy()
      expect(t.code).toBeTruthy()
      expect(t.code.length).toBeGreaterThan(50)
    }
  })

  it('all template IDs are unique', () => {
    const ids = templates.map(t => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('all templates have a valid category', () => {
    const validCategories = Object.keys(CATEGORIES)
    for (const t of templates) {
      expect(validCategories).toContain(t.category)
    }
  })

  it('all template code is syntactically valid JS', () => {
    for (const t of templates) {
      expect(() => {
        new Function('terasu', 'canvas', 'controls', 'requestAnimationFrame', t.code)
      }, `${t.id} should parse`).not.toThrow()
    }
  })

  it('all templates reference createRenderer', () => {
    for (const t of templates) {
      expect(t.code, `${t.id} should use createRenderer`).toContain('createRenderer')
    }
  })

  it('all templates have an animation loop', () => {
    for (const t of templates) {
      expect(t.code, `${t.id} should call requestAnimationFrame`).toContain('requestAnimationFrame')
    }
  })

  it('all templates call drawGrid', () => {
    for (const t of templates) {
      expect(t.code, `${t.id} should draw grid`).toContain('drawGrid')
    }
  })
})

describe('getTemplatesByCategory', () => {
  it('groups templates by category', () => {
    const grouped = getTemplatesByCategory()
    expect(grouped.mechanics.length).toBeGreaterThan(0)
    expect(grouped.chaos.length).toBeGreaterThan(0)
    expect(grouped.electromagnetism.length).toBeGreaterThan(0)
    expect(grouped.waves.length).toBeGreaterThan(0)
  })

  it('every template appears in exactly one category', () => {
    const grouped = getTemplatesByCategory()
    const total = Object.values(grouped).reduce((sum, arr) => sum + arr.length, 0)
    expect(total).toBe(templates.length)
  })
})
