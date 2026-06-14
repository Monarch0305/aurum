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
        padding: '24px 28px',
        marginBottom: 16,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

function Divider() {
  return (
    <div
      style={{
        height: 1,
        background: 'rgba(212,175,55,0.06)',
        marginBlock: 16,
      }}
    />
  )
}

export default function SettingsLoading() {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      {/* Page header */}
      <div style={{ marginBottom: 28, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <S w={120} h={22} />
        <S w={260} h={11} />
      </div>

      {/* Profile card */}
      <Card>
        <S w={80} h={9} r={3} style={{ marginBottom: 20 }} />
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, marginBottom: 18 }}>
          <div
            className="skeleton"
            style={{ width: 52, height: 52, borderRadius: '50%', flexShrink: 0 }}
          />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
            <S w={80} h={9} />
            <S w="100%" h={38} r={8} />
          </div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <S w={80} h={9} r={3} style={{ marginBottom: 7 }} />
          <S w="100%" h={38} r={8} />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <S w={100} h={34} r={8} />
          <S w={130} h={34} r={8} />
        </div>
      </Card>

      {/* Preferences card */}
      <Card>
        <S w={90} h={9} r={3} style={{ marginBottom: 20 }} />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '16px 20px',
            marginBottom: 18,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <S w={65} h={9} />
            <S w="100%" h={38} r={8} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <S w={130} h={9} />
            <S w="100%" h={38} r={8} />
          </div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <S w={80} h={9} r={3} style={{ marginBottom: 8 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <S w={110} h={36} r={8} />
            <S w={110} h={36} r={8} />
          </div>
        </div>
        <S w={130} h={34} r={8} />
      </Card>

      {/* Notifications card */}
      <Card>
        <S w={100} h={9} r={3} style={{ marginBottom: 8 }} />
        <S w={280} h={9} r={3} style={{ marginBottom: 20 }} />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i}>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 20,
              }}
            >
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <S w="45%" h={12} />
                <S w="85%" h={9} />
              </div>
              {/* Toggle placeholder */}
              <div
                className="skeleton"
                style={{ width: 40, height: 22, borderRadius: 11, flexShrink: 0, marginTop: 2 }}
              />
            </div>
            {i < 2 && <Divider />}
          </div>
        ))}
        <div style={{ marginTop: 20 }}>
          <S w={140} h={34} r={8} />
        </div>
      </Card>

      {/* Connected accounts card */}
      <Card>
        <S w={140} h={9} r={3} style={{ marginBottom: 20 }} />
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <div
                className="skeleton"
                style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0 }}
              />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <S w="50%" h={12} />
                <S w="35%" h={9} />
              </div>
              <S w={90} h={30} r={7} />
            </div>
            {i < 1 && <Divider />}
          </div>
        ))}
      </Card>

      {/* Data card */}
      <Card style={{ marginBottom: 0 }}>
        <S w={40} h={9} r={3} style={{ marginBottom: 20 }} />
        {/* Export row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 20,
          }}
        >
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <S w="45%" h={12} />
            <S w="70%" h={9} />
          </div>
          <S w={100} h={34} r={8} />
        </div>
        <Divider />
        {/* Delete row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 20,
          }}
        >
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <S w="40%" h={12} />
            <S w="80%" h={9} />
          </div>
          <S w={120} h={34} r={8} />
        </div>
      </Card>
    </div>
  )
}
