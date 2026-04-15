import { useRef, useCallback } from 'react'
import { printLabel } from '../utils/print'
import { exportLabelAsPng, generateFilename } from '../utils/export'

interface UsePrintExportOptions {
  labelType: string
}

export function usePrintExport({ labelType }: UsePrintExportOptions) {
  const labelRef = useRef<HTMLDivElement>(null)

  const handlePrint = useCallback(() => {
    if (!labelRef.current) return
    printLabel(labelRef.current)
  }, [])

  const handleExport = useCallback(
    async (mainFieldValue: string) => {
      if (!labelRef.current) return

      const filename = generateFilename(mainFieldValue, labelType)
      await exportLabelAsPng(labelRef.current, filename)
    },
    [labelType]
  )

  return {
    labelRef,
    handlePrint,
    handleExport,
  }
}
