import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode, useMemo, useState } from 'react';
import type { ProjectRole } from '@/types/processAtlas';

type ProjectNavItem = {
    id: number;
    name: string;
    description?: string | null;
    current_user_role: ProjectRole | null;
};

export default function AuthenticatedLayout({
    header,
    children,
    contentWidth = 'default',
}: PropsWithChildren<{
    header?: ReactNode;
    contentWidth?: 'default' | 'wide' | 'full';
}>) {
    const user = usePage().props.auth.user;
    const projects = usePage().props.projects as ProjectNavItem[] | undefined;
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [projectSearch, setProjectSearch] = useState('');

    const contentClassName = useMemo(() => {
        if (contentWidth === 'full') {
            return 'w-full';
        }

        if (contentWidth === 'wide') {
            return 'mx-auto w-full max-w-[1600px]';
        }

        return 'mx-auto w-full max-w-7xl';
    }, [contentWidth]);

    const isProjectActive = (projectId: number) => {
        return route().current('projects.show', { project: projectId });
    };

    const filteredProjects = useMemo(() => {
        if (!projects) return [];

        const query = projectSearch.trim().toLowerCase();
        if (!query) return projects;

        return projects.filter(p => p.name.toLowerCase().includes(query));
    }, [projects, projectSearch]);

    const renderProjectLink = (project: ProjectNavItem) => {
        const isActive = isProjectActive(project.id);

        return (
            <Link
                key={project.id}
                href={route('projects.show', { project: project.id })}
                className={`sidebar-link ${isActive ? 'sidebar-link-active' : ''}`.trim()}
                onClick={() => setMobileNavOpen(false)}
            >
                <span className="sidebar-glyph">{project.name.charAt(0).toUpperCase()}</span>
                <span className="truncate">{project.name}</span>
            </Link>
        );
    };

    const navContent = (
        <div className="flex h-full flex-col">
            <div className="shrink-0 border-b border-white/60 px-5 py-5">
                <Link href={route('dashboard')} className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0f5ef7,#24b3ff)] text-xs font-bold tracking-[0.18em] text-white shadow-[0_12px_30px_rgba(15,94,247,0.35)]">
                        PA
                    </span>
                    <div>
                        <p className="text-sm font-semibold text-slate-950">Process Atlas</p>
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                            Enterprise Workspace
                        </p>
                    </div>
                </Link>
            </div>

            <div className="sidebar-scroll min-h-0 flex-1 overflow-y-auto">
                <div className="px-3 py-4">
                    <p className="px-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Navigation
                    </p>
                    <nav className="mt-3 space-y-1.5">
                        <Link
                            href={route('dashboard')}
                            className={`sidebar-link ${route().current('dashboard') ? 'sidebar-link-active' : ''}`.trim()}
                            onClick={() => setMobileNavOpen(false)}
                        >
                            <span className="sidebar-glyph">OV</span>
                            <span>Dashboard</span>
                        </Link>
                        {(user as { is_admin?: boolean } | null)?.is_admin && (
                            <Link
                                href={route('admin.users')}
                                className={`sidebar-link ${route().current('admin.users') ? 'sidebar-link-active' : ''}`.trim()}
                                onClick={() => setMobileNavOpen(false)}
                            >
                                <span className="sidebar-glyph">AD</span>
                                <span>Administration</span>
                            </Link>
                        )}
                    </nav>
                </div>

                {projects && projects.length > 0 && (
                    <div className="px-3 py-4">
                        <p className="px-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                            Projects
                        </p>

                        <div className="relative mb-3 mt-3">
                            <svg
                                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                                />
                            </svg>
                            <input
                                type="text"
                                value={projectSearch}
                                onChange={e => setProjectSearch(e.target.value)}
                                placeholder="Search projects..."
                                className="w-full rounded-2xl border border-slate-200/60 bg-white/70 py-2 pl-9 pr-3 text-sm text-slate-700 shadow-sm transition-all placeholder:text-slate-400 focus:border-blue-300 focus:bg-white/90 focus:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-100/50"
                            />
                        </div>

                        <nav className="space-y-1.5">
                            {filteredProjects.map(renderProjectLink)}

                            {filteredProjects.length === 0 && projectSearch.trim() && (
                                <p className="px-3 py-2 text-sm text-slate-400">
                                    No projects found
                                </p>
                            )}
                        </nav>
                    </div>
                )}
            </div>

            <div className="mt-auto shrink-0 border-t border-white/60 px-5 pb-5 pt-3">
                <p className="eyebrow text-slate-400">Signed In</p>
                <p className="mt-2 text-sm font-semibold text-slate-950">{user?.name}</p>
                <p className="mt-1 truncate text-sm text-slate-500">{user?.email}</p>
                <div className="mt-4 flex gap-2">
                    <Link href={route('profile.edit')} className="btn-secondary px-3 py-2 text-xs">
                        Profile
                    </Link>
                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="btn-danger px-3 py-2 text-xs"
                    >
                        Log Out
                    </Link>
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
                    <div
                        className={`${contentClassName} flex items-center gap-4 px-4 py-3 sm:px-6 lg:px-8 xl:hidden`}
                    >
                        <button
                            type="button"
                            className="btn-secondary px-3 py-2 text-sm"
                            onClick={() => setMobileNavOpen(true)}
                        >
                            Menu
                        </button>
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
