
import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import type { Turma } from './types'

function Page() {
  const [turmas, setTurmas] = useState<Turma[]>([])

  useEffect(() => {
    async function getTurmas() {
      const { data: turmas } = await supabase.from('turmas').select()

      if (turmas && turmas.length > 1) {
        setTurmas(turmas)
      }
    }

    getTurmas()
  }, [])

  return (
    <div>
      {turmas.map((turma) => (
        <li key={turma.turma_code}>{turma.turma_code}</li>
      ))}
    </div>
  )
}
export default Page
