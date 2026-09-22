import { Link } from 'react-router-dom'
import { Logo } from './Logo'

const COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'Dashboard', to: '/app' },
      { label: 'How it works', href: '/#how' },
      { label: 'Features', href: '/#features' },
      { label: 'Changelog', href: '#' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '#' },
      { label: 'Customers', href: '#' },
      { label: 'Press kit', href: '#' },
      { label: 'Careers', href: '#' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Docs', href: '#' },
      { label: 'API reference', href: '#' },
      { label: 'Support', href: '#' },
      { label: 'Security', href: '#' },
    ],
  },
] as const

export function Footer() {
  return (
    <footer className="border-t border-line bg-card">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-10 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div className="max-w-xs">
            <div className="flex items-center gap-2.5">
              <Logo className="h-7 w-7" />
              <span className="font-display text-lg font-bold tracking-tight">Escrow</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-ink-muted">
              A minimal escrow contract for two-key deals — for teams who would rather agree than
              trust.
            </p>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.title}>
              <p className="text-sm font-semibold text-ink">{column.title}</p>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    {'to' in link ? (
                      <Link
                        to={link.to}
                        className="text-sm text-ink-muted transition hover:text-ink"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        className="text-sm text-ink-muted transition hover:text-ink"
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-line pt-6 text-xs text-ink-muted sm:flex-row sm:items-center">
          <p>© 2026 Escrow Operations. All rights reserved.</p>
          <p className="flex items-center gap-2">
            <a href="#" className="transition hover:text-ink">
              Privacy
            </a>
            <span>·</span>
            <a href="#" className="transition hover:text-ink">
              Terms
            </a>
            <span>·</span>
            <a href="#" className="transition hover:text-ink">
              Status
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
