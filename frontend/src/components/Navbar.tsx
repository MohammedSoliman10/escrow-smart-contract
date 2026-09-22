import { Link, useLocation } from 'react-router-dom'
import { ConnectButton } from './ConnectButton'
import { Logo } from './Logo'

export function Navbar() {
  const { pathname } = useLocation()
  const onLanding = pathname === '/'

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-line/70 bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <Logo className="h-7 w-7" />
          <span className="font-display text-lg font-bold tracking-tight">Escrow</span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-medium text-ink-soft md:flex">
          <a href="/#features" className="transition hover:text-ink">
            Features
          </a>
          <a href="/#how" className="transition hover:text-ink">
            How it works
          </a>
          <Link to="/app" className="transition hover:text-ink">
            Dashboard
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <ConnectButton />
          {onLanding && (
            <Link to="/app" className="btn-dark hidden sm:inline-flex">
              Open dashboard
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
