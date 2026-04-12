import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode, useMemo, useState } from 'react';

const navigation = [
    {
        label: 'Overview',
        href: 'dashboard',
        match: ['dashboard'],
        glyph: 'OV',
    },
    {
        label: 'Workflow Editor',
        href: 'dashboard',
        match: ['workflows.editor'],
        glyph: 'WF',
    },
];

export default function AuthenticatedLayout({
    header,
    children,
    contentWidth = 'default',
}: PropsWithChildren<{
    header?: ReactNode;
    contentWidth?: 'default' | 'wide' | 'full';
}>) {
    const user = usePage().props.auth.user;
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    const contentClassName = useMemo(() => {
        if (contentWidth === 'full') {
            return 'w-full';
        }

        if (contentWidth === 'wide') {
            return 'mx-auto w-full max-w-[1600px]';
        }

        return 'mx-auto w-full max-w-7xl';
    }, [contentWidth]);

    const navContent = (
        <div className="flex h-full flex-col">
            <div className="border-b border-white/60 px-5 py-5">
                <Link href={route('dashboard')} className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0f5ef7,#24b3ff)] text-xs font-bold tracking-[0.18em] text-white shadow-[0_12px_30px_rgba(15,94,247,0.35)]">
                        PA
                    </span>
                    <div>
                        <p className="text-sm font-semibold text-slate-950">
                            Process Atlas
                        </p>
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                            Enterprise Workspace
                        </p>
                    </div>
                </Link>
            </div>

            <div className="px-3 py-4">
                <p className="px-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Workspace
                </p>
                <nav className="mt-3 space-y-1.5">
                    {navigation.map((item) => {
                        const isActive = item.match.some((name) => route().current(name));

                        return (
                            <Link
                                key={item.label}
                                href={route(item.href)}
                                className={`sidebar-link ${isActive ? 'sidebar-link-active' : ''}`.trim()}
                                onClick={() => setMobileNavOpen(false)}
                            >
                                <span className="sidebar-glyph">{item.glyph}</span>
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="mt-auto px-5 pb-5 pt-3">
                <div className="rounded-3xl border border-white/70 bg-white/80 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur">
                    <p className="eyebrow text-slate-400">Signed In</p>
                    <p className="mt-2 text-sm font-semibold text-slate-950">
                        {user?.name}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">{user?.email}</p>
                    <div className="mt-4 flex gap-2">
                        <Link
                            href={route('profile.edit')}
                            className="btn-secondary px-3 py-2 text-xs"
                        >
                            Profile
                        </Link>
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="btn-ghost px-3 py-2 text-xs"
                        >
                            Log Out
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="shell-app min-h-screen text-slate-900">
            <aside className="shell-sidebar hidden xl:block">{navContent}</aside>

            {mobileNavOpen && (
                <div className="fixed inset-0 z-40 xl:hidden">
                    <button
                        type="button"
                        className="absolute inset-0 bg-slate-950/45"
                        onClick={() => setMobileNavOpen(false)}
                        aria-label="Close navigation"
                    />
                    <aside className="shell-sidebar mobile-shell-sidebar relative z-10 h-full w-[300px]">
                        {navContent}
                    </aside>
                </div>
            )}

            <div className="shell-main xl:pl-[288px]">
                <div className="topbar sticky top-0 z-30">
                    <div className={`${contentClassName} flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8`}>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                className="btn-secondary px-3 py-2 text-sm xl:hidden"
                                onClick={() => setMobileNavOpen(true)}
                            >
                                Menu
                            </button>
                            <div>
                                <p className="eyebrow">Workspace</p>
                                <p className="mt-1 text-sm text-slate-500">
                                    Manage process models, versions, and release flow.
                                </p>
                            </div>
                        </div>

                        <div className="hidden items-center gap-3 sm:flex">
                            <div className="rounded-full border border-white/70 bg-white/80 px-4 py-2 text-right shadow-[0_10px_24px_rgba(15,23,42,0.06)] backdrop-blur">
                                <p className="text-sm font-semibold text-slate-950">
                                    {user?.name}
                                </p>
                                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                                    {user?.roles?.[0] ?? 'Member'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={`${contentClassName} px-4 pb-10 pt-6 sm:px-6 lg:px-8`}>
                    {header && <header>{header}</header>}
                    <main className={header ? 'mt-6' : ''}>{children}</main>
                </div>
            </div>
        </div>
    );
}
