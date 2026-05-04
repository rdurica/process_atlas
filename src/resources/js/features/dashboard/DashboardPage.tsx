import Modal from '@/Components/Modal';
import StatusBadge from '@/Components/StatusBadge';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useDashboard } from './useDashboard';
import type { DashboardProps, DashboardStatusFilter } from './types';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Switch } from '@/Components/ui/switch';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/Components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import {
    FolderKanban,
    GitBranch,
    FileText,
    CheckCircle2,
    Search,
    Plus,
    ArrowRight,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';

const metricIcons: Record<string, React.ReactNode> = {
    Projects: <FolderKanban className="h-4 w-4" />,
    Workflows: <GitBranch className="h-4 w-4" />,
    Drafts: <FileText className="h-4 w-4" />,
    Published: <CheckCircle2 className="h-4 w-4" />,
};

export default function DashboardPage(props: DashboardProps) {
    const dashboard = useDashboard(props);

    return (
        <AuthenticatedLayout
            contentWidth="wide"
            header={
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                            Dashboard
                        </p>
                        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                            Operations Overview
                        </h1>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        {dashboard.canCreateProjects && (
                            <Button
                                onClick={() => dashboard.setProjectModalOpen(true)}
                                data-testid="create-project-open"
                            >
                                <Plus className="mr-1.5 h-4 w-4" />
                                New Project
                            </Button>
                        )}
                    </div>
                </div>
            }
        >
            <Head title="Dashboard" />

            <div className="space-y-8">
                {/* Metrics */}
                <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
                    {dashboard.metrics.map(metric => (
                        <Card key={metric.label} className="relative overflow-hidden">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                        {metric.label}
                                    </CardTitle>
                                    <span className="text-muted-foreground">
                                        {metricIcons[metric.label]}
                                    </span>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold tracking-tight text-foreground">
                                    {metric.value}
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {metric.detail}
                                </p>
                            </CardContent>
                            <div
                                className="absolute inset-x-0 top-0 h-1"
                                style={{
                                    background: `var(--metric-accent, hsl(var(--primary)))`,
                                }}
                            />
                        </Card>
                    ))}
                </section>

                {/* Projects Table */}
                <Card>
                    <CardHeader>
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                    Projects
                                </p>
                                <CardTitle className="mt-1 text-base">Your Workspaces</CardTitle>
                            </div>

                            <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row lg:items-center">
                                <div className="relative min-w-[260px] lg:w-[320px]">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        value={dashboard.query}
                                        onChange={event => dashboard.setQuery(event.target.value)}
                                        placeholder="Search projects"
                                        className="pl-9"
                                    />
                                </div>
                                <Select
                                    value={dashboard.statusFilter}
                                    onValueChange={value =>
                                        dashboard.setStatusFilter(value as DashboardStatusFilter)
                                    }
                                >
                                    <SelectTrigger className="min-w-[180px]">
                                        <SelectValue placeholder="All statuses" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All statuses</SelectItem>
                                        <SelectItem value="published">Has published</SelectItem>
                                        <SelectItem value="draft">Has drafts</SelectItem>
                                        <SelectItem value="empty">No workflows</SelectItem>
                                    </SelectContent>
                                </Select>
                                <div className="flex items-center gap-2">
                                    <Switch
                                        id="show-archived"
                                        checked={dashboard.includeArchived}
                                        onCheckedChange={checked =>
                                            dashboard.setIncludeArchived(checked)
                                        }
                                    />
                                    <label
                                        htmlFor="show-archived"
                                        className="cursor-pointer text-sm text-muted-foreground"
                                    >
                                        Show archived
                                    </label>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {dashboard.projects.length === 0 ? (
                            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
                                <FolderKanban className="h-8 w-8 text-muted-foreground/50" />
                                <p className="mt-2 text-sm text-muted-foreground">
                                    No projects match the current filters.
                                </p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Workflows</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {dashboard.projects.map(project => (
                                        <TableRow
                                            key={project.id}
                                            className="group cursor-pointer"
                                            onClick={e => {
                                                if (!e.defaultPrevented) {
                                                    router.visit(
                                                        route('projects.show', {
                                                            project: project.id,
                                                        })
                                                    );
                                                }
                                            }}
                                        >
                                            <TableCell>
                                                <Link
                                                    href={route('projects.show', {
                                                        project: project.id,
                                                    })}
                                                    className="block"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-semibold text-foreground transition-colors group-hover:text-primary">
                                                            {project.name}
                                                        </p>
                                                        {project.is_public && (
                                                            <Badge variant="secondary">
                                                                Public
                                                            </Badge>
                                                        )}
                                                        {project.archived_at && (
                                                            <Badge variant="outline">
                                                                Archived
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                                                        {project.description ||
                                                            'No project description'}
                                                    </p>
                                                </Link>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    {project.released_count > 0 && (
                                                        <StatusBadge tone="success">
                                                            {project.released_count} released
                                                        </StatusBadge>
                                                    )}
                                                    {project.unreleased_count > 0 && (
                                                        <StatusBadge tone="neutral">
                                                            {project.unreleased_count} unreleased
                                                        </StatusBadge>
                                                    )}
                                                    {project.workflows_count === 0 && (
                                                        <StatusBadge tone="neutral">
                                                            No workflows
                                                        </StatusBadge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">
                                                    {project.workflows_count} workflows
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link
                                                        href={route('projects.show', {
                                                            project: project.id,
                                                        })}
                                                    >
                                                        View
                                                        <ArrowRight className="ml-1 h-3 w-3" />
                                                    </Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}

                        {/* Pagination */}
                        {dashboard.lastPage > 1 && (
                            <div className="mt-4 flex items-center justify-between border-t pt-4">
                                <p className="text-sm text-muted-foreground">
                                    Page {dashboard.currentPage} of {dashboard.lastPage}
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            dashboard.handlePageChange(dashboard.currentPage - 1)
                                        }
                                        disabled={dashboard.currentPage <= 1}
                                    >
                                        <ChevronLeft className="mr-1 h-4 w-4" />
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            dashboard.handlePageChange(dashboard.currentPage + 1)
                                        }
                                        disabled={dashboard.currentPage >= dashboard.lastPage}
                                    >
                                        Next
                                        <ChevronRight className="ml-1 h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Create Project Modal */}
            <Modal
                show={dashboard.projectModalOpen}
                onClose={dashboard.closeProjectModal}
                maxWidth="lg"
            >
                <form onSubmit={dashboard.createProject} className="space-y-5 p-6 sm:p-7">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                            Create Project
                        </p>
                        <h2 className="mt-1 text-base font-semibold">
                            Provision a new project workspace
                        </h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Create a project shell first, then attach workflows and revision-tracked
                            process maps.
                        </p>
                    </div>

                    <label className="block text-sm font-medium text-foreground">
                        Project Name
                        <Input
                            value={dashboard.projectName}
                            onChange={event => dashboard.setProjectName(event.target.value)}
                            required
                            disabled={!dashboard.canCreateProjects || dashboard.pendingProject}
                            className="mt-1.5"
                            data-testid="project-name-input"
                        />
                    </label>

                    <label className="block text-sm font-medium text-foreground">
                        Description
                        <textarea
                            value={dashboard.projectDescription}
                            onChange={event => dashboard.setProjectDescription(event.target.value)}
                            disabled={!dashboard.canCreateProjects || dashboard.pendingProject}
                            className="mt-1.5 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            data-testid="project-description-input"
                        />
                    </label>

                    <div className="flex items-center gap-3">
                        <Switch
                            id="project-is-public"
                            checked={dashboard.projectIsPublic}
                            onCheckedChange={checked => dashboard.setProjectIsPublic(checked)}
                            disabled={!dashboard.canCreateProjects || dashboard.pendingProject}
                        />
                        <label htmlFor="project-is-public" className="text-sm text-foreground">
                            Public project
                        </label>
                        <p className="text-xs text-muted-foreground">
                            All registered users will be able to view this project.
                        </p>
                    </div>

                    {dashboard.projectError && (
                        <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                            {dashboard.projectError}
                        </p>
                    )}

                    <div className="flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={dashboard.closeProjectModal}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={!dashboard.canCreateProjects || dashboard.pendingProject}
                            data-testid="create-project-submit"
                        >
                            Create Project
                        </Button>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
