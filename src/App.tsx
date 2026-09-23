import { useMemo, useState } from 'react';
import { AomiMark } from './AomiMark';

type FlowKey = 'need' | 'quote' | 'authorize' | 'settle' | 'reconcile';

const flow: Array<{
  key: FlowKey;
  number: string;
  label: string;
  title: string;
  description: string;
  evidence: string[];
  onchain: boolean;
}> = [
  {
    key: 'need', number: '01', label: 'Observe', title: 'Explain the currency need',
    description: 'Connect the business obligation to current token balances and surface the exact funding gap.',
    evidence: ['Obligation reference', 'Wallet and venue balances', 'Required currency position'], onchain: false,
  },
  {
    key: 'quote', number: '02', label: 'Reason', title: 'Compare executable routes',
    description: 'Request and compare quotes using price, available size, expiry, counterparty eligibility, and settlement terms.',
    evidence: ['RFQ response set', 'Selection rationale', 'Counterparty eligibility'], onchain: false,
  },
  {
    key: 'authorize', number: '03', label: 'Constrain', title: 'Prove the mandate',
    description: 'Evaluate the intended trade against limits, policies, approvals, and the institution’s existing signing controls.',
    evidence: ['Policy evaluation', 'Approval package', 'Exact funding authorization'], onchain: false,
  },
  {
    key: 'settle', number: '04', label: 'Execute', title: 'Watch both legs settle',
    description: 'Track the accepted trade, taker funding, maker funding, and atomic payment-versus-payment settlement on Arc.',
    evidence: ['Accepted trade record', 'Funding transactions', 'Arc settlement transaction'], onchain: true,
  },
  {
    key: 'reconcile', number: '05', label: 'Verify', title: 'Reconcile the final state',
    description: 'Verify resulting token balances against the intended outcome and attach the receipt to the original obligation.',
    evidence: ['Final balances', 'Transaction receipt', 'Exception and accounting record'], onchain: true,
  },
];

const harness = [
  ['Observe', 'Balances, obligations, venue state'],
  ['Explain', 'What changed and why it matters'],
  ['Reason', 'Routes, quotes, and trade-offs'],
  ['Constrain', 'Mandates, approvals, and limits'],
  ['Simulate', 'Expected effects before signing'],
  ['Prepare', 'Reviewable intent and evidence'],
  ['Execute', 'Authorized control-plane handoff'],
  ['Verify', 'Receipts and resulting state'],
];

const participants = [
  ['Treasury operator', 'Owns the obligation, liquidity position, and operational decision.'],
  ['Compliance & risk', 'Defines eligible corridors, counterparties, and approval conditions.'],
  ['Authorized signer', 'Retains final control of transaction and funding authorization.'],
  ['StableFX makers', 'Quote supported stablecoin pairs and fund the maker leg.'],
  ['StableFX on Arc', 'Records the accepted trade and atomically settles both token legs.'],
  ['Finance & accounting', 'Reconciles settlement evidence to the originating obligation.'],
];

function SectionHeading({ number, eyebrow, title, children }: { number: string; eyebrow: string; title: string; children: string }) {
  return <div className="section-heading">
    <div><span className="caption">{number} / {eyebrow}</span><h2>{title}</h2></div>
    <p>{children}</p>
  </div>;
}

function SettlementGraphic() {
  return <svg className="settlement-graphic" viewBox="0 0 720 410" role="img" aria-label="Illustrative USDC to EURC stablecoin conversion through StableFX on Arc">
    <defs>
      <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 10 5 0 10Z" fill="currentColor" /></marker>
    </defs>
    <text x="28" y="30" className="svg-caption">ILLUSTRATIVE OPERATION / NO LIVE QUOTE</text>
    <g className="graphic-node node-paper">
      <rect x="28" y="63" width="180" height="104" />
      <text x="48" y="90" className="node-kicker">REQUIRED POSITION</text>
      <text x="48" y="124" className="node-value">€500,000</text>
      <text x="48" y="149" className="node-note">Supplier obligation · T+0</text>
    </g>
    <g className="graphic-node node-paper">
      <rect x="28" y="231" width="180" height="104" />
      <text x="48" y="258" className="node-kicker">CURRENT BALANCE</text>
      <text x="48" y="292" className="node-value">$760,000</text>
      <text x="48" y="317" className="node-note">USDC · Arc wallet</text>
    </g>
    <path d="M208 115C270 115 270 190 318 190" className="connector muted" markerEnd="url(#arrow)" />
    <path d="M208 283C270 283 270 220 318 220" className="connector muted" markerEnd="url(#arrow)" />
    <g className="graphic-node node-peach">
      <rect x="318" y="149" width="160" height="122" />
      <text x="338" y="177" className="node-kicker">FUNDING GAP</text>
      <text x="338" y="211" className="node-value">USDC → EURC</text>
      <text x="338" y="237" className="node-note">Policy + quote review</text>
      <text x="338" y="255" className="node-note">Approval required</text>
    </g>
    <path d="M478 210H534" className="connector" markerEnd="url(#arrow)" />
    <g className="graphic-node node-blue">
      <rect x="534" y="126" width="158" height="168" />
      <text x="554" y="154" className="node-kicker">ARC / STABLEFX</text>
      <text x="554" y="188" className="node-value">Atomic PvP</text>
      <circle cx="569" cy="222" r="6" /><text x="585" y="227" className="node-note">Taker funded</text>
      <circle cx="569" cy="250" r="6" /><text x="585" y="255" className="node-note">Maker funded</text>
      <text x="554" y="278" className="node-status">SETTLEMENT CORE · ONCHAIN</text>
    </g>
    <path d="M613 294V347H398" className="connector onchain" markerEnd="url(#arrow)" />
    <text x="398" y="373" textAnchor="middle" className="node-kicker">RESULTING BALANCE + RECEIPT</text>
    <text x="398" y="396" textAnchor="middle" className="node-note">Verified against the approved intent</text>
  </svg>;
}

