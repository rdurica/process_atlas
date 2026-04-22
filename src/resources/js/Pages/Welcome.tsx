import { PageProps } from '@/types';
import { Head, Link } from '@inertiajs/react';

export default function Welcome({ auth }: PageProps) {
    const isAuthed = Boolean(auth.user);

    return (
        <>
            <Head title="Process Atlas — Map your business workflows" />

            {/* ─── Navigation ─────────────────────────────────────── */}
            <header className="fixed inset-x-0 top-0 z-50 border-b border-[#d1dbef] bg-white/85 backdrop-blur">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <Link href="/" className="flex items-center gap-3">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#0059ff] text-sm font-bold text-white">
                            PA
                        </span>
                        <span className="text-sm font-semibold uppercase tracking-[0.16em] text-[#16316a]">
                            Process Atlas
                        </span>
                    </Link>

                    <nav className="flex items-center gap-3">
                        {isAuthed ? (
                            <Link
                                href={route('dashboard')}
                                className="rounded-xl border border-[#d1dbef] bg-white px-4 py-2 text-sm font-semibold text-[#16316a] transition hover:bg-[#eaf1ff]"
                            >
                                Dashboard →
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={route('login')}
                                    className="text-sm font-medium text-[#4f5f82] transition hover:text-[#16316a]"
                                >
                                    Log in
                                </Link>
                                <Link
                                    href={route('register')}
                                    className="rounded-xl bg-[#0059ff] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0048cf]"
                                >
                                    Get Started
                                </Link>
                            </>
                        )}
                    </nav>
                </div>
            </header>

            {/* ─── Hero ────────────────────────────────────────────── */}
            <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden pt-16">
                {/* Dot-grid background */}
                <svg
                    className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.35]"
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
                            <circle cx="1.5" cy="1.5" r="1.5" fill="#a8c0e8" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#dot-grid)" />
                </svg>

                {/* Decorative graph illustration */}
                <svg
                    className="pointer-events-none absolute right-0 top-16 h-[520px] w-[520px] opacity-[0.07]"
                    viewBox="0 0 520 520"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <line x1="100" y1="100" x2="260" y2="200" stroke="#0059ff" strokeWidth="2" />
                    <line x1="260" y1="200" x2="420" y2="120" stroke="#0059ff" strokeWidth="2" />
                    <line x1="260" y1="200" x2="200" y2="360" stroke="#0059ff" strokeWidth="2" />
                    <line x1="260" y1="200" x2="380" y2="360" stroke="#0059ff" strokeWidth="2" />
                    <line x1="200" y1="360" x2="380" y2="360" stroke="#0059ff" strokeWidth="2" />
                    <circle cx="100" cy="100" r="28" fill="#0059ff" />
                    <circle cx="260" cy="200" r="36" fill="#0059ff" />
                    <circle cx="420" cy="120" r="24" fill="#0059ff" />
                    <circle cx="200" cy="360" r="30" fill="#0059ff" />
                    <circle cx="380" cy="360" r="26" fill="#0059ff" />
                </svg>

                {/* Content */}
                <div className="relative mx-auto max-w-4xl px-6 text-center">
                    <span className="mono inline-block rounded-full border border-[#d1dbef] bg-white/80 px-4 py-1 text-xs uppercase tracking-[0.18em] text-[#4f5f82]">
                        Workflow Management Platform
                    </span>

                    <h1 className="mt-6 text-5xl font-bold leading-[1.1] tracking-tight text-[#16316a] md:text-7xl">
                        Map your <span className="text-[#0059ff]">business processes.</span>
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
                                    stroke="#0059ff"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    opacity="0.35"
                                />
                            </svg>
                        </span>
                    </h1>

                    <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-[#4f5f82]">
                        Process Atlas lets your team design, revise, and publish visual workflow
                        diagrams — with role-based access, one-click publishing, and AI-assisted
                        documentation built in.
                    </p>

                    <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                        {isAuthed ? (
                            <Link
                                href={route('dashboard')}
                                className="rounded-xl bg-[#0059ff] px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-[#0059ff]/25 transition hover:bg-[#0048cf] hover:shadow-[#0059ff]/35"
                            >
                                Go to Dashboard →
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={route('register')}
                                    className="rounded-xl bg-[#0059ff] px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-[#0059ff]/25 transition hover:bg-[#0048cf] hover:shadow-[#0059ff]/35"
                                >
                                    Get Started — it's free
                                </Link>
                                <Link
                                    href={route('login')}
                                    className="rounded-xl border border-[#d1dbef] bg-white/80 px-8 py-3.5 text-base font-semibold text-[#16316a] backdrop-blur transition hover:bg-[#eaf1ff]"
                                >
                                    Log in
                                </Link>
                            </>
                        )}
                    </div>

                    <p className="mono mt-8 text-xs text-[#4f5f82]/70">
                        Visual graphs · Revision control · Role-based access · AI-powered
                    </p>
                </div>
            </section>

            {/* ─── Features ────────────────────────────────────────── */}
            <section className="py-24">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="text-center">
                        <p className="mono text-xs uppercase tracking-[0.18em] text-[#4f5f82]">
                            Why Process Atlas
                        </p>
                        <h2 className="mt-3 text-3xl font-bold text-[#16316a] md:text-4xl">
                            Built for process-driven teams
                        </h2>
                        <p className="mx-auto mt-4 max-w-xl text-[#4f5f82]">
                            Everything you need to design, maintain, and share your organization's
                            operational knowledge — in one place.
                        </p>
                    </div>

                    <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {/* Visual Workflow Designer */}
                        <div className="panel rounded-2xl p-6">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eaf1ff]">
                                <svg
                                    className="h-5 w-5 text-[#0059ff]"
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
                            <h3 className="mt-5 text-base font-bold text-[#16316a]">
                                Visual Workflow Designer
                            </h3>
                            <p className="mt-2 text-sm leading-relaxed text-[#4f5f82]">
                                Drag-and-drop node-graph editor. Connect screens, decisions, and
                                actions into clear, readable process maps.
                            </p>
                        </div>

                        {/* Revision Control */}
                        <div className="panel rounded-2xl p-6">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eaf1ff]">
                                <svg
                                    className="h-5 w-5 text-[#0059ff]"
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
                            <h3 className="mt-5 text-base font-bold text-[#16316a]">
                                Revision Control & Publishing
                            </h3>
                            <p className="mt-2 text-sm leading-relaxed text-[#4f5f82]">
                                Every change is revision-tracked. Publish with confidence and roll
                                back to any prior state in one click.
                            </p>
                        </div>

                        {/* Role-based Collaboration */}
                        <div className="panel rounded-2xl p-6">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eaf1ff]">
                                <svg
                                    className="h-5 w-5 text-[#0059ff]"
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
                            <h3 className="mt-5 text-base font-bold text-[#16316a]">
                                Role-based Collaboration
                            </h3>
                            <p className="mt-2 text-sm leading-relaxed text-[#4f5f82]">
                                Fine-grained permissions for Admins, Editors, and Viewers. Everyone
                                sees exactly what they should.
                            </p>
                        </div>

                        {/* AI-Powered */}
                        <div className="panel rounded-2xl p-6">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eaf1ff]">
                                <svg
                                    className="h-5 w-5 text-[#0059ff]"
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
                            <h3 className="mt-5 text-base font-bold text-[#16316a]">
                                AI-Powered (MCP)
                            </h3>
                            <p className="mt-2 text-sm leading-relaxed text-[#4f5f82]">
                                Model Context Protocol integration lets AI agents read, update, and
                                document your workflows programmatically.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── How It Works ─────────────────────────────────────── */}
            <section className="py-24">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="rounded-3xl border border-[#d1dbef] bg-[#eaf1ff]/50 px-8 py-16 backdrop-blur">
                        <div className="text-center">
                            <p className="mono text-xs uppercase tracking-[0.18em] text-[#4f5f82]">
                                Get up and running
                            </p>
                            <h2 className="mt-3 text-3xl font-bold text-[#16316a] md:text-4xl">
                                Three steps to clarity
                            </h2>
                        </div>

                        <div className="mt-16 grid gap-10 md:grid-cols-3 md:gap-6">
                            {/* Step 1 */}
                            <div className="flex flex-col items-start">
                                <span className="mono select-none text-7xl font-bold leading-none text-[#0059ff]/10">
                                    01
                                </span>
                                <div className="mt-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#0059ff]">
                                    <svg
                                        className="h-5 w-5 text-white"
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
                                <h3 className="mt-5 text-lg font-bold text-[#16316a]">
                                    Create a Project
                                </h3>
                                <p className="mt-2 text-sm leading-relaxed text-[#4f5f82]">
                                    Organize your work by department, product, or domain. Projects
                                    keep related workflows grouped and discoverable.
                                </p>
                            </div>

                            {/* Step 2 */}
                            <div className="flex flex-col items-start">
                                <span className="mono select-none text-7xl font-bold leading-none text-[#0059ff]/10">
                                    02
                                </span>
                                <div className="mt-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#0059ff]">
                                    <svg
                                        className="h-5 w-5 text-white"
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
                                <h3 className="mt-5 text-lg font-bold text-[#16316a]">
                                    Design Workflows
                                </h3>
                                <p className="mt-2 text-sm leading-relaxed text-[#4f5f82]">
                                    Use the visual node editor to connect process screens, decision
                                    points, and handoffs into a clear diagram.
                                </p>
                            </div>

                            {/* Step 3 */}
                            <div className="flex flex-col items-start">
                                <span className="mono select-none text-7xl font-bold leading-none text-[#0059ff]/10">
                                    03
                                </span>
                                <div className="mt-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#0059ff]">
                                    <svg
                                        className="h-5 w-5 text-white"
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
                                <h3 className="mt-5 text-lg font-bold text-[#16316a]">
                                    Publish & Share
                                </h3>
                                <p className="mt-2 text-sm leading-relaxed text-[#4f5f82]">
                                    Publish a revision snapshot so your team always reads the latest
                                    approved process — and roll back instantly if needed.
                                </p>
                            </div>
                        </div>

                        {!isAuthed && (
                            <div className="mt-14 text-center">
                                <Link
                                    href={route('register')}
                                    className="inline-block rounded-xl bg-[#0059ff] px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#0059ff]/20 transition hover:bg-[#0048cf]"
                                >
                                    Start mapping your processes →
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* ─── Footer ──────────────────────────────────────────── */}
            <footer className="border-t border-[#d1dbef] py-10">
                <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 sm:flex-row lg:px-8">
                    <div className="flex items-center gap-3">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#0059ff] text-xs font-bold text-white">
                            PA
                        </span>
                        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#16316a]">
                            Process Atlas
                        </span>
                        <span className="text-xs text-[#4f5f82]">
                            &copy; {new Date().getFullYear()}
                        </span>
                    </div>

                    <nav className="flex items-center gap-6">
                        {isAuthed ? (
                            <Link
                                href={route('dashboard')}
                                className="text-xs text-[#4f5f82] transition hover:text-[#16316a]"
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={route('login')}
                                    className="text-xs text-[#4f5f82] transition hover:text-[#16316a]"
                                >
                                    Log in
                                </Link>
                                <Link
                                    href={route('register')}
                                    className="text-xs text-[#4f5f82] transition hover:text-[#16316a]"
                                >
                                    Register
                                </Link>
                            </>
                        )}
                    </nav>
                </div>
            </footer>
        </>
    );
}
