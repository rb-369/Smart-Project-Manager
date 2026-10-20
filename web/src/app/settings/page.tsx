'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { GitHubStatus, MongoDBStatus } from '@/types';
import { Navbar } from '@/components/Navbar';
import { AppShell, PageContainer, PageHeader } from '@/components/AppShell';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { TextField } from '@/components/ui/Field';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  GitBranch,
  ExternalLink,
  Database,
  Users,
  RefreshCw,
  Lock,
} from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated, sessionError } = useAuth();

  const [token, setToken] = useState('');
  const [status, setStatus] = useState<GitHubStatus | null>(null);
  const [mongoStatus, setMongoStatus] = useState<MongoDBStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [mongoLoading, setMongoLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Route protection
  useEffect(() => {
    if (!authLoading && !isAuthenticated && !sessionError) {
      router.push('/login?next=/settings');
    }
  }, [authLoading, isAuthenticated, sessionError, router]);

  const fetchStatus = async () => {
    if (!api.isAuthenticated()) return;
    try {
      const res: any = await api.get('/github/status');
      setStatus(res);
    } catch (err: any) {
      console.warn('Unable to load github status from backend:', err?.message || err);
      setStatus({
        is_connected: false,
        github_username: undefined,
        total_projects_synced: 0,
        needs_review_count: 0,
      });
    }
  };

  const fetchMongoStatus = async () => {
    try {
      setMongoLoading(true);
      const res: any = await api.get('/mongodb/status');
      setMongoStatus(res);
    } catch (err: any) {
      console.warn('Unable to load mongodb status:', err?.message || err);
      setMongoStatus({
        configured: false,
        connected: false,
        message: 'Backend connection check failed',
        database: 'devcommand',
      });
    } finally {
      setMongoLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchStatus();
      fetchMongoStatus();
    }
  }, [isAuthenticated, user]);

  const handleSaveToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      await api.post('/github/token', { token: token.trim() });
      setMessage('GitHub personal access token encrypted and saved.');
      setToken('');
      fetchStatus();
    } catch (err: any) {
      setError(err.message || 'Failed to save token');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <Navbar />

      <PageContainer className="max-w-4xl space-y-6">
        <PageHeader
          eyebrow={
            <span className="font-mono text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-brand-lime-300">
              Zero-leak credential &amp; cloud vault
            </span>
          }
          title="Settings &amp; integrations"
          description="Configure MongoDB Atlas persistence, encrypted GitHub tokens, and tenant isolation policies."
          actions={
            <>
              <Badge tone={mongoStatus?.connected ? 'emerald' : 'amber'} size="sm">
                {mongoStatus?.connected ? 'Atlas connected' : 'MongoDB ready'}
              </Badge>
              <Badge tone="blue" size="sm">
                AES-256 GCM
              </Badge>
            </>
          }
        />

        {/* Storage */}
        <section className="surface-card rounded-3xl p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-4 border-b border-ink-200/80 pb-5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3.5">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-blue-500 text-white shadow-e2">
                <Database className="h-5 w-5 text-brand-lime-400" aria-hidden="true" />
              </span>
              <div>
                <h2 className="flex flex-wrap items-center gap-2 text-h3 font-extrabold tracking-tight text-ink-900">
                  <span>MongoDB Atlas storage</span>
                  <Badge tone={mongoStatus?.connected ? 'emerald' : 'amber'} size="xs">
                    {mongoStatus?.connected ? 'Live atlas' : 'Action needed'}
                  </Badge>
                </h2>
                <p className="mt-0.5 text-[0.8125rem] text-ink-500">
                  Document store persisting multi-tenant repositories, features, and AI triage logs.
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchMongoStatus}
              disabled={mongoLoading}
              iconLeft={
                <RefreshCw
                  className={`h-3.5 w-3.5 ${mongoLoading ? 'animate-spin' : ''}`}
                  aria-hidden="true"
                />
              }
            >
              {mongoLoading ? 'Pinging…' : 'Re-test'}
            </Button>
          </div>

          <dl className="grid grid-cols-1 gap-3 pt-5 sm:grid-cols-3">
            <div className="rounded-2xl border border-ink-200/80 bg-ink-50 p-3.5">
              <dt className="eyebrow text-ink-400">Database name</dt>
              <dd className="mt-0.5 truncate font-mono text-sm font-bold text-ink-900">
                {mongoStatus?.database || 'devcommand'}
              </dd>
            </div>
            <div className="rounded-2xl border border-ink-200/80 bg-ink-50 p-3.5">
              <dt className="eyebrow text-ink-400">Cluster host</dt>
              <dd className="mt-0.5 truncate font-mono text-sm font-bold text-ink-900">
                {mongoStatus?.host || 'Atlas SRV'}
              </dd>
            </div>
            <div className="rounded-2xl border border-ink-200/80 bg-ink-50 p-3.5">
              <dt className="eyebrow text-ink-400">Tenant isolation</dt>
              <dd className="mt-0.5 flex items-center gap-1.5 font-mono text-sm font-bold text-emerald-600">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                Enforced
              </dd>
            </div>
          </dl>

          <div
            role="status"
            className={`mt-5 flex items-start gap-3 rounded-2xl border px-4 py-3.5 font-mono text-[0.75rem] ${
              mongoStatus?.connected
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-amber-200 bg-amber-50 text-amber-800'
            }`}
          >
            {mongoStatus?.connected ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
            )}
            <div className="space-y-1">
              <p className="font-bold">{mongoStatus?.message}</p>
              {!mongoStatus?.connected && (
                <p className="font-sans text-[0.6875rem] leading-relaxed text-amber-700">
                  Add your connection string to the <code className="rounded bg-amber-100 px-1 py-0.5 font-mono">.env</code>{' '}
                  file:
                  <br />
                  <code className="mt-1 block select-all rounded border border-amber-300 bg-white px-2 py-1 font-mono text-[0.625rem]">
                    MONGODB_URL=mongodb+srv://&lt;username&gt;:&lt;password&gt;@cluster0.mongodb.net/devcommand?retryWrites=true&amp;w=majority
                  </code>
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Identity */}
        {user && (
          <section className="surface-card rounded-3xl p-6 sm:p-8">
            <div className="flex items-center gap-3.5 border-b border-ink-200/80 pb-5">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-blue-500 text-white shadow-e2">
                <Users className="h-5 w-5 text-brand-lime-400" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-h3 font-extrabold tracking-tight text-ink-900">
                  Active identity &amp; tenant workspace
                </h2>
                <p className="mt-0.5 text-[0.8125rem] text-ink-500">
                  Logged in as a distinct tenant. All data is partitioned by your account ID.
                </p>
              </div>
            </div>

            <dl className="grid grid-cols-1 gap-3 pt-5 sm:grid-cols-2">
              <div className="rounded-2xl border border-ink-200/80 bg-ink-50 p-3.5">
                <dt className="eyebrow text-ink-400">Email address</dt>
                <dd className="mt-0.5 truncate font-mono text-sm font-bold text-ink-900">
                  {user.email}
                </dd>
              </div>
              <div className="rounded-2xl border border-ink-200/80 bg-ink-50 p-3.5">
                <dt className="eyebrow text-ink-400">GitHub account</dt>
                <dd className="mt-0.5 truncate font-mono text-sm font-bold text-brand-blue-600">
                  {user.github_username ? `@${user.github_username}` : 'Not linked'}
                </dd>
              </div>
            </dl>
          </section>
        )}

        {/* GitHub token */}
        <section className="surface-card rounded-3xl p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-4 border-b border-ink-200/80 pb-5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3.5">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-blue-500 text-white shadow-e2">
                <GitBranch className="h-5 w-5 text-brand-lime-400" aria-hidden="true" />
              </span>
              <div>
                <h2 className="flex flex-wrap items-center gap-2 text-h3 font-extrabold tracking-tight text-ink-900">
                  <span>GitHub repository token</span>
                  {status?.is_connected && (
                    <Badge tone="emerald" size="xs">
                      Connected
                    </Badge>
                  )}
                </h2>
                <p className="mt-0.5 text-[0.8125rem] text-ink-500">
                  Synchronise your private and public repositories for roadmap tracking.
                </p>
              </div>
            </div>

            <a
              href="https://github.com/settings/tokens/new?scopes=repo,read:user&description=DevCommand"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-brand-blue-500/20 px-4 py-2 font-mono text-[0.75rem] font-bold text-ink-700 transition-colors hover:border-brand-blue-500/40 hover:text-brand-blue-600"
            >
              <span>Generate PAT</span>
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>

          <form onSubmit={handleSaveToken} className="space-y-4 pt-5">
            <TextField
              label="Personal access token (stored in the AES-256 vault)"
              type="password"
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              hint="Requires the repo and read:user scopes. Stored using AES-256 at rest and never logged in plaintext."
            />

            {message && (
              <div
                role="status"
                className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[0.75rem] font-bold text-emerald-800"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                {message}
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-[0.75rem] font-bold text-rose-800"
              >
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" aria-hidden="true" />
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading || !token.trim()} loading={loading}>
              {loading ? 'Encrypting & storing…' : 'Save & encrypt token'}
            </Button>
          </form>
        </section>

        {/* Architecture */}
        <section className="surface-card rounded-3xl p-6 sm:p-8">
          <h3 className="eyebrow text-ink-400">Zero-leak architecture</h3>
          <dl className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-ink-200/80 bg-ink-50 p-4">
              <dt className="eyebrow text-ink-400">Persistence</dt>
              <dd className="mt-1 text-[0.8125rem] font-bold text-ink-900">MongoDB Atlas</dd>
              <dd className="mt-1 text-[0.6875rem] leading-relaxed text-ink-500">
                Encrypted documents with collection-level isolation.
              </dd>
            </div>
            <div className="rounded-2xl border border-ink-200/80 bg-ink-50 p-4">
              <dt className="eyebrow text-ink-400">Vault cipher</dt>
              <dd className="mt-1 text-[0.8125rem] font-bold text-ink-900">AES-256 GCM</dd>
              <dd className="mt-1 text-[0.6875rem] leading-relaxed text-ink-500">
                Authenticated encryption for every stored secret.
              </dd>
            </div>
            <div className="rounded-2xl border border-ink-200/80 bg-ink-50 p-4">
              <dt className="eyebrow text-ink-400">Tenant scoping</dt>
              <dd className="mt-1 text-[0.8125rem] font-bold text-ink-900">UUID filter guard</dd>
              <dd className="mt-1 text-[0.6875rem] leading-relaxed text-ink-500">
                Every query is constrained to the calling user ID.
              </dd>
            </div>
          </dl>

          <p className="mt-5 flex items-center gap-2 border-t border-ink-200/80 pt-4 font-mono text-[0.6875rem] text-ink-500">
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Secrets are encrypted before they ever reach the database.</span>
          </p>
        </section>
      </PageContainer>
    </AppShell>
  );
}