function OperationPanel() {
  const [active, setActive] = useState<FlowKey>('settle');
  const item = flow.find((entry) => entry.key === active)!;
  return <div className="operation-panel">
    <div className="flow-tabs" role="tablist" aria-label="Currency operation lifecycle">
      {flow.map((entry) => <button key={entry.key} role="tab" aria-selected={active === entry.key} onClick={() => setActive(entry.key)}>
        <span>{entry.number}</span><b>{entry.label}</b>{entry.onchain && <i>ONCHAIN</i>}
      </button>)}
    </div>
    <div className="operation-detail" role="tabpanel">
      <div className="detail-copy">
        <span className="caption">{item.onchain ? 'PUBLIC CHAIN EVIDENCE' : 'CONTROL-PLANE CONTEXT'}</span>
        <h3>{item.title}</h3>
        <p>{item.description}</p>
        <div className="evidence-list">{item.evidence.map((evidence) => <span key={evidence}>+ {evidence}</span>)}</div>
      </div>
      <div className={`evidence-card ${item.onchain ? 'evidence-onchain' : ''}`}>
        <div className="evidence-card-head"><span>{item.number} / {item.label.toUpperCase()}</span><span>{item.onchain ? 'CHAIN-VERIFIABLE' : 'SOURCE-BACKED'}</span></div>
        <div className="evidence-card-body">
          <span className="micro-label">OPERATION ID</span><code>fx_7d4…e91</code>
          <div className="evidence-grid">
            <div><span>Status</span><b>{active === 'settle' ? 'Completed' : active === 'reconcile' ? 'Matched' : 'Prepared'}</b></div>
            <div><span>Authority</span><b>{item.onchain ? 'Arc receipt' : 'Institutional policy'}</b></div>
            <div><span>Input</span><b>{item.evidence[0]}</b></div>
            <div><span>Output</span><b>{item.evidence[2]}</b></div>
          </div>
        </div>
        <div className="evidence-card-foot">Illustrative record · not a live StableFX transaction</div>
      </div>
    </div>
  </div>;
}

