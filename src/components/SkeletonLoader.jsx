import styles from './SkeletonLoader.module.css'

// ── Generic shimmer block ──────────────────────────────────────────────────
function Bone({ w = '100%', h = 16, r = 6, style = {} }) {
  return (
    <div
      className={styles.bone}
      style={{ width: w, height: h, borderRadius: r, ...style }}
    />
  )
}

// ── Job card skeleton ──────────────────────────────────────────────────────
export function JobCardSkeleton() {
  return (
    <div className={styles.jobCard}>
      <div className={styles.jobCardHead}>
        <div style={{ flex: 1 }}>
          <Bone w="65%" h={18} r={4} />
          <Bone w="40%" h={13} r={4} style={{ marginTop: 8 }} />
        </div>
        <div style={{ textAlign: 'right' }}>
          <Bone w={80} h={22} r={6} />
          <Bone w={50} h={13} r={4} style={{ marginTop: 6 }} />
        </div>
      </div>
      <Bone w="100%" h={13} r={4} style={{ marginTop: 16 }} />
      <Bone w="85%" h={13} r={4} style={{ marginTop: 6 }} />
      <div className={styles.skillRow}>
        <Bone w={60} h={26} r={20} />
        <Bone w={80} h={26} r={20} />
        <Bone w={50} h={26} r={20} />
      </div>
    </div>
  )
}

// ── Freelancer card skeleton ───────────────────────────────────────────────
export function FreelancerCardSkeleton() {
  return (
    <div className={styles.freelancerCard}>
      <div className={styles.freelancerCardTop}>
        <Bone w={52} h={52} r={999} />
        <div style={{ flex: 1 }}>
          <Bone w="55%" h={16} r={4} />
          <Bone w="40%" h={13} r={4} style={{ marginTop: 6 }} />
        </div>
        <Bone w={56} h={22} r={6} />
      </div>
      <Bone w="90%" h={13} r={4} style={{ marginTop: 14 }} />
      <Bone w="75%" h={13} r={4} style={{ marginTop: 6 }} />
      <div className={styles.skillRow}>
        <Bone w={55} h={24} r={20} />
        <Bone w={70} h={24} r={20} />
        <Bone w={45} h={24} r={20} />
      </div>
    </div>
  )
}

// ── KPI card skeleton (dashboard) ──────────────────────────────────────────
export function KpiSkeleton() {
  return (
    <div className={styles.kpi}>
      <Bone w="55%" h={13} r={4} />
      <Bone w="70%" h={28} r={6} style={{ marginTop: 10 }} />
      <Bone w="40%" h={11} r={4} style={{ marginTop: 8 }} />
    </div>
  )
}

// ── Notification row skeleton ──────────────────────────────────────────────
export function NotifSkeleton() {
  return (
    <div className={styles.notifRow}>
      <Bone w={8} h={8} r={999} />
      <div style={{ flex: 1 }}>
        <Bone w="80%" h={14} r={4} />
        <Bone w="35%" h={12} r={4} style={{ marginTop: 6 }} />
      </div>
    </div>
  )
}

// ── Full page list skeleton (n items) ─────────────────────────────────────
export function JobListSkeleton({ count = 5 }) {
  return (
    <div className={styles.list}>
      {Array.from({ length: count }).map((_, i) => <JobCardSkeleton key={i} />)}
    </div>
  )
}

export function FreelancerGridSkeleton({ count = 6 }) {
  return (
    <div className={styles.grid}>
      {Array.from({ length: count }).map((_, i) => <FreelancerCardSkeleton key={i} />)}
    </div>
  )
}
