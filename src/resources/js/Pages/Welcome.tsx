import { PageProps } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';

export default function Welcome({ auth }: PageProps) {
    const isAuthed = Boolean(auth.user);

    return (
        <>
            <Head title="Process Atlas — Map your business workflows" />

            {/* ─── Navigation ─────────────────────────────────────── */}
            <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/85 backdrop-blur">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <Link href="/" className="flex items-center gap-3">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                            PA
                        </span>
                        <span className="text-sm font-semibold uppercase tracking-[0.12em] text-foreground">
                            Process Atlas
                        </span>
                    </Link>

                    <nav className="flex items-center gap-3">
                        {isAuthed ? (
                            <Button variant="outline" size="sm" asChild>
                                <Link href={route('dashboard')}>Dashboard →</Link>
                            </Button>
                        ) : (
                            <>
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href={route('login')}>Log in</Link>
                                </Button>
                                <Button size="sm" asChild>
                                    <Link href={route('register')}>Get Started</Link>
                                </Button>
                            </>
                        )}
                    </nav>
                </div>
            </header>

            {/* ─── Hero ────────────────────────────────────────────── */}
            <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden pt-16">
                {/* Dot-grid background */}
                <svg
                    className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.2] dark:opacity-[0.1]"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <defs>
                        <pattern
                            id="dot-grid"
                            x="0"
                            y="0"
                            width="28"
                            height="28"
                            patternUnits="userSpaceOnUse"
                        >
                            <circle cx="1.5" cy="1.5" r="1.5" fill="hsl(var(--muted-foreground))" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#dot-grid)" />
                </svg>

                {/* Decorative graph illustration */}
                <svg
                    className="pointer-events-none absolute right-0 top-16 h-[520px] w-[520px] opacity-[0.05]"
                    viewBox="0 0 520 520"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <line
                        x1="100"
                        y1="100"
                        x2="260"
                        y2="200"
                        stroke="hsl(var(--primary))"
                        strokeWidth="2"
                    />
                    <line
                        x1="260"
                        y1="200"
                        x2="420"
                        y2="120"
                        stroke="hsl(var(--primary))"
                        strokeWidth="2"
                    />
                    <line
                        x1="260"
                        y1="200"
                        x2="200"
                        y2="360"
                        stroke="hsl(var(--primary))"
                        strokeWidth="2"
                    />
                    <line
                        x1="260"
                        y1="200"
                        x2="380"
                        y2="360"
                        stroke="hsl(var(--primary))"
                        strokeWidth="2"
                    />
                    <line
                        x1="200"
                        y1="360"
                        x2="380"
                        y2="360"
                        stroke="hsl(var(--primary))"
                        strokeWidth="2"
                    />
                    <circle cx="100" cy="100" r="28" fill="hsl(var(--primary))" />
                    <circle cx="260" cy="200" r="36" fill="hsl(var(--primary))" />
                    <circle cx="420" cy="120" r="24" fill="hsl(var(--primary))" />
                    <circle cx="200" cy="360" r="30" fill="hsl(var(--primary))" />
                    <circle cx="380" cy="360" r="26" fill="hsl(var(--primary))" />
                </svg>

                {/* Content */}
                <div className="relative mx-auto max-w-4xl px-6 text-center">
                    <Badge
                        variant="outline"
                        className="px-4 py-1 text-xs uppercase tracking-widest"
                    >
                        Workflow Management Platform
                    </Badge>

                    <h1 className="mt-6 text-5xl font-bold leading-[1.1] tracking-tight text-foreground md:text-7xl">
                        Map your <span className="text-primary">business processes.</span>
                        <br />
                        Every step,{' '}
                        <span className="relative whitespace-nowrap">
                            every decision.
                            <svg
                                className="absolute -bottom-2 left-0 w-full"
                                viewBox="0 0 400 12"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M2 9 Q100 3 200 8 Q300 13 398 6"
                                    stroke="hsl(var(--primary))"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    opacity="0.35"
                                />
                            </svg>
                        </span>
                    </h1>

                    <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                        Process Atlas lets your team design, revise, and publish visual workflow
                        diagrams — with role-based access, one-click publishing, and AI-assisted
                        documentation built in.
                    </p>

                    <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                        {isAuthed ? (
                            <Button size="lg" asChild>
                                <Link href={route('dashboard')}>Go to Dashboard →</Link>
                            </Button>
                        ) : (
                            <>
                                <Button size="lg" asChild>
                                    <Link href={route('register')}>Get Started — it's free</Link>
                                </Button>
                                <Button variant="outline" size="lg" asChild>
                                    <Link href={route('login')}>Log in</Link>
                                </Button>
                            </>
                        )}
                    </div>

                    <p className="mono mt-8 text-xs text-muted-foreground/70">
                        Visual graphs · Revision control · Role-based access · AI-powered
                    </p>
                </div>
            </section>

            {/* ─── Features ────────────────────────────────────────── */}
            <section className="border-t border-border py-24">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="text-center">
                        <Badge
                            variant="outline"
                            className="px-4 py-1 text-xs uppercase tracking-widest"
                        >
                            Why Process Atlas
                        </Badge>
                        <h2 className="mt-3 text-3xl font-bold text-foreground md:text-4xl">
                            Built for process-driven teams
                        </h2>
                        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
                            Everything you need to design, maintain, and share your organization's
                            operational knowledge — in one place.
                        </p>
                    </div>

                    <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {/* Visual Workflow Designer */}
                        <Card className="shadow-sm">
                            <CardContent className="pt-6">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                    <svg
                                        className="h-5 w-5 text-primary"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <circle cx="5" cy="5" r="2" />
                                        <circle cx="19" cy="5" r="2" />
                                        <circle cx="12" cy="19" r="2" />
                                        <line x1="7" y1="5" x2="17" y2="5" />
                                        <line x1="5" y1="7" x2="12" y2="17" />
                                        <line x1="19" y1="7" x2="12" y2="17" />
                                    </svg>
                                </div>
                                <CardTitle className="mt-4 text-base">
                                    Visual Workflow Designer
                                </CardTitle>
                                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                    Drag-and-drop node-graph editor. Connect screens, decisions, and
                                    actions into clear, readable process maps.
                                </p>
                            </CardContent>
                        </Card>

                        {/* Revision Control */}
                        <Card className="shadow-sm">
                            <CardContent className="pt-6">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                    <svg
                                        className="h-5 w-5 text-primary"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <circle cx="6" cy="6" r="2" />
                                        <circle cx="18" cy="6" r="2" />
                                        <circle cx="12" cy="18" r="2" />
                                        <polyline points="6,8 6,14 12,16" />
                                        <polyline points="18,8 18,14 12,16" />
                                        <line x1="8" y1="6" x2="16" y2="6" />
                                    </svg>
                                </div>
                                <CardTitle className="mt-4 text-base">
                                    Revision Control & Publishing
                                </CardTitle>
                                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                    Every change is revision-tracked. Publish with confidence and
                                    roll back to any prior state in one click.
                                </p>
                            </CardContent>
                        </Card>

                        {/* Role-based Collaboration */}
                        <Card className="shadow-sm">
                            <CardContent className="pt-6">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                    <svg
                                        className="h-5 w-5 text-primary"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <circle cx="9" cy="7" r="3" />
                                        <path d="M3 20c0-3.3 2.7-6 6-6" />
                                        <circle cx="17" cy="10" r="2.5" />
                                        <path d="M14 20c0-2.8 1.3-5 3-5s3 2.2 3 5" />
                                    </svg>
                                </div>
                                <CardTitle className="mt-4 text-base">
                                    Role-based Collaboration
                                </CardTitle>
                                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                    Fine-grained permissions for Admins, Editors, and Viewers.
                                    Everyone sees exactly what they should.
                                </p>
                            </CardContent>
                        </Card>

                        {/* AI-Powered */}
                        <Card className="shadow-sm">
                            <CardContent className="pt-6">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                    <svg
                                        className="h-5 w-5 text-primary"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7z" />
                                    </svg>
                                </div>
                                <CardTitle className="mt-4 text-base">AI-Powered (MCP)</CardTitle>
                                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                    Model Context Protocol integration lets AI agents read, update,
                                    and document your workflows programmatically.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* ─── How It Works ─────────────────────────────────────── */}
            <section className="border-t border-border py-24">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="rounded-xl border bg-muted/50 px-8 py-16">
                        <div className="text-center">
                            <Badge
                                variant="outline"
                                className="px-4 py-1 text-xs uppercase tracking-widest"
                            >
                                Get up and running
                            </Badge>
                            <h2 className="mt-3 text-3xl font-bold text-foreground md:text-4xl">
                                Three steps to clarity
                            </h2>
                        </div>

                        <div className="mt-16 grid gap-10 md:grid-cols-3 md:gap-6">
                            {/* Step 1 */}
                            <div className="flex flex-col items-start">
                                <span className="mono select-none text-7xl font-bold leading-none text-primary/10">
                                    01
                                </span>
                                <div className="mt-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                                    <svg
                                        className="h-5 w-5 text-primary-foreground"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <rect x="3" y="3" width="18" height="18" rx="3" />
                                        <line x1="12" y1="8" x2="12" y2="16" />
                                        <line x1="8" y1="12" x2="16" y2="12" />
                                    </svg>
                                </div>
                                <h3 className="mt-5 text-lg font-semibold text-foreground">
                                    Create a Project
                                </h3>
                                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                    Organize your work by department, product, or domain. Projects
                                    keep related workflows grouped and discoverable.
                                </p>
                            </div>

                            {/* Step 2 */}
                            <div className="flex flex-col items-start">
                                <span className="mono select-none text-7xl font-bold leading-none text-primary/10">
                                    02
                                </span>
                                <div className="mt-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                                    <svg
                                        className="h-5 w-5 text-primary-foreground"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <circle cx="8" cy="8" r="2" />
                                        <circle cx="16" cy="16" r="2" />
                                        <circle cx="16" cy="8" r="2" />
                                        <line x1="10" y1="8" x2="14" y2="8" />
                                        <line x1="16" y1="10" x2="16" y2="14" />
                                        <line x1="9.4" y1="9.4" x2="14.6" y2="14.6" />
                                    </svg>
                                </div>
                                <h3 className="mt-5 text-lg font-semibold text-foreground">
                                    Design Workflows
                                </h3>
                                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                    Use the visual node editor to connect process screens, decision
                                    points, and handoffs into a clear diagram.
                                </p>
                            </div>

                            {/* Step 3 */}
                            <div className="flex flex-col items-start">
                                <span className="mono select-none text-7xl font-bold leading-none text-primary/10">
                                    03
                                </span>
                                <div className="mt-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                                    <svg
                                        className="h-5 w-5 text-primary-foreground"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M4 12v6a2 2 0 002 2h12a2 2 0 002-2v-6" />
                                        <polyline points="16 6 12 2 8 6" />
                                        <line x1="12" y1="2" x2="12" y2="15" />
                                    </svg>
                                </div>
                                <h3 className="mt-5 text-lg font-semibold text-foreground">
                                    Publish & Share
                                </h3>
                                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                    Publish a revision snapshot so your team always reads the latest
                                    approved process — and roll back instantly if needed.
                                </p>
                            </div>
                        </div>

                        {!isAuthed && (
                            <div className="mt-14 text-center">
                                <Button size="lg" asChild>
                                    <Link href={route('register')}>
                                        Start mapping your processes →
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* ─── Footer ──────────────────────────────────────────── */}
            <footer className="border-t border-border py-10">
                <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 sm:flex-row lg:px-8">
                    <div className="flex items-center gap-3">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
                            PA
                        </span>
                        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-foreground">
                            Process Atlas
                        </span>
                        <span className="text-xs text-muted-foreground">
                            &copy; {new Date().getFullYear()}
                        </span>
                    </div>

                    <nav className="flex items-center gap-2">
                        {isAuthed ? (
                            <Button variant="ghost" size="sm" className="text-xs" asChild>
                                <Link href={route('dashboard')}>Dashboard</Link>
                            </Button>
                        ) : (
                            <>
                                <Button variant="ghost" size="sm" className="text-xs" asChild>
                                    <Link href={route('login')}>Log in</Link>
                                </Button>
                                <Button variant="ghost" size="sm" className="text-xs" asChild>
                                    <Link href={route('register')}>Register</Link>
                                </Button>
                            </>
                        )}
                    </nav>
                </div>
            </footer>
        </>
    );
}