function RelationshipMap() {
  const [mode, setMode] = useState<'operations' | 'control'>('operations');
  const [focus, setFocus] = useState('all');
  const labels = useMemo(() => mode === 'operations'
    ? {
        left: ['Treasury operator', 'Payments platform', 'Stablecoin issuer', 'Compliance & risk'],
        middle: ['Steward FX', 'StableFX / Arc', 'Wallet / custodian'],
        right: ['Quote & route', 'Approval package', 'PvP settlement', 'Reconciled obligation'],
      }
    : {
        left: ['Treasury mandate', 'Counterparty policy', 'Approval workflow', 'Accounting policy'],
        middle: ['Steward harness', 'Institutional signer', 'StableFX contracts'],
        right: ['Observe + reason', 'Constrain + prepare', 'Authorize + fund', 'Verify + reconcile'],
      }, [mode]);

  const dim = (key: string) => focus !== 'all' && focus !== key;
  return <div className="relationship-map">
    <div className="map-toolbar">
      <div className="map-switch" role="group" aria-label="Map mode">
        <button aria-pressed={mode === 'operations'} onClick={() => setMode('operations')}>Operating relationships</button>
        <button aria-pressed={mode === 'control'} onClick={() => setMode('control')}>Capital & control</button>
      </div>
      <label>Focus
        <select value={focus} onChange={(event) => setFocus(event.target.value)}>
          <option value="all">All parties</option>
          <option value="steward">Steward FX</option>
          <option value="stablefx">StableFX / Arc</option>
          <option value="institution">Institutional control</option>
        </select>
      </label>
    </div>
    <div className="map-canvas">
      <div className="map-column map-left"><span className="map-title">UPSTREAM / INTENT</span>{labels.left.map((label, i) => <div className={`map-label ${dim(i < 2 ? 'institution' : i === 2 ? 'stablefx' : 'institution') ? 'dim' : ''}`} key={label}>{label}</div>)}</div>
      <svg viewBox="0 0 900 520" preserveAspectRatio="none" aria-hidden="true">
        <path d="M10 105 C180 105 180 110 330 110 S540 100 610 100 S760 85 890 85" className={dim('steward') ? 'ribbon dim' : 'ribbon blue'} />
        <path d="M10 205 C170 205 175 160 330 150 S525 170 610 180 S760 195 890 205" className={dim('steward') ? 'ribbon dim' : 'ribbon lime'} />
        <path d="M10 305 C170 305 180 250 330 230 S510 265 610 280 S760 320 890 325" className={dim('stablefx') ? 'ribbon dim' : 'ribbon peach'} />
        <path d="M10 410 C170 410 185 355 330 340 S520 355 610 380 S760 430 890 445" className={dim('institution') ? 'ribbon dim' : 'ribbon grey'} />
        <path d="M10 108 C170 115 175 290 330 290 S520 105 610 105 S760 86 890 86" className={dim('stablefx') ? 'ribbon dim' : 'ribbon thin blue'} />
      </svg>
      <div className="map-column map-middle"><span className="map-title">OPERATING LAYER</span>{labels.middle.map((label, i) => <div className={`map-label middle ${dim(i === 0 ? 'steward' : i === 1 ? 'stablefx' : 'institution') ? 'dim' : ''}`} key={label}>{label}</div>)}</div>
      <div className="map-column map-right"><span className="map-title">DOWNSTREAM / EVIDENCE</span>{labels.right.map((label, i) => <div className={`map-label right ${dim(i === 2 ? 'stablefx' : i === 1 ? 'institution' : 'steward') ? 'dim' : ''}`} key={label}>{label}</div>)}</div>
    </div>
    <p className="map-note">Relationship map, not transaction volume. StableFX counterparties and pair availability remain subject to Circle onboarding and access.</p>
  </div>;
}

function ContactLink({ dark = false }: { dark?: boolean }) {
  const body = encodeURIComponent('Organization:\n\nCurrency operation or corridor:\n\nCurrent control plane / signing setup:\n\nWhat would you like to evaluate?\n');
  return <a className={`button ${dark ? 'button-dark' : ''}`} href={`mailto:contact@aomi.dev?subject=${encodeURIComponent('Steward FX — design partner inquiry')}&body=${body}`}>Discuss an operation <span>↗</span></a>;
}

