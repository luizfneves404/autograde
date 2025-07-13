import { useState, useEffect } from 'react'
import type { AppData } from '@/types'

export const useAppData = () => {
  const [data, setData] = useState<AppData>({ disciplinas: [], turmas: [] })
  const [loadError, setLoadError] = useState<string | null>(null)

  // Load data on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('autograde-data')
      if (saved) {
        const parsed = JSON.parse(saved)
        setData(parsed)
        console.log('Data loaded from localStorage:', parsed)
      }
    } catch (e) {
      console.error('Failed to load data from localStorage:', e)
      setLoadError('Failed to load saved data')
    }
  }, [])

  // Save data whenever it changes
  useEffect(() => {
    try {
      const dataString = JSON.stringify(data)
      localStorage.setItem('autograde-data', dataString)
      console.log('Data saved to localStorage:', data)
      setLoadError(null)
    } catch (e) {
      console.error('Failed to save data to localStorage:', e)
      setLoadError('Failed to save data')
    }
  }, [data])

  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'autograde-data.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string)
        if (imported && typeof imported === 'object' && 'disciplinas' in imported && 'turmas' in imported) {
          setData(imported)
          alert('Dados importados com sucesso!')
        } else {
          alert('Formato de arquivo inválido: campos obrigatórios ausentes')
        }
      } catch (error) {
        console.error('Import error:', error)
        alert('Formato de arquivo JSON inválido')
      }
    }
    reader.readAsText(file)
  }

  return {
    data,
    setData,
    loadError,
    exportData,
    importData
  }
} 