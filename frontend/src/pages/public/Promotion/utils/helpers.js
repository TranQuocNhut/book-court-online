export const copyToClipboard = (code) => {
  navigator.clipboard.writeText(code)
  return true
}

export const calculateUsagePercent = (current, total) => {
  return (current / total) * 100
}

