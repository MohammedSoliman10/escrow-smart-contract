import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { CloudSky } from '../components/CloudSky'
import { Footer } from '../components/Footer'
import { Logo } from '../components/Logo'
import { Navbar } from '../components/Navbar'
import { escrowStats, useEscrows } from '../hooks/useEscrows'
import { formatEth, shortAddress } from '../lib/format'
import { activeChain } from '../lib/wagmi'

/* ------------------------------------------------------------------ */
/* Small shared bits                                                    */
/* ------------------------------------------------------------------ */

function WidgetRow({
  icon,
  label,
  state,
  tone,
}: {
  icon: string
  label: string
  state: string
  tone: 'green' | 'muted' | 'blue' | 'orange'
}) {
  const tones = {
    green: 'text-brand-green',
    blue: 'text-brand-blue',
    orange: 'text-brand-orange',
    muted: 'text-ink-muted',
  } as const

  return (
    <div className="flex items-center justify-between text-sm">
      <span className="flex items-center gap-2.5 text-ink-soft">
        <span className="text-ink-muted">{icon}</span>
        {label}
      </span>
      <span className={`text-xs font-semibold ${tones[tone]}`}>{state}</span>
    </div>
  )
}

function FeatureBar({ label, value, color }: { label: string; value: number; color: string }) {
  const max = Math.max(...[value, 1])
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-20 shrink-0 text-ink-soft">{label}</span>
      <div className="h-2 flex-1 rounded-full bg-surface-deep">
        <div
          className={`h-2 rounded-full ${color}`}
          style={{ width: value > 0 ? `${Math.max((value / max) * 100, 10)}%` : '0%' }}
        />
      </div>
      <span className="w-8 text-right font-semibold text-ink">{value}</span>
    </div>
  )
}

function CheckItem({ title, body }: { title: string; body: string }) {
  return (
    <li className="flex gap-3.5">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-[0.7rem] font-bold text-white">
        ✓
      </span>
      <div>
        <p className="text-sm font-semibold text-ink">{title}</p>
        <p className="mt-0.5 text-sm leading-relaxed text-ink-muted">{body}</p>
      </div>
    </li>
  )
}

/* ------------------------------------------------------------------ */
/* Landing page                                                         */
/* ------------------------------------------------------------------ */

interface Feature {
  icon: string
  title: string
  copy: string
  widget: ReactNode
}

