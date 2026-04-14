import { useCallback, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import toast from 'react-hot-toast'

/** Treat API verified flag safely (avoids truthy string bugs). */
const normVerified = (v) => v === true || v === 'true'

export default function OrgAccountPoller() {
  const { isOrg } = useAuth()
  const snapshotRef = useRef(null)

  const poll = useCallback(async () => {
    if (!isOrg) return
    try {
      const res = await api.get('/organizations')
      const list = res.data?.organizations
      const next = Array.isArray(list) && list.length > 0 ? list[0] : null
      const prev = snapshotRef.current

      if (prev && !next) {
        toast.success('Your organization profile has been removed')
        window.dispatchEvent(new CustomEvent('internhub:org-account', { detail: { kind: 'removed' } }))
      }

      const nextVerified = next ? normVerified(next.verified) : false
      if (next && prev && prev.verified === false && nextVerified === true) {
        toast.success('Your organization has been verified')
        window.dispatchEvent(new CustomEvent('internhub:org-account', { detail: { kind: 'verified' } }))
      }

      snapshotRef.current = next ? { _id: next._id, verified: nextVerified } : null
    } catch {
      // 401 handled globally; avoid spam on transient errors
    }
  }, [isOrg])

  useEffect(() => {
    if (!isOrg) {
      snapshotRef.current = null
      return
    }
    void poll()
    const id = setInterval(() => void poll(), 5000)
    return () => clearInterval(id)
  }, [isOrg, poll])

  return null
}
