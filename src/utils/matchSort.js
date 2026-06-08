export const SORT_BY_DATE = 'date'
export const SORT_BY_MATCH = 'match'

export function sortMatches(matches, sortBy = SORT_BY_DATE) {
  const list = [...matches]
  if (sortBy === SORT_BY_MATCH) {
    return list.sort((a, b) => {
      const na = a.match_number ?? Number.MAX_SAFE_INTEGER
      const nb = b.match_number ?? Number.MAX_SAFE_INTEGER
      if (na !== nb) return na - nb
      return new Date(a.start_time) - new Date(b.start_time)
    })
  }
  return list.sort((a, b) => {
    const diff = new Date(a.start_time) - new Date(b.start_time)
    if (diff !== 0) return diff
    return (a.match_number ?? 0) - (b.match_number ?? 0)
  })
}
