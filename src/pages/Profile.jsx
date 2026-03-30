import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import styles from './Profile.module.css'

const SKILLS_OPTS = ['React','Node.js','Python','Figma','UI/UX Design','Branding','SEO','Copywriting',
  'Data Analysis','Financial Modeling','After Effects','Motion Design','AWS','DevOps','Mobile Development',
  'Flutter','Swift','Legal','Compliance','HR','Project Management','Excel','SQL','Tableau']

export default function Profile() {
  const { user, updateUser, switchRole, logout, wallet } = useApp()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name:       user.name,
    email:      user.email,
    bio:        user.bio || '',
    location:   user.location || '',
    hourlyRate: user.hourlyRate || '',
    skills:     user.skills || [],
  })
  const [activeTab, setActiveTab] = useState('profile')
  const [saved, setSaved] = useState(false)

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); setSaved(false) }

  function toggleSkill(s) {
    setForm(f => ({
      ...f,
      skills: f.skills.includes(s) ? f.skills.filter(x => x !== s) : [...f.skills, s],
    }))
    setSaved(false)
  }

  function handleSave(e) {
    e.preventDefault()
    updateUser(form)
    setSaved(true)
  }

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.pageHead}>
          <div>
            <p className={styles.eyebrow}>Account</p>
            <h1 className={styles.title}>Settings & <em>Profile</em></h1>
          </div>
        </div>

        <div className={styles.layout}>
          {/* ── Left sidebar ── */}
          <div className={styles.sidebar}>
            <div className={styles.profileCard}>
              <div className={styles.bigAvatar}>{user.avatar}</div>
              <p className={styles.profileName}>{user.name}</p>
              <p className={styles.profileRole}>{user.role === 'client' ? 'Client' : 'Freelancer'}</p>
              <p className={styles.profileSince}>Member since {user.memberSince}</p>
              <div className={styles.walletMini}>
                <span className={styles.walletMiniLabel}>Wallet balance</span>
                <span className={styles.walletMiniVal}>${wallet.balance.toFixed(2)}</span>
              </div>
            </div>

            <nav className={styles.sideNav}>
              {[['profile','Profile & Bio'],['skills','Skills & Rate'],['security','Security'],['danger','Account']].map(([v,l]) => (
                <button key={v} className={`${styles.sideNavItem} ${activeTab===v?styles.sideNavActive:''}`} onClick={() => setActiveTab(v)}>{l}</button>
              ))}
            </nav>

            <button className={styles.switchRoleBtn} onClick={switchRole}>
              Switch to {user.role === 'client' ? 'freelancer' : 'client'} mode
            </button>
          </div>

          {/* ── Main panel ── */}
          <div className={styles.main}>

            {/* Profile tab */}
            {activeTab === 'profile' && (
              <form className={styles.panel} onSubmit={handleSave}>
                <div className={styles.panelHead}>
                  <h2 className={styles.panelTitle}>Profile Information</h2>
                  <p className={styles.panelSub}>This is how you appear to clients and freelancers on NEXUS.</p>
                </div>

                <div className={styles.avatarSection}>
                  <div className={styles.avatarLg}>{user.avatar}</div>
                  <div>
                    <p className={styles.avatarHint}>Your initials avatar is auto-generated from your name.</p>
                  </div>
                </div>

                <div className={styles.fieldGrid}>
                  <div className={styles.field}>
                    <label className={styles.label}>Full name</label>
                    <input className={styles.input} value={form.name} onChange={e => set('name', e.target.value)} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Email address</label>
                    <input className={styles.input} type="email" value={form.email} onChange={e => set('email', e.target.value)} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Location</label>
                    <input className={styles.input} placeholder="e.g. Lagos, Nigeria" value={form.location} onChange={e => set('location', e.target.value)} />
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Bio <span className={styles.optional}>(visible on your profile)</span></label>
                  <textarea className={styles.textarea} rows={4} placeholder="Tell clients and freelancers about yourself…" value={form.bio} onChange={e => set('bio', e.target.value)} />
                  <p className={styles.hint}>{form.bio.length}/300</p>
                </div>

                <div className={styles.formActions}>
                  <button type="submit" className={styles.saveBtn}>
                    {saved ? '✓ Saved' : 'Save changes'}
                  </button>
                </div>
              </form>
            )}

            {/* Skills tab */}
            {activeTab === 'skills' && (
              <form className={styles.panel} onSubmit={handleSave}>
                <div className={styles.panelHead}>
                  <h2 className={styles.panelTitle}>Skills & Hourly Rate</h2>
                  <p className={styles.panelSub}>Helps you get matched to relevant projects and talent.</p>
                </div>

                {user.role === 'freelancer' && (
                  <div className={styles.field}>
                    <label className={styles.label}>Hourly rate (USD)</label>
                    <div className={styles.rateWrap}>
                      <span className={styles.ratePrefix}>$</span>
                      <input className={`${styles.input} ${styles.rateInput}`} type="number" min="1" placeholder="e.g. 50" value={form.hourlyRate} onChange={e => set('hourlyRate', e.target.value)} />
                      <span className={styles.rateSuffix}>/hr</span>
                    </div>
                  </div>
                )}

                <div className={styles.field}>
                  <label className={styles.label}>Skills</label>
                  <div className={styles.skillsGrid}>
                    {SKILLS_OPTS.map(s => (
                      <button
                        key={s}
                        type="button"
                        className={`${styles.skillChip} ${form.skills.includes(s) ? styles.skillActive : ''}`}
                        onClick={() => toggleSkill(s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  <p className={styles.hint}>{form.skills.length} selected</p>
                </div>

                <div className={styles.formActions}>
                  <button type="submit" className={styles.saveBtn}>{saved ? '✓ Saved' : 'Save changes'}</button>
                </div>
              </form>
            )}

            {/* Security tab */}
            {activeTab === 'security' && (
              <div className={styles.panel}>
                <div className={styles.panelHead}>
                  <h2 className={styles.panelTitle}>Security</h2>
                  <p className={styles.panelSub}>Keep your account safe.</p>
                </div>
                <div className={styles.securityItems}>
                  {[
                    { label:'Password', value:'Last changed: never', action:'Change' },
                    { label:'Two-factor authentication', value:'Not enabled', action:'Enable' },
                    { label:'Active sessions', value:'1 active session', action:'View' },
                  ].map(item => (
                    <div key={item.label} className={styles.securityRow}>
                      <div>
                        <p className={styles.securityLabel}>{item.label}</p>
                        <p className={styles.securityValue}>{item.value}</p>
                      </div>
                      <button className={styles.securityAction}>{item.action}</button>
                    </div>
                  ))}
                </div>
                <div className={styles.infoBox}>
                  <p>This is a simulated environment. Security features are for UI demonstration only.</p>
                </div>
              </div>
            )}

            {/* Danger zone */}
            {activeTab === 'danger' && (
              <div className={styles.panel}>
                <div className={styles.panelHead}>
                  <h2 className={styles.panelTitle}>Account Actions</h2>
                  <p className={styles.panelSub}>Manage your account status.</p>
                </div>
                <div className={styles.dangerZone}>
                  <div className={styles.dangerRow}>
                    <div>
                      <p className={styles.dangerLabel}>Log out</p>
                      <p className={styles.dangerSub}>End your current session.</p>
                    </div>
                    <button className={styles.logoutBtn} onClick={() => { logout(); navigate('/auth') }}>Log out</button>
                  </div>
                  <div className={styles.dangerRow}>
                    <div>
                      <p className={styles.dangerLabel}>Reset demo data</p>
                      <p className={styles.dangerSub}>Clear all stored data and reload with defaults. Cannot be undone.</p>
                    </div>
                    <button className={styles.resetBtn} onClick={() => { localStorage.clear(); window.location.reload() }}>
                      Reset data
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
