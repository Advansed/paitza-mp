import React, { useCallback, useEffect, useState } from 'react'
import { Link, useHistory, useLocation } from 'react-router-dom'
import {
  ArrowRight,
  Building2,
  FileText,
  MapPinned,
  Menu,
  ShieldCheck,
  Truck,
  Users,
  X,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Login, type LoginFormMode } from '../../components/Login'
import { persistPartnerFromUrl } from '../../components/Login/registration'
import { LanguageSwitcher } from '../../i18n/LanguageSwitcher'
import { CurrencyRatesBar } from './CurrencyRatesBar'
import styles from './LandingPage.module.css'

const NAV = [
  { href: '#home', key: 'navHome' },
  { href: '#about', key: 'navAbout' },
  { href: '#services', key: 'navServices' },
  { href: '#routes', key: 'navRoutes' },
  { href: '#partners', key: 'navPartners' },
  { href: '#tariffs', key: 'navTariffs' },
  { href: '#blog', key: 'navBlog' },
  { href: '#contacts', key: 'navContacts' },
]

const FEATURES = [
  { icon: ShieldCheck, key: 'featureSafe' },
  { icon: MapPinned, key: 'featureTrack' },
  { icon: FileText, key: 'featureDocs' },
  { icon: Users, key: 'featurePartners' },
]

const METRICS = [
  { title: 'metric1', sub: 'metric1sub' },
  { title: 'metric2', sub: 'metric2sub' },
  { title: 'metric3', sub: 'metric3sub' },
  { title: 'metric4', sub: 'metric4sub' },
  { title: 'metric5', sub: 'metric5sub' },
  { title: 'metric6', sub: 'metric6sub' },
]

const AUDIENCES = [
  { id: 'owners', icon: Building2, title: 'audienceOwners', text: 'audienceOwnersText' },
  { id: 'carriers', icon: Truck, title: 'audienceCarriers', text: 'audienceCarriersText' },
  { id: 'logistics', icon: Users, title: 'audienceLogistics', text: 'audienceLogisticsText' },
]

function authFromSearch(search: string): LoginFormMode | null {
  const value = new URLSearchParams(search).get('auth')
  if (value === 'login' || value === 'register' || value === 'recovery') return value
  return null
}

