import { router, usePage } from '@inertiajs/react';
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PageProps } from '@/types';
import { processAtlasApi } from '@/shared/api/processAtlasApi';
import { resolveApiError } from '@/shared/lib/apiErrors';
import type { DashboardProps, DashboardStatusFilter } from './types';

export function useDashboard({ summary, projects, current_page, last_page }: DashboardProps) {
    const page = usePage<PageProps>();
    const permissions = new Set(page.props.auth.user?.permissions ?? []);
    const canCreateProjects = permissions.has('projects.create');

    const [statusFilter, setStatusFilter] = useState<DashboardStatusFilter>('all');
    const [query, setQuery] = useState('');
    const [includeArchived, setIncludeArchived] = useState(false);
    const [projectModalOpen, setProjectModalOpen] = useState(false);
    const [projectName, setProjectName] = useState('');
    const [projectDescription, setProjectDescription] = useState('');
    const [projectIsPublic, setProjectIsPublic] = useState(false);
    const [pendingProject, setPendingProject] = useState(false);
    const [projectError, setProjectError] = useState<string | null>(null);

    const queryRef = useRef(query);
    const statusFilterRef = useRef(statusFilter);
    const includeArchivedRef = useRef(includeArchived);
    const currentPageRef = useRef(current_page);
    const isFirstSearchEffect = useRef(true);

    queryRef.current = query;
    statusFilterRef.current = statusFilter;
    includeArchivedRef.current = includeArchived;
    currentPageRef.current = current_page;

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
                label: 'Released Workflows',
                value: summary.released_workflows,
                detail: 'Processes with a live published revision.',
                accentClass: 'metric-card-published',
            },
            {
                label: 'Unreleased',
                value: summary.unreleased_workflows,
                detail: 'Workflows with unpublished changes.',
                accentClass: 'metric-card-drafts',
            },
        ],
        [summary]
    );

    const reloadWithParams = useCallback(
        (
            newPage?: number,
            newSearch?: string,
            newStatus?: DashboardStatusFilter,
            newArchived?: boolean
        ) => {
            router.reload({
                only: ['summary', 'projects', 'current_page', 'last_page', 'total', 'from', 'to'],
                data: {
                    page: newPage ?? currentPageRef.current,
                    search: newSearch ?? queryRef.current,
                    status: newStatus ?? statusFilterRef.current,
                    include_archived: (newArchived ?? includeArchivedRef.current) ? 1 : undefined,
                },
            });
        },
        []
    );

    const handlePageChange = (newPage: number) => {
        reloadWithParams(newPage);
    };

    const handleSearchChange = (value: string) => {
        setQuery(value);
    };

    useEffect(() => {
        if (isFirstSearchEffect.current) {
            isFirstSearchEffect.current = false;
            return;
        }

        const timer = setTimeout(() => {
            reloadWithParams(1, query);
        }, 400);

        return () => clearTimeout(timer);
    }, [query, reloadWithParams]);

    const handleStatusChange = (value: DashboardStatusFilter) => {
        setStatusFilter(value);
        reloadWithParams(1, undefined, value);
    };

    const handleArchivedChange = (value: boolean) => {
        setIncludeArchived(value);
        reloadWithParams(1, undefined, undefined, value);
    };

    const closeProjectModal = () => {
        setProjectModalOpen(false);
        setProjectError(null);
        setProjectName('');
        setProjectDescription('');
        setProjectIsPublic(false);
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
                is_public: projectIsPublic,
            });

            closeProjectModal();
            router.reload({
                only: ['summary', 'projects', 'current_page', 'last_page', 'total', 'from', 'to'],
            });
        } catch (error) {
            setProjectError(resolveApiError(error, 'The project could not be created.'));
        } finally {
            setPendingProject(false);
        }
    };

    return {
        canCreateProjects,
        metrics,
        projects,
        currentPage: current_page,
        lastPage: last_page,
        statusFilter,
        setStatusFilter: handleStatusChange,
        query,
        setQuery: handleSearchChange,
        includeArchived,
        setIncludeArchived: handleArchivedChange,
        projectModalOpen,
        setProjectModalOpen,
        projectName,
        setProjectName,
        projectDescription,
        setProjectDescription,
        projectIsPublic,
        setProjectIsPublic,
        pendingProject,
        projectError,
        closeProjectModal,
        createProject,
        handlePageChange,
    };
}