export function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  return <div className="site" id="top">
    <a href="#operation" className="skip-link">Skip to operation</a>
    <header className="header">
      <a className="brand" href="#top"><AomiMark size={24} /><span>steward <em>fx</em></span><small>BY AOMI LABS</small></a>
      <button className="menu-button" aria-label="Toggle navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>☰</button>
      <nav className={menuOpen ? 'nav nav-open' : 'nav'} aria-label="Main navigation">
        <a href="#operation" onClick={() => setMenuOpen(false)}>Operation</a>
        <a href="#onchain" onClick={() => setMenuOpen(false)}>Onchain core</a>
        <a href="#ecosystem" onClick={() => setMenuOpen(false)}>Ecosystem</a>
        <a href="#harness" onClick={() => setMenuOpen(false)}>Steward harness</a>
      </nav>
      <ContactLink />
    </header>

    <main>
      <section className="hero wrap">
        <div className="hero-copy">
          <span className="caption live"><i /> ONCHAIN CURRENCY OPERATIONS</span>
          <h1>Clarity and control for <em>onchain currency operations.</em></h1>
          <p>Steward FX traces every stablecoin conversion from exposure and intent to signed authorization, atomic settlement, and reconciled final state.</p>
          <p className="assurance">Your institution retains custody, compliance, counterparty choice, approval, and signing authority.</p>
          <div className="hero-actions"><ContactLink dark /><a className="text-link" href="#operation">Trace the operation <span>↓</span></a></div>
        </div>
        <div className="hero-visual">
          <div className="visual-head"><span className="caption">ONE OPERATION / EVERY LEG</span><span className="status">STABLEFX ACCESS REQUESTED</span></div>
          <SettlementGraphic />
          <div className="visual-foot"><span>Source-backed context</span><span>Institutional authority</span><span>Onchain settlement evidence</span></div>
        </div>
      </section>

      <div className="principles wrap"><span>Built for treasury and liquidity operators</span><span>Explainable route selection</span><span>Mandate-controlled signing</span><span>Chain-verified settlement</span></div>

      <section className="section wrap" id="operation">
        <SectionHeading number="01" eyebrow="THE OPERATION" title="One currency need. A complete decision record.">Move from business obligation to settled tokens without losing the context, authority, or evidence between systems.</SectionHeading>
        <OperationPanel />
      </section>

      <section className="section wrap" id="onchain">
        <SectionHeading number="02" eyebrow="ONCHAIN CORE" title="StableFX settles the trade. Steward explains the operation.">The settlement core can be public and atomic without pretending the entire institutional workflow lives onchain.</SectionHeading>
        <div className="boundary">
          <div className="boundary-head"><h3>Context & control plane</h3><h3>Onchain evidence</h3></div>
          <div className="boundary-row"><span><small>WHY</small>Obligation, target currency, timing, and funding need<i>OFFCHAIN</i></span><span><small>TRADE</small>Accepted trade terms and lifecycle state<i>ONCHAIN</i></span></div>
          <div className="boundary-row"><span><small>WHO</small>Eligible counterparties, compliance, and approvals<i>OFFCHAIN</i></span><span><small>FUNDS</small>Taker funding and maker funding transactions<i>ONCHAIN</i></span></div>
          <div className="boundary-row"><span><small>HOW</small>Quote comparison, mandate checks, and signing policy<i>OFFCHAIN</i></span><span><small>RESULT</small>Atomic PvP settlement, token movements, and receipt<i>ONCHAIN</i></span></div>
          <div className="boundary-strip"><b>Steward connects both sides</b><span>Observe → explain → reason → constrain → simulate → prepare → execute → verify</span></div>
        </div>
      </section>

      <section className="section full-section" id="ecosystem">
        <div className="wrap"><SectionHeading number="03" eyebrow="ECOSYSTEM" title="Upstream intent. Downstream proof.">See each party’s role without collapsing the issuer, venue, signer, and operator into a single black box.</SectionHeading><RelationshipMap /></div>
      </section>

      <section className="section wrap" id="harness">
        <SectionHeading number="04" eyebrow="THE STEWARD HARNESS" title="The same base discipline, applied to FX.">AI can prepare and automate the work while the institution’s policies, approvals, and signing systems remain authoritative.</SectionHeading>
        <div className="harness-grid">{harness.map(([name, detail], index) => <div className="harness-step" key={name}><span>{String(index + 1).padStart(2, '0')}</span><b>{name}</b><p>{detail}</p></div>)}</div>
        <div className="legacy-band"><span className="caption">INTEGRATION BOUNDARY</span><h3>Onchain money legos.<br />Legacy control plane.</h3><p>Steward is designed to connect wallets, custody, approval systems, compliance policy, accounting, and chain execution—without claiming authority those systems retain.</p><div><span>Wallet / custodian</span><span>Policy engine</span><span>Approval workflow</span><span>Institutional signer</span><span>ERP / ledger</span></div></div>
      </section>

      <section className="section wrap" id="participants">
        <SectionHeading number="05" eyebrow="WHO USES IT" title="An operating surface for the people between intent and settlement.">Steward FX is designed around treasury and liquidity operations, with every control owner visible.</SectionHeading>
        <div className="participant-grid">{participants.map(([name, detail], index) => <article key={name}><span>{String(index + 1).padStart(2, '0')}</span><h3>{name}</h3><p>{detail}</p></article>)}</div>
      </section>

      <section className="section steward-line wrap">
        <div className="steward-mark"><AomiMark size={76} /><span>steward</span><small>BY AOMI LABS</small></div>
        <div><span className="caption">STEWARDSHIP ACROSS ONCHAIN FINANCE</span><h2>Steward is Steward.</h2><p>Steward makes complex onchain financial operations legible, governable, and automatable. Steward FX is one expression of that foundation: the currency operation is the object, but the discipline is the same.</p><div className="inline-links"><a href="https://steward-aomi-labs.vercel.app" target="_blank" rel="noreferrer">Explore Steward ↗</a><a href="https://aomi.dev" target="_blank" rel="noreferrer">Aomi Labs ↗</a></div></div>
      </section>

      <section className="invitation wrap"><span className="caption">DESIGN PARTNERS</span><h2>Bring one real<br /><em>currency operation.</em></h2><div><p>Evaluate Steward FX against your stablecoin balances, corridor needs, approval process, and signing controls.</p><ContactLink dark /></div></section>
    </main>

    <footer className="footer"><a className="brand" href="#top"><AomiMark size={22} /><span>steward <em>fx</em></span></a><p>Illustrative product concept. StableFX access requested; no Circle endorsement or live integration is represented.</p><div><a href="https://github.com/aomi-labs/stewardfx" target="_blank" rel="noreferrer">GitHub</a><a href="mailto:contact@aomi.dev">Contact</a><a href="https://aomi.dev/privacy">Privacy</a></div></footer>
  </div>;
}
