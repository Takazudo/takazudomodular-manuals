import type { ReactNode } from 'react';
import clsx from 'clsx';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Layout from '@theme/Layout';
import DocsSitemap from '@site/src/components/DocsSitemap';
import styles from './index.module.css';

export default function Home(): ReactNode {
  const { siteConfig } = useDocusaurusContext();
  const logoUrl = useBaseUrl('/img/logo.svg');
  return (
    <Layout title={siteConfig.title}>
      <main className={clsx(styles.main)}>
        <div className={styles.twoColLayout}>
          {/* Left Column - Fixed width, scroll-fixed */}
          <aside className={styles.leftCol}>
            <div className={styles.leftColContent}>
              {/* Title and Logo Section */}
              <div className={styles.headerSection}>
                <h1>{siteConfig.title}</h1>
                <p className={styles.tagline}>{siteConfig.tagline}</p>

                {/* Big Logo */}
                <div className={styles.logoContainer}>
                  <img src={logoUrl} alt="Takazudo Modular Logo" className={styles.bigLogo} />
                </div>
              </div>

              {/* Quick Links */}
              <section className={styles.linksSection}>
                <h2>Related Links</h2>
                <ul className={styles.linksList}>
                  <li>
                    <a href="https://takazudomodular.com/" rel="noopener noreferrer">
                      Takazudo Modular
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://manual-oxi-one-mk2.netlify.app/manuals/oxi-one-mk2/"
                      rel="noopener noreferrer"
                    >
                      Manual Viewer (Production)
                    </a>
                  </li>
                </ul>
              </section>

              {/* Tech Stack Section */}
              <section className={styles.statsSection}>
                <h2>Tech Stack</h2>
                <div className={styles.statsGrid}>
                  <div className={styles.statItem}>
                    <div className={styles.statNumber}>Next.js</div>
                    <div className={styles.statLabel}>Framework</div>
                  </div>
                  <div className={styles.statItem}>
                    <div className={styles.statNumber}>React 19</div>
                    <div className={styles.statLabel}>UI Library</div>
                  </div>
                  <div className={styles.statItem}>
                    <div className={styles.statNumber}>TypeScript</div>
                    <div className={styles.statLabel}>Language</div>
                  </div>
                  <div className={styles.statItem}>
                    <div className={styles.statNumber}>Tailwind v4</div>
                    <div className={styles.statLabel}>Styling</div>
                  </div>
                </div>
              </section>
            </div>
          </aside>

          {/* Right Column - Remaining space */}
          <div className={styles.rightCol}>
            {/* Full Documentation Sitemap */}
            <DocsSitemap />
          </div>
        </div>
      </main>
    </Layout>
  );
}
