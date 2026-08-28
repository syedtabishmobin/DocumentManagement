export function BrandMark({ className = "" }: { className?: string }) {
  return <svg className={`brand-symbol ${className}`.trim()} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
    <path d="M13 10h19c13 0 21 8 21 22s-8 22-21 22H13V10Z" fill="none" stroke="currentColor" strokeWidth="6" />
    <path d="M35 20v8M31 24h8" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    <path d="M24 21v22h8c7 0 11-4 11-11" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
  </svg>;
}

export function BrandName({ edition }: { edition?: string }) {
  return <span className="brand-name">Doculyra{edition ? <small>{edition}</small> : null}</span>;
}
