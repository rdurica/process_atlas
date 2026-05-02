import Modal from '@/Components/Modal';
import StatusBadge from '@/Components/StatusBadge';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { canArchiveInProject, canEditInProject } from '@/shared/lib/projectPermissions';
import { formatDateTime } from '@/shared/lib/dates';
import { Head, Link } from '@inertiajs/react';
import {
    useProjectWorkflows,
    workflowTone,
} from '@/features/project-workflows/useProjectWorkflows';
import type { ProjectWorkflowsProps, WorkflowStatusFilter } from './types';
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
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
} from '@/Components/ui/breadcrumb';
import { cn } from '@/lib/utils';
import { Search, Plus, ArrowRight, GitBranch, Archive, RotateCcw } from 'lucide-react';

export default function ProjectWorkflowsPage(props: ProjectWorkflowsProps) {
    const { project, workflows } = props;
    const page = useProjectWorkflows(props);

    return (
        <AuthenticatedLayout
            contentWidth="wide"
            header={
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink asChild>
                                        <Link href={route('dashboard')}>Projects</Link>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <span className="text-foreground">{project.name}</span>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                            {project.name}
                        </h1>
                        {project.description && (
                            <p className="mt-1 text-sm text-muted-foreground">
                                {project.description}
                            </p>
                        )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        {canEditInProject(project.current_user_role) && (
                            <Button
                                onClick={() => page.setWorkflowModalOpen(true)}
                                data-testid="create-workflow-open"
                            >
                                <Plus className="mr-1.5 h-4 w-4" />
                                New Workflow
                            </Button>
                        )}
                    </div>
                </div>
            }
        >
            <Head title={project.name} />

            <div className="space-y-8">
                <Card>
                    <CardHeader>
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                    Workflows
                                </p>
                                <CardTitle className="mt-1 text-base">{project.name}</CardTitle>
                            </div>

                            <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row lg:items-center">
                                <div className="relative min-w-[260px] lg:w-[320px]">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        value={page.query}
                                        onChange={event => page.setQuery(event.target.value)}
                                        placeholder="Search workflows"
                                        className="pl-9"
                                    />
                                </div>
                                <Select
                                    value={page.statusFilter}
                                    onValueChange={value =>
                                        page.setStatusFilter(value as WorkflowStatusFilter)
                                    }
                                >
                                    <SelectTrigger className="min-w-[180px]">
                                        <SelectValue placeholder="All statuses" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All statuses</SelectItem>
                                        <SelectItem value="published">Published</SelectItem>
                                        <SelectItem value="draft">Draft</SelectItem>
                                    </SelectContent>
                                </Select>
                                <div className="flex items-center gap-2">
                                    <Switch
                                        id="show-archived"
                                        checked={page.showArchived}
                                        onCheckedChange={checked => page.setShowArchived(checked)}
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
                        {page.displayedWorkflows.length === 0 ? (
                            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
                                <GitBranch className="h-8 w-8 text-muted-foreground/50" />
                                <p className="mt-2 text-sm text-muted-foreground">
                                    {workflows.length === 0 && !page.showArchived
                                        ? 'This project does not have any workflows yet.'
                                        : 'No workflows match the current filters.'}
                                </p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Revision</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Last Updated</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {page.displayedWorkflows.map(workflow => {
                                        const isArchived = !!workflow.archived_at;

                                        return (
                                            <TableRow
                                                key={workflow.id}
                                                className={isArchived ? 'bg-muted/30' : ''}
                                            >
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className={cn(
                                                                'font-semibold',
                                                                isArchived
                                                                    ? 'text-muted-foreground'
                                                                    : 'text-foreground'
                                                            )}
                                                        >
                                                            {workflow.name}
                                                        </span>
                                                        {isArchived && (
                                                            <Badge variant="secondary">
                                                                Archived
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <StatusBadge
                                                        tone={isArchived ? 'neutral' : 'brand'}
                                                    >
                                                        {workflow.published_revision
                                                            ? `rev. ${workflow.published_revision.revision_number}`
                                                            : 'No revision'}
                                                    </StatusBadge>
                                                </TableCell>
                                                <TableCell>
                                                    <StatusBadge
                                                        tone={
                                                            isArchived
                                                                ? 'neutral'
                                                                : workflowTone(workflow.status)
                                                        }
                                                    >
                                                        {workflow.status}
                                                    </StatusBadge>
                                                </TableCell>
                                                <TableCell>
                                                    <p className="text-sm text-muted-foreground">
                                                        {formatDateTime(
                                                            workflow.updated_at,
                                                            'No recent changes'
                                                        )}
                                                    </p>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button variant="outline" size="sm" asChild>
                                                            <Link
                                                                href={route('workflows.editor', {
                                                                    workflow: workflow.id,
                                                                })}
                                                                data-testid="open-workflow-editor"
                                                            >
                                                                Open Editor
                                                                <ArrowRight className="ml-1 h-3 w-3" />
                                                            </Link>
                                                        </Button>
                                                        {canArchiveInProject(
                                                            project.current_user_role
                                                        ) &&
                                                            (isArchived ? (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() =>
                                                                        page.unarchiveWorkflow(
                                                                            workflow.id
                                                                        )
                                                                    }
                                                                    disabled={page.pendingArchive}
                                                                >
                                                                    <RotateCcw className="mr-1 h-3 w-3" />
                                                                    Unarchive
                                                                </Button>
                                                            ) : (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="text-destructive hover:bg-destructive/10"
                                                                    onClick={() =>
                                                                        page.setConfirmArchiveId(
                                                                            workflow.id
                                                                        )
                                                                    }
                                                                >
                                                                    <Archive className="mr-1 h-3 w-3" />
                                                                    Archive
                                                                </Button>
                                                            ))}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        )}
                        {page.loadingArchived && (
                            <p className="py-4 text-center text-sm text-muted-foreground">
                                Loading archived workflows…
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Modal show={page.workflowModalOpen} onClose={page.closeWorkflowModal} maxWidth="lg">
                <form onSubmit={page.createWorkflow} className="space-y-5 p-6 sm:p-7">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                            Create Workflow
                        </p>
                        <h2 className="mt-1 text-base font-semibold">Open a new process model</h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                            New workflows start in draft mode with an initial revision ready for
                            editing.
                        </p>
                    </div>

                    <label className="block text-sm font-medium text-foreground">
                        Workflow Name
                        <Input
                            value={page.workflowName}
                            onChange={event => page.setWorkflowName(event.target.value)}
                            required
                            disabled={page.pendingWorkflow}
                            className="mt-1.5"
                            data-testid="workflow-name-input"
                        />
                    </label>

                    {page.workflowError && (
                        <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                            {page.workflowError}
                        </p>
                    )}

                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={page.closeWorkflowModal}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={page.pendingWorkflow}
                            data-testid="create-workflow-submit"
                        >
                            Create
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal
                show={page.confirmArchiveId !== null}
                onClose={() => page.setConfirmArchiveId(null)}
                maxWidth="md"
            >
                <div className="space-y-5 p-6 sm:p-7">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                            Archive Workflow
                        </p>
                        <h2 className="mt-1 text-base font-semibold">Are you sure?</h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Archiving will hide this workflow from the default list. It will remain
                            accessible in read-only mode.
                        </p>
                    </div>

                    {page.archiveError && (
                        <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                            {page.archiveError}
                        </p>
                    )}

                    <div className="flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => page.setConfirmArchiveId(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            disabled={page.pendingArchive}
                            onClick={() => {
                                if (page.confirmArchiveId) {
                                    page.archiveWorkflow(page.confirmArchiveId);
                                }
                            }}
                        >
                            Archive
                        </Button>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
