import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode, useMemo, useState } from 'react';
import type { ProjectRole } from '@/types/processAtlas';
import { ThemeToggle } from '@/Components/ThemeToggle';
import { Avatar, AvatarFallback } from '@/Components/ui/avatar';
import { Separator } from '@/Components/ui/separator';
import { ScrollArea } from '@/Components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/Components/ui/tooltip';
import { cn } from '@/lib/utils';
// DropdownMenu is available for future use in user menu
import { Button } from '@/Components/ui/button';
import { LogOut, User, Users, LayoutDashboard, Menu, Search } from 'lucide-react';

type ProjectNavItem = {
    id: string;
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

    const isProjectActive = (projectId: string) => {
        return route().current('projects.show', { project: projectId });
    };

    const filteredProjects = useMemo(() => {
        if (!projects) return [];
        const query = projectSearch.trim().toLowerCase();
        if (!query) return projects;
        return projects.filter(p => p.name.toLowerCase().includes(query));
    }, [projects, projectSearch]);

    const navContent = useMemo(
        () => (
            <div className="flex h-full flex-col">
                {/* Logo */}
                <div className="shrink-0 px-5 py-5">
                    <Link href={route('dashboard')} className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 text-sm font-bold tracking-wider text-primary-foreground shadow-elevated">
                            PA
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-foreground">Process Atlas</p>
                            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                                Enterprise
                            </p>
                        </div>
                    </Link>
                </div>

                <Separator />

                {/* Navigation */}
                <ScrollArea className="flex-1">
                    <div className="px-3 py-4">
                        <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                            Navigation
                        </p>
                        <nav className="mt-3 space-y-0.5">
                            <SidebarLink
                                href={route('dashboard')}
                                active={route().current('dashboard')}
                                onClick={() => setMobileNavOpen(false)}
                            >
                                <LayoutDashboard className="h-4 w-4" />
                                <span>Dashboard</span>
                            </SidebarLink>
                            {(user as { is_admin?: boolean } | null)?.is_admin && (
                                <SidebarLink
                                    href={route('admin.users')}
                                    active={route().current('admin.users')}
                                    onClick={() => setMobileNavOpen(false)}
                                >
                                    <Users className="h-4 w-4" />
                                    <span>Administration</span>
                                </SidebarLink>
                            )}
                        </nav>
                    </div>

                    {/* Projects */}
                    {projects && projects.length > 0 && (
                        <div className="px-3 py-4">
                            <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                                Projects
                            </p>

                            <div className="relative mb-2 mt-3">
                                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={projectSearch}
                                    onChange={e => setProjectSearch(e.target.value)}
                                    placeholder="Search projects..."
                                    className="h-8 w-full rounded-md border border-input bg-background py-1.5 pl-8 pr-3 text-xs text-foreground shadow-sm transition-all placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                                />
                            </div>

                            <nav className="space-y-0.5">
                                {filteredProjects.map(project => (
                                    <ProjectLink
                                        key={project.id}
                                        project={project}
                                        isActive={isProjectActive(project.id)}
                                        onClick={() => setMobileNavOpen(false)}
                                    />
                                ))}
                                {filteredProjects.length === 0 && projectSearch.trim() && (
                                    <p className="px-3 py-2 text-xs text-muted-foreground">
                                        No projects found
                                    </p>
                                )}
                            </nav>
                        </div>
                    )}
                </ScrollArea>

                <Separator />

                {/* User footer */}
                <div className="mt-auto shrink-0 px-5 pb-4 pt-4">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-secondary text-xs font-semibold">
                                {user?.name?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">
                                {user?.name}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                        </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                        <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
                            <Link href={route('profile.edit')}>
                                <User className="mr-1.5 h-3.5 w-3.5" />
                                Profile
                            </Link>
                        </Button>
                        <Button variant="destructive" size="sm" className="h-8 text-xs" asChild>
                            <Link href={route('logout')} method="post" as="button">
                                <LogOut className="mr-1.5 h-3.5 w-3.5" />
                                Log Out
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        ),
        [filteredProjects, projectSearch, projects, user]
    );

    return (
        <TooltipProvider delayDuration={300} skipDelayDuration={0} disableHoverableContent>
            <div className="shell-app min-h-screen bg-background text-foreground">
                {/* Desktop sidebar */}
                <aside className="shell-sidebar hidden overflow-x-hidden xl:flex">
                    {navContent}
                </aside>

                {/* Mobile overlay */}
                {mobileNavOpen && (
                    <div className="fixed inset-0 z-40 xl:hidden">
                        <button
                            type="button"
                            className="absolute inset-0 bg-foreground/50 backdrop-blur-sm"
                            onClick={() => setMobileNavOpen(false)}
                            aria-label="Close navigation"
                        />
                        <aside className="shell-sidebar mobile-shell-sidebar relative z-10 h-full w-[280px] overflow-x-hidden">
                            {navContent}
                        </aside>
                    </div>
                )}

                {/* Main content */}
                <div className="shell-main xl:pl-[280px]">
                    {/* Topbar */}
                    <div className="topbar sticky top-0 z-30">
                        <div
                            className={`${contentClassName} flex items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8`}
                        >
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="xl:hidden"
                                    onClick={() => setMobileNavOpen(true)}
                                >
                                    <Menu className="h-4 w-4" />
                                </Button>
                                {header}
                            </div>
                            <div className="hidden xl:block">
                                <ThemeToggle />
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div
                        className={`${contentClassName} animate-slide-in-bottom px-4 pb-10 pt-6 sm:px-6 lg:px-8`}
                    >
                        {children}
                    </div>
                </div>
            </div>
        </TooltipProvider>
    );
}

/* ── Sidebar Link Components ─────────────────────── */

function SidebarLink({
    href,
    active,
    children,
    onClick,
}: {
    href: string;
    active: boolean;
    children: ReactNode;
    onClick?: () => void;
}) {
    return (
        <Link
            href={href}
            className={cn('sidebar-link', active && 'sidebar-link-active')}
            onClick={onClick}
        >
            {children}
        </Link>
    );
}

function ProjectLink({
    project,
    isActive,
    onClick,
}: {
    project: ProjectNavItem;
    isActive: boolean;
    onClick?: () => void;
}) {
    const firstLetter = project.name.charAt(0).toUpperCase();
    const nameClasses = (() => {
        if (project.name.length > 40) return 'line-clamp-3 text-xs leading-tight';
        if (project.name.length > 20) return 'line-clamp-2 text-xs leading-tight';
        return 'truncate text-sm';
    })();

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Link
                    href={route('projects.show', { project: project.id })}
                    className={cn('sidebar-link', isActive && 'sidebar-link-active')}
                    onClick={onClick}
                >
                    <span
                        className={cn(
                            'sidebar-glyph',
                            isActive && 'bg-primary text-primary-foreground'
                        )}
                    >
                        {firstLetter}
                    </span>
                    <span className={cn('min-w-0 flex-1', nameClasses)}>{project.name}</span>
                </Link>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-[200px]">
                <p className="font-medium">{project.name}</p>
                {project.description && (
                    <p className="text-xs text-muted-foreground">{project.description}</p>
                )}
            </TooltipContent>
        </Tooltip>
    );
}
