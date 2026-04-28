import { router, usePage } from '@inertiajs/react';
import { FormEvent, useMemo, useState } from 'react';
import type { PageProps } from '@/types';
import { processAtlasApi } from '@/shared/api/processAtlasApi';
import { resolveApiError } from '@/shared/lib/apiErrors';
import type { DashboardProps, DashboardStatusFilter } from './types';

export function useDashboard({ summary, projects }: DashboardProps) {
    const page = usePage<PageProps>();
    const permissions = new Set(page.props.auth.user?.permissions ?? []);
    const canCreateProjects = permissions.has('projects.create');

    const [statusFilter, setStatusFilter] = useState<DashboardStatusFilter>('all');
    const [query, setQuery] = useState('');
    const [projectModalOpen, setProjectModalOpen] = useState(false);
    const [projectName, setProjectName] = useState('');
    const [projectDescription, setProjectDescription] = useState('');
    const [pendingProject, setPendingProject] = useState(false);
    const [projectError, setProjectError] = useState<string | null>(null);

    const metrics = useMemo(
        () => [
            {
                label: 'Projects',
                value: summary.projects,
                detail: 'Active workspaces across the control plane.',
                accentClass: 'metric-card-projects',
            },
            {
                label: 'Workflows',
                value: summary.workflows,
                detail: 'Modeled processes currently available to teams.',
                accentClass: 'metric-card-workflows',
            },
            {
                label: 'Draft Revisions',
                value: summary.draft_revisions,
                detail: 'Unpublished changes waiting for review or release.',
                accentClass: 'metric-card-drafts',
            },
            {
                label: 'Published Workflows',
                value: summary.published_workflows,
                detail: 'Processes with a live published revision.',
                accentClass: 'metric-card-published',
            },
        ],
        [summary]
    );

    const filteredProjects = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();

        return projects.filter(project => {
            const matchesQuery =
                normalizedQuery.length === 0 ||
                project.name.toLowerCase().includes(normalizedQuery) ||
                (project.description ?? '').toLowerCase().includes(normalizedQuery);

            if (!matchesQuery) {
                return false;
            }

            if (statusFilter === 'all') {
                return true;
            }

            if (statusFilter === 'empty') {
                return project.workflows_count === 0;
            }

            return project.workflows.some(workflow => workflow.status === statusFilter);
        });
    }, [projects, query, statusFilter]);

    const closeProjectModal = () => {
        setProjectModalOpen(false);
        setProjectError(null);
        setProjectName('');
        setProjectDescription('');
    };

    const createProject = async (event: FormEvent) => {
        event.preventDefault();

        if (!canCreateProjects) {
            setProjectError('You do not have permission to create projects.');
            return;
        }

        setPendingProject(true);
        setProjectError(null);

        try {
            await processAtlasApi.projects.create({
                name: projectName,
                description: projectDescription || null,
            });

            closeProjectModal();
            router.reload({ only: ['summary', 'projects'] });
        } catch (error) {
            setProjectError(resolveApiError(error, 'The project could not be created.'));
        } finally {
            setPendingProject(false);
        }
    };

    return {
        canCreateProjects,
        metrics,
        filteredProjects,
        statusFilter,
        setStatusFilter,
        query,
        setQuery,
        projectModalOpen,
        setProjectModalOpen,
        projectName,
        setProjectName,
        projectDescription,
        setProjectDescription,
        pendingProject,
        projectError,
        closeProjectModal,
        createProject,
    };
}
