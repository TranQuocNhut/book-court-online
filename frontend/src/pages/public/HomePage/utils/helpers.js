export const scrollToElement = (elementId) => {
  const element = document.getElementById(elementId)
  if (element) {
    element.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    })
  }
}

export const buildSearchParams = (sport, province, district) => {
  const params = new URLSearchParams()
  if (sport) params.append('sport', sport)
  if (province) params.append('province', province)
  if (district) params.append('district', district)
  return params.toString()
}

