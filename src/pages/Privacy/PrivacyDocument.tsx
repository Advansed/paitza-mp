import React from 'react'
import type { PrivacyDocumentContent } from './privacyContent'
import styles from './PrivacyDocument.module.css'

const EMAIL = 'paitza.group@gmail.com'
const SITE = 'Paitza.com'

function withLinks(text: string): React.ReactNode[] {
  const pattern = new RegExp(`(${EMAIL}|${SITE})`, 'g')
  const parts = text.split(pattern)
  return parts.map((part, index) => {
    if (part === EMAIL) {
      return (
        <a key={`${index}-mail`} href={`mailto:${EMAIL}`}>
          {EMAIL}
        </a>
      )
    }
    if (part === SITE) {
      return (
        <a key={`${index}-site`} href="https://paitza.com">
          {SITE}
        </a>
      )
    }
    return part
  })
}

type PrivacyDocumentProps = {
  content: PrivacyDocumentContent
}

export const PrivacyDocument: React.FC<PrivacyDocumentProps> = ({ content }) => {
  return (
    <article className={styles.doc}>
      <p className={styles.kicker}>{content.kicker}</p>
      <h1 className={content.subtitle ? undefined : styles.titleSolo}>{content.title}</h1>
      {content.subtitle && <p className={styles.subtitle}>{content.subtitle}</p>}
      <dl className={styles.meta}>
        {content.meta.map((item) => (
          <div key={item.label}>
            <dt>{item.label}</dt>
            <dd>{withLinks(item.value)}</dd>
          </div>
        ))}
      </dl>
      {content.intro && <p className={styles.intro}>{withLinks(content.intro)}</p>}
      {content.notice && <p className={styles.notice}>{withLinks(content.notice)}</p>}
      {content.sections.map((section) => (
        <section key={section.heading}>
          <h2>{section.heading}</h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph}>{withLinks(paragraph)}</p>
          ))}
        </section>
      ))}
      {content.closing?.map((line) => (
        <p key={line} className={styles.closing}>
          {withLinks(line)}
        </p>
      ))}
      {content.end && <p className={styles.end}>{content.end}</p>}
      <p className={styles.footer}>{withLinks(content.footer)}</p>
    </article>
  )
}