export const LandingPage: React.FC = () => {
  const { t } = useTranslation('landing')
  const history = useHistory()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [authMode, setAuthMode] = useState<LoginFormMode | null>(() =>
    authFromSearch(location.search)
  )

  useEffect(() => {
    persistPartnerFromUrl(location.search)
    setAuthMode(authFromSearch(location.search))
  }, [location.search])

  const closeMenu = () => setMenuOpen(false)

  const openAuth = useCallback(
    (mode: LoginFormMode) => {
      closeMenu()
      setAuthMode(mode)
      history.replace({ pathname: '/', search: `?auth=${mode}` })
    },
    [history]
  )

  const closeAuth = useCallback(() => {
    setAuthMode(null)
    history.replace({ pathname: '/', search: '' })
  }, [history])

  return (
    <div className={styles.page}>
      <div className={styles.topStack}>
        <header className={styles.header}>
          <div className={styles.headerInner}>
            <a href="#home" className={styles.brand} onClick={closeMenu}>
              <img
                src="/landing/logo.jpg"
                alt=""
                className={styles.brandLogo}
                width={44}
                height={44}
              />
              <span className={styles.brandText}>
                <strong>PAITZA</strong>
                <small>GLOBAL LOGISTICS PLATFORM</small>
              </span>
            </a>

            <nav className={`${styles.nav} ${menuOpen ? styles.navOpen : ''}`} aria-label={t('navLabel')}>
              {NAV.map((item) => (
                <a key={item.href} href={item.href} className={styles.navLink} onClick={closeMenu}>
                  {t(item.key)}
                </a>
              ))}
              <Link to="/stats" className={styles.navLink} onClick={closeMenu}>
                {t('navStats')}
              </Link>
              <div className={styles.navAuth}>
                <button type="button" className={styles.btnGhost} onClick={() => openAuth('login')}>
                  {t('login')}
                </button>
                <button type="button" className={styles.btnPrimary} onClick={() => openAuth('register')}>
                  {t('register')}
                </button>
              </div>
            </nav>

            <div className={styles.headerActions}>
              <LanguageSwitcher />
              <button type="button" className={styles.btnGhost} onClick={() => openAuth('login')}>
                {t('login')}
              </button>
              <button type="button" className={styles.btnPrimary} onClick={() => openAuth('register')}>
                {t('register')}
              </button>
              <button
                type="button"
                className={styles.menuBtn}
                aria-label={menuOpen ? t('closeMenu') : t('openMenu')}
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((v) => !v)}
              >
                {menuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </header>

        <CurrencyRatesBar />
      </div>

      <section id="home" className={styles.hero}>
        <div className={styles.heroMedia} aria-hidden>
          <div className={styles.heroShade} />
        </div>

        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <p className={styles.kicker}>{t('kicker')}</p>
            <h1 className={styles.heroTitle}>
              <span className={styles.heroBrand}>PAITZA</span>
              {' – '}
              {t('heroTitle')}
            </h1>
            <p className={styles.heroLead}>{t('heroLead')}</p>
            <p className={styles.heroSub}>{t('heroSub')}</p>
            <div className={styles.heroCtas}>
              <button type="button" className={styles.ctaPrimary} onClick={() => openAuth('login')}>
                {t('findCargo')}
                <ArrowRight size={18} strokeWidth={2.25} />
              </button>
              <button
                type="button"
                className={styles.ctaSecondary}
                onClick={() => openAuth('register')}
              >
                {t('becomePartner')}
              </button>
            </div>
          </div>

          <ul className={styles.featureList}>
            {FEATURES.map(({ icon: Icon, key }) => (
              <li key={key}>
                <span className={styles.featureIcon} aria-hidden>
                  <Icon size={18} strokeWidth={2} />
                </span>
                {t(key)}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className={styles.metrics} aria-label={t('metricsLabel')}>
        <div className={styles.metricsInner}>
          {METRICS.map((item) => (
            <div key={item.title} className={styles.metricItem}>
              <strong>{t(item.title)}</strong>
              <span>{t(item.sub)}</span>
            </div>
          ))}
        </div>
        <div className={styles.metricsFoot}>
          <Link to="/stats" className={styles.metricsLink}>
            {t('statsLink')}
          </Link>
        </div>
      </section>

      <section id="about" className={styles.about}>
        <div className={styles.aboutInner}>
          <div className={styles.aboutIntro}>
            <h2>{t('aboutTitle')}</h2>
            <p>{t('aboutText')}</p>
            <a href="#services" className={styles.moreLink}>
              {t('more')}
              <ArrowRight size={16} strokeWidth={2.25} />
            </a>
          </div>

          <div id="services" className={styles.audienceGrid}>
            {AUDIENCES.map(({ id, icon: Icon, title, text }) => (
              <article key={id} id={id} className={styles.audience}>
                <span className={styles.audienceIcon} aria-hidden>
                  <Icon size={22} strokeWidth={2} />
                </span>
                <h3>{t(title)}</h3>
                <p>{t(text)}</p>
                <button type="button" className={styles.moreLinkBtn} onClick={() => openAuth('register')}>
                  {t('moreShort')}
                  <ArrowRight size={16} strokeWidth={2.25} />
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="routes" className={styles.band}>
        <div className={styles.bandInner}>
          <h2>{t('routesTitle')}</h2>
          <p>{t('routesText')}</p>
          <button type="button" className={styles.btnPrimary} onClick={() => openAuth('login')}>
            {t('openFeed')}
          </button>
        </div>
      </section>

      <section id="partners" className={styles.bandAlt}>
        <div className={styles.bandInner}>
          <h2>{t('partnersTitle')}</h2>
          <p>{t('partnersText')}</p>
          <button type="button" className={styles.btnPrimary} onClick={() => openAuth('register')}>
            {t('becomePartner')}
          </button>
        </div>
      </section>

      <section id="tariffs" className={styles.band}>
        <div className={styles.bandInner}>
          <h2>{t('tariffsTitle')}</h2>
          <p>{t('tariffsText')}</p>
          <button type="button" className={styles.btnGhostDark} onClick={() => openAuth('register')}>
            {t('learnTerms')}
          </button>
        </div>
      </section>

      <section id="blog" className={styles.bandAlt}>
        <div className={styles.bandInner}>
          <h2>{t('blogTitle')}</h2>
          <p>{t('blogText')}</p>
        </div>
      </section>

      <footer id="contacts" className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <strong>PAITZA</strong>
            <span>{t('footerTagline')}</span>
          </div>
          <div className={styles.footerContacts}>
            <a href="mailto:info@paitza.com">info@paitza.com</a>
            <Link to="/privacy" className={styles.footerLink}>
              {t('privacyLink')}
            </Link>
            <Link to="/consent" className={styles.footerLink}>
              {t('consentLink')}
            </Link>
            <button type="button" className={styles.footerLink} onClick={() => openAuth('login')}>
              {t('login')}
            </button>
            <button type="button" className={styles.footerLink} onClick={() => openAuth('register')}>
              {t('register')}
            </button>
          </div>
          <p className={styles.footerCopy}>© {new Date().getFullYear()} PAITZA</p>
        </div>
      </footer>

      {authMode && (
        <Login variant="modal" initialMode={authMode} onClose={closeAuth} />
      )}
    </div>
  )
}

export default LandingPage
