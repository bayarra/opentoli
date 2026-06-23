import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  description: 'How visitors, contributors, and editors work in OpenToli.',
  title: 'Workflow | OpenToli',
}

const steps = [
  {
    action: 'Search, browse, and read',
    audience: 'Visitors',
    body: 'Use the homepage, search page, categories, and public draft pages. You can read published terms and explicitly public unverified AI drafts without an account.',
    href: '/search',
    link: 'Search terms',
  },
  {
    action: 'Comment and suggest wording',
    audience: 'Members',
    body: 'Sign in, open a public draft, then leave a comment or suggested Mongolian translation. Suggestions are moderated proposals; they do not directly edit a term.',
    href: '/drafts',
    link: 'View public drafts',
  },
  {
    action: 'Edit and publish',
    audience: 'Editors',
    body: 'Open the Workspace to monitor drafts, feedback, jobs, and batches. From there, use the Draft Inbox to edit the English headword, Mongolian translation, English explanation, and Mongolian explanation, then choose Publish.',
    href: '/workspace',
    link: 'Open Workspace',
  },
]

export default function WorkflowPage() {
  return (
    <main className="content-page workflow-page">
      <div className="page-heading">
        <p className="eyebrow">OpenToli workflow</p>
        <h1>Do terminology work in the OpenToli web app.</h1>
        <p>
          Payload admin still exists for system maintenance, user recovery, and raw data checks.
          Everyday translation work should happen on OpenToli pages so the workflow stays simple:
          public feedback first, editor decision last.
        </p>
      </div>

      <section className="workflow-cards" aria-label="Workflow by role">
        {steps.map((step, index) => (
          <article className="workflow-card" key={step.audience}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <p className="eyebrow">{step.audience}</p>
            <h2>{step.action}</h2>
            <p>{step.body}</p>
            <Link href={step.href}>{step.link}</Link>
          </article>
        ))}
      </section>

      <section className="workflow-strip workflow-rule" aria-labelledby="web-first-rule">
        <div>
          <p className="eyebrow">Rule of thumb</p>
          <h2 id="web-first-rule">If it changes terminology, do it in OpenToli web.</h2>
          <p>
            Contributors should use public draft feedback forms. Editors should use the Draft
            Inbox. The admin panel should not be the main place for translation suggestions,
            editorial decisions, or publication.
          </p>
        </div>
        <div className="workflow-actions">
          <Link href="/workspace">Editor workspace</Link>
          <Link href="/admin">Admin maintenance</Link>
        </div>
      </section>
    </main>
  )
}
