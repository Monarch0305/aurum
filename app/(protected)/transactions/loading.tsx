function S({ w = '100%', h = 14, r = 6 }: { w?: string | number; h?: number; r?: number }) {
  return (
    <div className="skeleton" style={{ width: w, height: h, borderRadius: r, flexShrink: 0 }} />
  )
}

export default function TransactionsLoading() {
  return (
    <div style={{ maxWidth: 1100, position: 'relative' }}>
      {/* Header — icon slab + title + badge */}
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
            <S w={150} h={20} />
            <S w={200} h={11} />
          </div>
        </div>
        <S w={90} h={28} r={20} />
      </div>

      {/* Table card */}
      <div
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '0.5px solid rgba(212,175,55,0.08)',
          borderTop: '1.5px solid rgba(212,175,55,0.14)',
          borderRadius: 16,
          padding: '20px 24px',
        }}
      >
        {/* Filter row */}
        <div
          style={{
            display: 'flex',
            gap: 10,
            marginBottom: 20,
            flexWrap: 'wrap',
          }}
        >
          <div
            className="skeleton"
            style={{ flex: 1, minWidth: 180, height: 36, borderRadius: 9 }}
          />
          <div className="skeleton" style={{ width: 140, height: 36, borderRadius: 9 }} />
          <div className="skeleton" style={{ width: 130, height: 36, borderRadius: 9 }} />
          <div className="skeleton" style={{ width: 130, height: 36, borderRadius: 9 }} />
        </div>

        {/* Table header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.6fr 1fr 1fr 0.7fr',
            gap: 12,
            paddingBottom: 10,
            borderBottom: '0.5px solid rgba(212,175,55,0.08)',
            marginBottom: 4,
          }}
        >
          <S w={60} h={9} />
          <S w={60} h={9} />
          <S w={50} h={9} />
          <S w={50} h={9} />
        </div>

        {/* Rows */}
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            style={{
              display: 'grid',
              gridTemplateColumns: '1.6fr 1fr 1fr 0.7fr',
              gap: 12,
              alignItems: 'center',
              paddingBlock: 11,
              borderBottom:
                i < 11 ? '0.5px solid rgba(212,175,55,0.05)' : 'none',
            }}
          >
            {/* Merchant cell */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                className="skeleton"
                style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0 }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <S w={Math.round(60 + (i * 17) % 60)} h={11} />
                <S w={Math.round(40 + (i * 11) % 30)} h={9} />
              </div>
            </div>
            {/* Category */}
            <S w={Math.round(50 + (i * 13) % 50)} h={20} r={10} />
            {/* Date */}
            <S w={70} h={10} />
            {/* Amount */}
            <S w={55} h={13} r={4} />
          </div>
        ))}

        {/* Pagination row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 18,
          }}
        >
          <S w={110} h={10} />
          <div style={{ display: 'flex', gap: 6 }}>
            <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 7 }} />
            <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 7 }} />
            <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 7 }} />
          </div>
        </div>
      </div>
    </div>
  )
}
