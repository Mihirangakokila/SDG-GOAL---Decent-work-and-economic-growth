import { formatDistanceToNow, format } from 'date-fns'

export const timeAgo = (date) =>
  formatDistanceToNow(new Date(date), { addSuffix: true })

export const formatDate = (date) =>
  format(new Date(date), 'MMM d, yyyy')

export const statusBadge = (status) => {
  const map = {
    Active: 'badge-green',
    Draft:  'badge-yellow',
    Closed: 'badge-gray',
  }
  return map[status] ?? 'badge-gray'
}

export const truncate = (str, n = 120) =>
  str?.length > n ? str.slice(0, n) + '…' : str

export const skillColors = [
  'bg-blue-50 text-blue-700',
  'bg-violet-50 text-violet-700',
  'bg-teal-50 text-teal-700',
  'bg-pink-50 text-pink-700',
  'bg-amber-50 text-amber-700',
]
export const skillColor = (i) => skillColors[i % skillColors.length]
