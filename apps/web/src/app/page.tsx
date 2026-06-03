import Link from 'next/link';

export default function HomePage() {
  return (
    <div style={styles.container}>
      <div style={styles.hero}>
        <div style={styles.logo}>🫀</div>
        <h1 style={styles.title}>Executive Health Score</h1>
        <p style={styles.subtitle}>
          AI-powered health assessment for high-performance professionals.
          <br />
          Complete your intake, get your score, track your progress.
        </p>
        <div style={styles.actions}>
          <Link href="/auth/login">
            <button style={styles.primaryBtn}>Sign In</button>
          </Link>
          <Link href="/auth/register">
            <button style={styles.secondaryBtn}>Create Account</button>
          </Link>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg-primary)',
    padding: '20px',
  },
  hero: {
    textAlign: 'center',
    maxWidth: '520px',
  },
  logo: {
    fontSize: '64px',
    marginBottom: '16px',
  },
  title: {
    fontSize: '42px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: '12px',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '16px',
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
    marginBottom: '32px',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
  },
  primaryBtn: {
    background: 'var(--accent-light)',
    color: '#fff',
    border: 'none',
    padding: '12px 28px',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  secondaryBtn: {
    background: 'transparent',
    color: 'var(--text-primary)',
    border: '1px solid var(--border)',
    padding: '12px 28px',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
  },
};