export default function Landing() {
  const { data: rows = [], isLoading } = useEscrows()
  const stats = escrowStats(rows)

  const hasData = rows.length > 0
  const first = rows[0]

  // Hero chart: last few escrows, blue = approvals, orange cap = dispute
  const chart = hasData
    ? rows.slice(-6).map((row) => ({
        height: 30 + (row.approvals / 2) * 40,
        dispute: row.status === 'dispute',
        settled: row.status === 'completed',
      }))
    : [
        { height: 42, dispute: false, settled: false },
        { height: 64, dispute: false, settled: false },
        { height: 80, dispute: false, settled: false },
        { height: 52, dispute: false, settled: false },
        { height: 72, dispute: false, settled: false },
      ]

  // Locked-vs-settled segmented bar
  const total = stats.active + stats.disputes + stats.completed
  const segments =
    total > 0
      ? [stats.active, stats.disputes, stats.completed]
      : [4, 2, 3]

  const features: Feature[] = [
    {
      icon: '⏵',
      title: 'Two-key release',
      copy: 'Buyer and seller both approve before a wei moves. Neither side can pull the funds alone — the contract only pays when 2 of 2 agree.',
      widget: (
        <div className="mt-6 space-y-3 rounded-2xl bg-[#f6f8fb] p-4">
          <WidgetRow
            icon="◉"
            label="Buyer"
            state={first ? (first.buyerApproved ? 'approved' : 'waiting') : 'approved'}
            tone={first ? (first.buyerApproved ? 'green' : 'muted') : 'green'}
          />
          <WidgetRow
            icon="◎"
            label="Seller"
            state={first ? (first.sellerApproved ? 'approved' : 'waiting') : 'waiting'}
            tone={first ? (first.sellerApproved ? 'green' : 'muted') : 'muted'}
          />
          <WidgetRow icon="⚖" label="Arbiter" state="on standby" tone="muted" />
        </div>
      ),
    },
    {
      icon: '⚖',
      title: 'Disputes with an arbiter',
      copy: 'Either side can pause the deal. The named arbiter then pays the seller or refunds the buyer — one decision, executed on-chain instantly.',
      widget: (
        <div className="mt-6 space-y-3 rounded-2xl bg-[#f6f8fb] p-4">
          <FeatureBar
            label="Active"
            value={hasData ? stats.active : 12}
            color="bg-brand-blue"
          />
          <FeatureBar
            label="Disputed"
            value={hasData ? stats.disputes : 3}
            color="bg-brand-orange"
          />
          <FeatureBar
            label="Released"
            value={hasData ? stats.completed : 41}
            color="bg-brand-green"
          />
        </div>
      ),
    },
    {
      icon: '✳',
      title: 'Fully on-chain',
      copy: 'Every escrow is its own contract, deployed from the factory with an event trail. No server holds the keys and no operator can touch the balance.',
      widget: (
        <div className="mt-6 divide-y divide-line rounded-2xl bg-[#f6f8fb] p-4 text-sm">
          <div className="flex items-center justify-between pb-3">
            <span className="text-ink-soft"> Custody </span>
            <span className="font-semibold text-ink">None</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-ink-soft"> Approval rule </span>
            <span className="font-semibold text-ink">2 of 2</span>
          </div>
          <div className="flex items-center justify-between pt-3">
            <span className="text-ink-soft"> Settlement </span>
            <span className="font-semibold text-brand-green">Instant</span>
          </div>
        </div>
      ),
    },
  ]

  // Mock panel on the "how" section — live rows when available, samples otherwise
  const panelRows =
    hasData
      ? rows.slice(-4).map((row, index) => ({
          ref: `#${rows.length - index}`,
          amount: `${formatEth(row.amount)} ETH`,
          parties: `${shortAddress(row.buyer)} → ${shortAddress(row.seller)}`,
          status: row.status === 'active' ? 'Needs you' : row.status === 'dispute' ? 'Dispute' : 'Released',
          tone:
            row.status === 'active'
              ? 'bg-brand-blue/10 text-brand-blue'
              : row.status === 'dispute'
                ? 'bg-brand-orange/10 text-brand-orange'
                : 'bg-brand-green/10 text-brand-green',
        }))
      : [
          {
            ref: '#3',
            amount: '0.50 ETH',
            parties: '0xF9c3…21 → 0xA10f…8B',
            status: 'Needs you',
            tone: 'bg-brand-blue/10 text-brand-blue',
          },
          {
            ref: '#2',
            amount: '1.20 ETH',
            parties: '0x7Bd2…4c → 0x33Ea…90',
            status: 'Dispute',
            tone: 'bg-brand-orange/10 text-brand-orange',
          },
          {
            ref: '#1',
            amount: '0.25 ETH',
            parties: '0xC41d…7e → 0x98Aa…f2',
            status: 'Released',
            tone: 'bg-brand-green/10 text-brand-green',
          },
        ]

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* ------------------------------ hero ------------------------------ */}
      <section className="relative overflow-hidden">
        <CloudSky className="absolute inset-0 h-full w-full" />
        <div className="relative z-10 mx-auto max-w-6xl px-6 pt-32 pb-24 md:pt-40">
          <Logo className="h-14 w-14" />
          <h1 className="mt-7 font-display text-[clamp(4rem,13vw,10rem)] leading-[0.88] font-extrabold tracking-[-0.045em] text-ink">
            Escrow
          </h1>
          <p className="mt-6 max-w-2xl text-lg font-semibold text-ink md:text-xl">
            A trustless escrow system staged on a cloudy sky.
          </p>

          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {/* registry card */}
            <div className="panel p-6">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-semibold text-ink-soft">
                  <span aria-hidden>◉</span> Escrow registry
                </span>
                <span className="badge-dark">Live</span>
              </div>
              <p className="mt-5 font-display text-6xl font-bold tracking-tight">
                {isLoading ? '…' : stats.created}
              </p>
              <p className="mt-1 text-sm text-ink-muted">escrows deployed through the factory</p>
              <div className="mt-5 flex items-center justify-between border-t border-line pt-4 text-xs">
                <span className="text-ink-muted">Network</span>
                <span className="font-semibold text-ink">
                  {activeChain.name} · {activeChain.id}
                </span>
              </div>
            </div>

            {/* locked value card */}
            <div className="panel p-6">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-semibold text-ink-soft">
                  <span aria-hidden>⛁</span> Locked in escrow
                </span>
                <span className="rounded-full bg-brand-green/10 px-2.5 py-1 text-[0.65rem] font-semibold text-brand-green">
                  ↑ on-chain
                </span>
              </div>
              <p className="mt-5 font-display text-5xl font-bold tracking-tight">
                {isLoading ? '…' : formatEth(stats.locked)}
                <span className="ml-1.5 text-2xl font-semibold text-ink-muted">ETH</span>
              </p>
              <p className="mt-1 text-sm text-ink-muted">live contract balances</p>
              <div className="mt-5 flex h-2 overflow-hidden rounded-full bg-surface-deep">
                <div className="bg-brand-blue" style={{ flexGrow: segments[0] }} />
                <div className="bg-brand-orange" style={{ flexGrow: segments[1] }} />
                <div className="bg-brand-green" style={{ flexGrow: segments[2] }} />
              </div>
            </div>

            {/* approvals chart card */}
            <div className="panel p-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-ink-soft">Approvals vs disputes</span>
                <span className="rounded-full bg-brand-green/10 px-2.5 py-1 text-[0.65rem] font-semibold text-brand-green">
                  ↑ live
                </span>
              </div>
              <div className="mt-5 flex h-28 items-end gap-2.5">
                {chart.map((bar, index) => (
                  <div key={index} className="flex h-full flex-1 flex-col justify-end">
                    {bar.dispute && <div className="mb-1 h-4 rounded-t-md bg-brand-orange" />}
                    <div
                      className={
                        bar.settled ? 'rounded-md bg-brand-green/70' : 'rounded-md bg-brand-blue'
                      }
                      style={{ height: `${bar.height}%` }}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-4 border-t border-line pt-3 text-[0.7rem] text-ink-muted">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-brand-blue" /> approvals
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-brand-orange" /> dispute
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------- features ---------------------------- */}
      <section id="features" className="scroll-mt-20 bg-surface py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
            Built for deals that would rather not rely on trust.
          </h2>
          <p className="mt-5 text-ink-muted">
            Three small surfaces, working together. None of them ask you to hold someone else’s
            keys — the contract is the absence of the middleman.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-6xl gap-6 px-6 md:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="panel flex flex-col p-7">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink text-lg text-white">
                {feature.icon}
              </span>
              <h3 className="mt-5 font-display text-lg font-bold">{feature.title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-ink-muted">{feature.copy}</p>
              <div className="mt-auto">{feature.widget}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------- split / how it works ------------------- */}
      <section id="how" className="scroll-mt-20 bg-surface-deep py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 md:grid-cols-2">
          <div>
            <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
              The money stops sitting in limbo.
            </h2>
            <p className="mt-5 leading-relaxed text-ink-muted">
              Deals settle themselves. Both sides approve, the ETH moves, and nobody has to ask
              “did you send it?”. No invoice. No bank wire. No 9pm panic.
            </p>

            <ul className="mt-8 space-y-5">
              <CheckItem
                title="Two keys, one release"
                body="Buyer and seller both approve before a wei leaves the contract."
              />
              <CheckItem
                title="Disputes pause everything"
                body="The arbiter pays the seller or refunds the buyer — and nothing else."
              />
              <CheckItem
                title="One contract per deal"
                body="Every escrow is deployed separately, with an event trail you can verify."
              />
            </ul>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link to="/app" className="btn-dark">
                Open dashboard →
              </Link>
              <a href="#features" className="btn-ghost">
                See the guarantees →
              </a>
            </div>
          </div>

          {/* mock product panel */}
          <div className="panel p-5 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="font-display text-base font-bold">Escrows</span>
                <span className="badge-dark">{panelRows.length} shown</span>
              </div>
              <span className="rounded-full border border-line bg-[#f7f9fb] px-3.5 py-1.5 text-xs text-ink-muted">
                ⌕ Filter threads
              </span>
            </div>

            <div className="mt-4 divide-y divide-line">
              {panelRows.map((row) => (
                <div key={row.ref} className="flex items-center gap-4 py-4">
                  <div className="w-14 shrink-0">
                    <p className="font-display text-sm font-bold text-ink">{row.amount}</p>
                    <p className="text-[0.65rem] text-ink-muted">{row.ref}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-xs text-ink-soft">{row.parties}</p>
                    <p className="mt-1 truncate text-xs text-ink-muted">
                      Both approvals required before release…
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[0.65rem] font-semibold ${row.tone}`}
                  >
                    {row.status}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-3 rounded-2xl bg-[#f6f8fb] p-4 text-xs text-ink-muted">
              {hasData
                ? 'Live rows from your local factory — open the dashboard to act on them.'
                : 'Sample rows — create your first escrow on the dashboard to make this list real.'}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
