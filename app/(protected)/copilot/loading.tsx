function S({ w = '100%', h = 14, r = 6 }: { w?: string | number; h?: number; r?: number }) {
  return (
    <div className="skeleton" style={{ width: w, height: h, borderRadius: r, flexShrink: 0 }} />
  )
}

// Suggested prompt chip skeleton
function ChipSk({ w }: { w: number }) {
  return (
    <div
      className="skeleton"
      style={{
        width: w,
        height: 36,
        borderRadius: 10,
        flexShrink: 0,
      }}
    />
  )
}

export default function CopilotLoading() {
  return (
    <div
      style={{
        display: 'flex',
        gap: 0,
        height: 'calc(100vh - 64px)',
        marginInline: -36,   // bleed to edge of main padding
        marginTop: -32,
        overflow: 'hidden',
      }}
    >
      {/* ── Left: thread sidebar ───────────────────────────────────────────── */}
      <div
        style={{
          width: 260,
          flexShrink: 0,
          borderRight: '0.5px solid rgba(212,175,55,0.08)',
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          overflowY: 'auto',
        }}
      >
        {/* New chat button */}
        <div
          className="skeleton"
          style={{ height: 36, borderRadius: 9, marginBottom: 14 }}
        />

        {/* "Recent" label */}
        <S w={60} h={9} r={4} />

        {/* Thread items */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            style={{
              padding: '10px 12px',
              borderRadius: 9,
              background: i === 0 ? 'rgba(212,175,55,0.06)' : 'transparent',
              border: i === 0 ? '0.5px solid rgba(212,175,55,0.1)' : 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <S w="75%" h={11} />
            <S w="55%" h={9} />
          </div>
        ))}
      </div>

      {/* ── Right: main chat area ──────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 32px',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 32,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              className="skeleton"
              style={{ width: 32, height: 32, borderRadius: 9 }}
            />
            <S w={100} h={14} />
          </div>
          <S w={140} h={10} />
        </div>

        {/* Welcome text */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: 32,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div
            className="skeleton"
            style={{ width: 56, height: 56, borderRadius: 16 }}
          />
          <S w={200} h={18} />
          <S w={280} h={11} />
        </div>

        {/* Suggested prompt chips — 2×2 grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 10,
            marginBottom: 'auto',
          }}
        >
          {[190, 160, 200, 170].map((w, i) => (
            <div
              key={i}
              style={{
                padding: '12px 16px',
                borderRadius: 12,
                background: 'rgba(255,255,255,0.02)',
                border: '0.5px solid rgba(212,175,55,0.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: 7,
              }}
            >
              <S w="65%" h={11} />
              <S w="85%" h={9} />
            </div>
          ))}
        </div>

        {/* Input area at bottom */}
        <div style={{ marginTop: 24 }}>
          {/* Status bar */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
            <S w={120} h={9} />
            <S w={80} h={9} />
          </div>
          <div
            className="skeleton"
            style={{ width: '100%', height: 52, borderRadius: 12 }}
          />
        </div>
      </div>
    </div>
  )
}
