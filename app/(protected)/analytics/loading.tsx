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

export default function AnalyticsLoading() {
  return (
    <div style={{ maxWidth: 1180, position: 'relative' }}>
      {/* Header */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}
      >
        <div
          className="skeleton"
          style={{ width: 40, height: 40, borderRadius: 11, flexShrink: 0 }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <S w={120} h={20} />
          <S w={200} h={11} />
        </div>
      </div>

      {/* 4 KPI cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 14,
          marginBottom: 16,
        }}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <S w={85} h={9} />
              <S w={110} h={24} />
              <S w={65} h={9} />
            </div>
          </Card>
        ))}
      </div>

      {/* Line chart — full width */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <S w={150} h={12} />
          <div style={{ display: 'flex', gap: 14 }}>
            <S w={60} h={10} />
            <S w={60} h={10} />
          </div>
        </div>
        {/* Chart lines (SVG-like representation) */}
        <div style={{ height: 200, position: 'relative', overflow: 'hidden' }}>
          {/* Y-axis labels */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: 50,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              paddingBottom: 24,
            }}
          >
            {Array.from({ length: 5 }).map((_, i) => (
              <S key={i} w={35} h={8} />
            ))}
          </div>
          {/* Chart area */}
          <div
            style={{
              marginLeft: 58,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            {/* Grid lines */}
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                style={{
                  height: 1,
                  background: 'rgba(212,175,55,0.05)',
                  width: '100%',
                }}
              />
            ))}
          </div>
          {/* X-axis labels */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 58,
              right: 0,
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <S key={i} w={28} h={8} />
            ))}
          </div>
        </div>
      </Card>

      {/* Grouped bar + Donut — side by side */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.4fr 1fr',
          gap: 14,
          marginBottom: 16,
        }}
      >
        {/* Grouped bar chart */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
            <S w={140} h={12} />
            <div style={{ display: 'flex', gap: 10 }}>
              <S w={50} h={10} />
              <S w={50} h={10} />
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: 12,
              height: 150,
            }}
          >
            {[70, 50, 85, 60, 75, 45].map((pct, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: 3,
                  height: '100%',
                }}
              >
                <div
                  className="skeleton"
                  style={{ flex: 1, height: `${pct}%`, borderRadius: '3px 3px 0 0' }}
                />
                <div
                  className="skeleton"
                  style={{
                    flex: 1,
                    height: `${Math.round(pct * 0.65)}%`,
                    borderRadius: '3px 3px 0 0',
                    opacity: 0.6,
                  }}
                />
              </div>
            ))}
          </div>
        </Card>

        {/* Donut chart */}
        <Card>
          <S w={110} h={12} style={{ marginBottom: 20 }} />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 20,
            }}
          >
            {/* Donut placeholder */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div
                className="skeleton"
                style={{ width: 110, height: 110, borderRadius: '50%' }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 22,
                  borderRadius: '50%',
                  background: '#09090d',
                }}
              />
            </div>
            {/* Legend */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    className="skeleton"
                    style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0 }}
                  />
                  <S w="55%" h={9} />
                  <S w={35} h={9} />
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Trend strip — 3 cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 14,
        }}
      >
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <S w={60} h={9} />
              <S w="80%" h={14} />
              <S w="95%" h={9} />
              <S w={55} h={22} r={11} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
