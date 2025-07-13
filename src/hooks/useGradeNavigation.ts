import { useState, useCallback, useEffect } from 'react'

interface UseGradeNavigationParams {
  totalGrades: number
  onGradeChange?: (index: number) => void
}

export function useGradeNavigation({
  totalGrades,
  onGradeChange,
}: UseGradeNavigationParams) {
  const [currentGradeIndex, setCurrentGradeIndex] = useState(0)

  useEffect(() => {
    onGradeChange?.(currentGradeIndex)
  }, [currentGradeIndex, onGradeChange])

  const goToPrevious = useCallback(() => {
    setCurrentGradeIndex(prev => (prev === 0 ? totalGrades - 1 : prev - 1))
  }, [totalGrades])

  const goToNext = useCallback(() => {
    setCurrentGradeIndex(prev => (prev === totalGrades - 1 ? 0 : prev + 1))
  }, [totalGrades])

  const setGradeIndex = useCallback((index: number) => {
    if (index >= 0 && index < totalGrades) {
      setCurrentGradeIndex(index)
    }
  }, [totalGrades])

  return {
    currentGradeIndex,
    goToPrevious,
    goToNext,
    setGradeIndex,
  }
} 