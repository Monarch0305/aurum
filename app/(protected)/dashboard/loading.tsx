// Skeleton shown while dashboard server data loads.
// Matches the exact grid layout of dashboard/page.tsx.

function S({ w = '100%', h = 14, r = 6 }: { w?: string | number; h?: number; r?: number }) {
  return (
    <div
      className="skeleton"
      style={{ width: w, height: h, borderRadius: r, flexShrink: 0 }}
    />
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

function KpiSkeleton() {
  return (
    <Card>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 18,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
          <S w={90} h={10} />
          <S w={130} h={26} />
        </div>
        <div
          className="skeleton"
          style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0 }}
        />
      </div>
      <S w={70} h={10} />
    </Card>
  )
}

export default function DashboardLoading() {
  return (
    <div style={{ maxWidth: 1180, position: 'relative' }}>
      {/* Header */}
      <div style={{ marginBottom: 28, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <S w={220} h={22} />
        <S w={140} h={12} />
      </div>

      {/* KPI row — 3 cols */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16,
          marginBottom: 16,
        }}
      >
        <KpiSkeleton />
        <KpiSkeleton />
        <KpiSkeleton />
      </div>

      {/* Chart + Categories — 2fr 1fr */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: 16,
          marginBottom: 16,
          alignItems: 'stretch',
        }}
      >
        {/* Spending chart card */}
        <Card style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <S w={120} h={12} />
            <div style={{ display: 'flex', gap: 6 }}>
              <S w={36} h={24} r={8} />
              <S w={52} h={24} r={8} />
              <S w={36} h={24} r={8} />
            </div>
          </div>
          {/* Chart bars */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: 10,
              height: 160,
              paddingTop: 8,
            }}
          >
            {[65, 40, 80, 55, 70, 45, 90].map((pct, i) => (
              <div
                key={i}
                className="skeleton"
                style={{
                  flex: 1,
                  height: `${pct}%`,
                  borderRadius: '4px 4px 0 0',
                }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
              <S key={d} w={24} h={8} />
            ))}
          </div>
        </Card>

        {/* Category breakdown */}
        <Card style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <S w={110} h={12} />
          {[85, 65, 50, 40, 30, 22].map((pct, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <S w={80} h={10} />
                <S w={40} h={10} />
              </div>
              <div
                style={{
                  height: 4,
                  borderRadius: 2,
                  background: 'rgba(212,175,55,0.06)',
                  overflow: 'hidden',
                }}
              >
                <div
                  className="skeleton"
                  style={{ height: '100%', width: `${pct}%`, borderRadius: 2 }}
                />
              </div>
            </div>
          ))}
        </Card>
      </div>

      {/* Transactions + AI Widget — 2fr 1fr */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: 16,
          alignItems: 'stretch',
        }}
      >
        {/* Transaction list */}
        <Card style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <S w={130} h={12} />
            <S w={60} h={10} />
          </div>
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                paddingBlock: 10,
                borderBottom: i < 7 ? '0.5px solid rgba(212,175,55,0.05)' : 'none',
              }}
            >
              <div className="skeleton" style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <S w="55%" h={11} />
                <S w="35%" h={9} />
              </div>
              <S w={60} h={12} r={4} />
            </div>
          ))}
        </Card>

        {/* AI widget */}
        <Card style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div className="skeleton" style={{ width: 28, height: 28, borderRadius: 8 }} />
            <S w={80} h={12} />
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              style={{
                padding: '12px 14px',
                borderRadius: 10,
                background: 'rgba(212,175,55,0.03)',
                border: '0.5px solid rgba(212,175,55,0.07)',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <S w="70%" h={11} />
              <S w="90%" h={9} />
            </div>
          ))}
          <div
            className="skeleton"
            style={{ height: 36, borderRadius: 9, marginTop: 4 }}
          />
        </Card>
      </div>
    </div>
  )
}
