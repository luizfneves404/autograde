import { useState, useEffect } from 'react'
import type { Disciplina } from '@/types'

interface PrerequisiteInputProps {
  disciplinas: Disciplina[]
  selected: string[]
  onChange: (codes: string[]) => void
  label: string
  placeholder?: string
}

export function PrerequisiteInput({
  disciplinas,
  selected,
  onChange,
  label,
  placeholder,
}: PrerequisiteInputProps) {
  const [inputValue, setInputValue] = useState(selected.join(', '))
  const [suggestions, setSuggestions] = useState<Disciplina[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  useEffect(() => {
    setInputValue(selected.join(', '))
  }, [selected])

  const handleInputChange = (value: string) => {
    setInputValue(value)

    const codes = value
      .split(',')
      .map(code => code.trim().toUpperCase())
      .filter(code => code.length > 0)

    onChange(codes)

    const lastCode = value.split(',').pop()?.trim() || ''
    if (lastCode.length > 0) {
      const filtered = disciplinas
        .filter(
          d =>
            d.code.toLowerCase().includes(lastCode.toLowerCase()) ||
            d.name.toLowerCase().includes(lastCode.toLowerCase()),
        )
        .slice(0, 5)
      setSuggestions(filtered)
      setShowSuggestions(filtered.length > 0)
    } else {
      setShowSuggestions(false)
    }
  }

  const addSuggestion = (disciplina: Disciplina) => {
    const currentCodes = inputValue
      .split(',')
      .map(c => c.trim())
      .filter(c => c.length > 0)
    currentCodes.pop() // Remove the last partial input
    currentCodes.push(disciplina.code)
    const newValue = currentCodes.join(', ') + ', '
    setInputValue(newValue)
    onChange(currentCodes)
    setShowSuggestions(false)
  }

  const inputClass =
    'px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full'

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-neutral-700 mb-1">
        {label}:
      </label>
      <input
        type="text"
        value={inputValue}
        onChange={e => handleInputChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => handleInputChange(inputValue)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        className={inputClass}
      />

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-white border border-neutral-300 rounded-b-md shadow-lg max-h-60 overflow-y-auto z-10">
          {suggestions.map(disciplina => (
            <div
              key={disciplina.code}
              onClick={() => addSuggestion(disciplina)}
              className="px-4 py-2 cursor-pointer hover:bg-neutral-100"
            >
              <strong>{disciplina.code}</strong> - {disciplina.name}
            </div>
          ))}
        </div>
      )}

      {selected.length > 0 && (
        <div className="mt-2 text-sm text-neutral-600">
          <strong>Selecionado:</strong>{' '}
          {selected
            .map(code => {
              const disciplina = disciplinas.find(d => d.code === code)
              return disciplina
                ? `${code} (${disciplina.name})`
                : `${code} (não encontrada)`
            })
            .join(', ')}
        </div>
      )}
    </div>
  )
} 