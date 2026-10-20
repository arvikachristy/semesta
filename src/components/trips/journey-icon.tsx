interface IJourneyIconProps {
  kind: 'stay' | 'travel' | 'transfer';
}
export const JourneyIcon = ({ kind }: IJourneyIconProps) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {kind === 'stay' ? (
      <>
        <path d="M3 5v15M21 12v8M3 16h18M3 12h18v4M8 12V8h10a3 3 0 0 1 3 3v1" />
        <path d="M3 8h3v4H3" />
      </>
    ) : kind === 'transfer' ? (
      <>
        <path d="m5 9 2-5h10l2 5M4 16V9h16v7ZM6 16v4M18 16v4M7 12h1M16 12h1" />
      </>
    ) : (
      <path d="m22 2-7 1-4 6-7-2-2 2 7 4-3 5-3-1-1 2 5 3 3-5 4 7 2-2-2-7 6-4 2-7Z" />
    )}
  </svg>
);
