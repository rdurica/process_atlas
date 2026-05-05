import { useState, useCallback, useEffect } from 'react';
import { processAtlasApi } from '@/shared/api/processAtlasApi';
import { resolveApiError } from '@/shared/lib/apiErrors';
import type { ProjectMember, ProjectRole } from '@/types/processAtlas';

export function useProjectSettings(projectId: string, isOpen: boolean, onClose: () => void) {
    const [activeTab, setActiveTab] = useState<'general' | 'members'>('general');
    const [members, setMembers] = useState<ProjectMember[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [membersError, setMembersError] = useState<string | null>(null);

    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [newMemberRole, setNewMemberRole] = useState<ProjectRole>('viewer');
    const [addingMember, setAddingMember] = useState(false);

    const [projectName, setProjectName] = useState('');
    const [projectDescription, setProjectDescription] = useState('');
    const [projectIsPublic, setProjectIsPublic] = useState(false);
    const [savingGeneral, setSavingGeneral] = useState(false);
    const [generalError, setGeneralError] = useState<string | null>(null);

    const [archiving, setArchiving] = useState(false);
    const [archiveError, setArchiveError] = useState<string | null>(null);
    const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);

    const loadMembers = useCallback(async () => {
        if (!isOpen) return;
        setLoadingMembers(true);
        setMembersError(null);
        try {
            const response = await processAtlasApi.projects.members(projectId);
            setMembers(response.data.data);
        } catch {
            setMembersError('Failed to load members.');
        } finally {
            setLoadingMembers(false);
        }
    }, [projectId, isOpen]);

    useEffect(() => {
        if (isOpen && activeTab === 'members') {
            loadMembers();
        }
    }, [isOpen, activeTab, loadMembers]);

    const addMember = async () => {
        if (!newMemberEmail.trim()) return;
        setAddingMember(true);
        setMembersError(null);
        try {
            await processAtlasApi.projects.addMember(projectId, {
                email: newMemberEmail.trim(),
                role: newMemberRole,
            });
            setNewMemberEmail('');
            setNewMemberRole('viewer');
            await loadMembers();
        } catch (error) {
            setMembersError(resolveApiError(error, 'Failed to add member.'));
        } finally {
            setAddingMember(false);
        }
    };

    const updateMemberRole = async (userId: string, role: ProjectRole) => {
        setMembersError(null);
        try {
            await processAtlasApi.projects.updateMember(projectId, userId, { role });
            await loadMembers();
        } catch (error) {
            setMembersError(resolveApiError(error, 'Failed to update member role.'));
        }
    };

    const removeMember = async (userId: string) => {
        setMembersError(null);
        try {
            await processAtlasApi.projects.removeMember(projectId, userId);
            await loadMembers();
        } catch (error) {
            setMembersError(resolveApiError(error, 'Failed to remove member.'));
        }
    };

    const saveGeneral = async () => {
        setSavingGeneral(true);
        setGeneralError(null);
        try {
            await processAtlasApi.projects.update(projectId, {
                name: projectName || undefined,
                description: projectDescription || null,
                is_public: projectIsPublic,
            });
        } catch (error) {
            setGeneralError(resolveApiError(error, 'Failed to save settings.'));
        } finally {
            setSavingGeneral(false);
        }
    };

    const archiveProject = async () => {
        setArchiving(true);
        setArchiveError(null);
        try {
            await processAtlasApi.projects.archive(projectId);
            setShowArchiveConfirm(false);
            onClose();
            window.location.reload();
        } catch (error) {
            setArchiveError(resolveApiError(error, 'Failed to archive project.'));
        } finally {
            setArchiving(false);
        }
    };

    const unarchiveProject = async () => {
        setArchiving(true);
        setArchiveError(null);
        try {
            await processAtlasApi.projects.unarchive(projectId);
            onClose();
            window.location.reload();
        } catch (error) {
            setArchiveError(resolveApiError(error, 'Failed to unarchive project.'));
        } finally {
            setArchiving(false);
        }
    };

    return {
        activeTab,
        setActiveTab,
        members,
        loadingMembers,
        membersError,
        newMemberEmail,
        setNewMemberEmail,
        newMemberRole,
        setNewMemberRole,
        addingMember,
        addMember,
        updateMemberRole,
        removeMember,
        projectName,
        setProjectName,
        projectDescription,
        setProjectDescription,
        projectIsPublic,
        setProjectIsPublic,
        savingGeneral,
        generalError,
        saveGeneral,
        archiving,
        archiveError,
        showArchiveConfirm,
        setShowArchiveConfirm,
        archiveProject,
        unarchiveProject,
    };
}
