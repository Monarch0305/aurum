function S({ w = '100%', h = 14, r = 6 }: { w?: string | number; h?: number; r?: number }) {
  return (
    <div className="skeleton" style={{ width: w, height: h, borderRadius: r, flexShrink: 0 }} />
  )
}

function Card({
  children,
  style,
}: {
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '0.5px solid rgba(212,175,55,0.08)',
        borderTop: '1.5px solid rgba(212,175,55,0.14)',
        borderRadius: 16,
        padding: '20px 24px',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export default function AccountsLoading() {
  return (
    <div style={{ maxWidth: 1100, position: 'relative' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          marginBottom: 28,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            className="skeleton"
            style={{ width: 40, height: 40, borderRadius: 11, flexShrink: 0 }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <S w={110} h={20} />
            <S w={180} h={11} />
          </div>
        </div>
        {/* Sync button placeholder */}
        <div className="skeleton" style={{ width: 110, height: 34, borderRadius: 9 }} />
      </div>

      {/* Summary strip — total balance + count */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          marginBottom: 20,
        }}
      >
        <Card style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <S w={80} h={9} />
          <S w={140} h={28} />
          <S w={60} h={9} />
        </Card>
        <Card style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <S w={80} h={9} />
          <S w={50} h={28} />
          <S w={90} h={9} />
        </Card>
      </div>

      {/* Account cards grid — 3 col */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16,
        }}
      >
        {[
          { rows: 3, barWidth: '62%' },
          { rows: 4, barWidth: '45%' },
          { rows: 3, barWidth: '78%' },
        ].map(({ rows, barWidth }, ci) => (
          <Card
            key={ci}
            style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
          >
            {/* Card header: icon + name + type badge */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div
                className="skeleton"
                style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0 }}
              />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <S w="70%" h={12} />
                <S w={50} h={18} r={9} />
              </div>
            </div>

            {/* Balance */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <S w={60} h={9} />
              <S w={130} h={28} />
            </div>

            {/* Detail rows */}
            {Array.from({ length: rows }).map((_, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: 10,
                  borderTop: '0.5px solid rgba(212,175,55,0.06)',
                }}
              >
                <S w={70} h={9} />
                <S w={55} h={9} />
              </div>
            ))}

            {/* Utilization bar (credit cards) */}
            {ci === 1 && (
              <div style={{ marginTop: 2 }}>
                <div
                  style={{
                    height: 5,
                    borderRadius: 3,
                    background: 'rgba(212,175,55,0.06)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    className="skeleton"
                    style={{ height: '100%', width: barWidth, borderRadius: 3 }}
                  />
                </div>
              </div>
            )}
          </Card>
        ))}

        {/* "Connect another" dashed card */}
        <div
          style={{
            border: '1px dashed rgba(212,175,55,0.12)',
            borderRadius: 16,
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            minHeight: 160,
          }}
        >
          <div
            className="skeleton"
            style={{ width: 38, height: 38, borderRadius: 10 }}
          />
          <S w={120} h={10} />
          <S w={90} h={9} />
        </div>
      </div>
    </div>
  )
}
