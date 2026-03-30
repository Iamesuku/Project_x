import { Link } from 'react-router-dom'
import styles from './Footer.module.css'

const COLS = {
  'Platform': [['Browse Talent','/browse'],['Find Work','/jobs'],['Post a Job','/post-job'],['Pricing','#'],['Enterprise','#']],
  'Company':  [['About','#'],['Newsroom','#'],['Careers','#'],['Press','#'],['Contact','#']],
  'Support':  [['Help Center','#'],['Trust & Safety','#'],['Community','#'],['Cookie Settings','#']],
  'Legal':    [['Terms','#'],['Privacy','#'],['Accessibility','#'],['Site Map','#']],
}

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.top}>
          <div className={styles.brand}>
            <Link to="/" className={styles.logo}>NEXUS</Link>
            <p className={styles.tagline}>Connect. Create. Deliver.</p>
            <p className={styles.desc}>The independent talent platform for ambitious teams and skilled professionals worldwide.</p>
          </div>
          <div className={styles.grid}>
            {Object.entries(COLS).map(([group, links]) => (
              <div key={group} className={styles.col}>
                <p className={styles.colTitle}>{group}</p>
                {links.map(([label, href]) => (
                  <Link key={label} to={href} className={styles.link}>{label}</Link>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className={styles.divider} />
        <div className={styles.bottom}>
          <p className={styles.copy}>© 2026 Nexus Inc. All rights reserved.</p>
          <div className={styles.bottomLinks}>
            <Link to="#" className={styles.bottomLink}>Privacy</Link>
            <Link to="#" className={styles.bottomLink}>Terms</Link>
            <Link to="#" className={styles.bottomLink}>Nigeria</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
