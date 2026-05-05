import { useEffect } from 'react';
import Modal from '@/Components/Modal';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Switch } from '@/Components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/Components/ui/table';
import { useProjectSettings } from './useProjectSettings';
import { PROJECT_ROLE_LABELS } from '@/shared/lib/projectPermissions';
import type { ProjectRole } from '@/types/processAtlas';
import { Archive, RotateCcw, Trash2, UserPlus } from 'lucide-react';

interface ProjectSettingsModalProps {
    projectId: string;
    projectName: string;
    projectDescription: string | null;
    isPublic: boolean;
    isArchived: boolean;
    isOpen: boolean;
    onClose: () => void;
    canManage: boolean;
}

export default function ProjectSettingsModal({
    projectId,
    projectName: initialName,
    projectDescription: initialDescription,
    isPublic: initialIsPublic,
    isArchived,
    isOpen,
    onClose,
    canManage,
}: ProjectSettingsModalProps) {
    const settings = useProjectSettings(projectId, isOpen, onClose);

    // Initialize general settings when modal opens
    useEffect(() => {
        if (isOpen) {
            settings.setProjectName(initialName);
            settings.setProjectDescription(initialDescription ?? '');
            settings.setProjectIsPublic(initialIsPublic);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, initialName, initialDescription, initialIsPublic]);

    return (
        <Modal show={isOpen} onClose={onClose} maxWidth="5xl">
            <div className="max-h-[85vh] overflow-y-auto p-6 sm:p-7">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Project Settings
                </p>
                <h2 className="mt-1 text-base font-semibold">{initialName}</h2>

                <Tabs
                    value={settings.activeTab}
                    onValueChange={v => settings.setActiveTab(v as 'general' | 'members')}
                    className="mt-6"
                >
                    <TabsList>
                        <TabsTrigger value="general">General</TabsTrigger>
                        <TabsTrigger value="members">Members</TabsTrigger>
                    </TabsList>

                    <TabsContent value="general" className="mt-4 space-y-5">
                        <label className="block text-sm font-medium text-foreground">
                            Project Name
                            <Input
                                value={settings.projectName}
                                onChange={e => settings.setProjectName(e.target.value)}
                                disabled={!canManage || isArchived}
                                className="mt-1.5"
                            />
                        </label>

                        <label className="block text-sm font-medium text-foreground">
                            Description
                            <textarea
                                value={settings.projectDescription}
                                onChange={e => settings.setProjectDescription(e.target.value)}
                                disabled={!canManage || isArchived}
                                className="mt-1.5 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </label>

                        <div className="flex items-center gap-3">
                            <Switch
                                id="settings-is-public"
                                checked={settings.projectIsPublic}
                                onCheckedChange={checked => settings.setProjectIsPublic(checked)}
                                disabled={!canManage || isArchived}
                            />
                            <label htmlFor="settings-is-public" className="text-sm text-foreground">
                                Public project
                            </label>
                            <p className="text-xs text-muted-foreground">
                                All registered users can view this project.
                            </p>
                        </div>

                        {canManage && !isArchived && (
                            <div className="flex justify-end gap-3 pt-2">
                                <Button
                                    variant="outline"
                                    onClick={settings.saveGeneral}
                                    disabled={settings.savingGeneral}
                                >
                                    Save Changes
                                </Button>
                            </div>
                        )}

                        {settings.generalError && (
                            <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                                {settings.generalError}
                            </p>
                        )}

                        {/* Archive / Unarchive */}
                        <div className="border-t pt-5">
                            {isArchived ? (
                                <div className="space-y-3">
                                    <p className="text-sm text-muted-foreground">
                                        This project is archived. All workflows are read-only.
                                    </p>
                                    {canManage && (
                                        <Button
                                            variant="outline"
                                            onClick={settings.unarchiveProject}
                                            disabled={settings.archiving}
                                        >
                                            <RotateCcw className="mr-1.5 h-4 w-4" />
                                            Unarchive Project
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <p className="text-sm text-muted-foreground">
                                        Archiving will make this project and all its workflows
                                        read-only.
                                    </p>
                                    {canManage && (
                                        <Button
                                            variant="destructive"
                                            onClick={() => settings.setShowArchiveConfirm(true)}
                                            disabled={settings.archiving}
                                        >
                                            <Archive className="mr-1.5 h-4 w-4" />
                                            Archive Project
                                        </Button>
                                    )}
                                </div>
                            )}
                            {settings.archiveError && (
                                <p className="mt-2 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                                    {settings.archiveError}
                                </p>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="members" className="mt-4 space-y-5">
                        {canManage && !isArchived && (
                            <div className="flex gap-3">
                                <Input
                                    placeholder="Email address"
                                    value={settings.newMemberEmail}
                                    onChange={e => settings.setNewMemberEmail(e.target.value)}
                                    className="flex-1"
                                />
                                <Select
                                    value={settings.newMemberRole}
                                    onValueChange={v => settings.setNewMemberRole(v as ProjectRole)}
                                >
                                    <SelectTrigger className="w-[160px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="process_owner">Process Owner</SelectItem>
                                        <SelectItem value="editor">Editor</SelectItem>
                                        <SelectItem value="viewer">Viewer</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button
                                    onClick={settings.addMember}
                                    disabled={
                                        settings.addingMember || !settings.newMemberEmail.trim()
                                    }
                                >
                                    <UserPlus className="mr-1.5 h-4 w-4" />
                                    Add
                                </Button>
                            </div>
                        )}

                        {settings.membersError && (
                            <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                                {settings.membersError}
                            </p>
                        )}

                        {settings.loadingMembers ? (
                            <p className="text-sm text-muted-foreground">Loading members...</p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {settings.members.map(member => (
                                        <TableRow key={member.id}>
                                            <TableCell>{member.name}</TableCell>
                                            <TableCell>{member.email}</TableCell>
                                            <TableCell>
                                                {canManage && !isArchived ? (
                                                    <Select
                                                        value={member.role}
                                                        onValueChange={v =>
                                                            settings.updateMemberRole(
                                                                member.id,
                                                                v as ProjectRole
                                                            )
                                                        }
                                                    >
                                                        <SelectTrigger className="w-[160px]">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="process_owner">
                                                                Process Owner
                                                            </SelectItem>
                                                            <SelectItem value="editor">
                                                                Editor
                                                            </SelectItem>
                                                            <SelectItem value="viewer">
                                                                Viewer
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                ) : (
                                                    <span className="text-sm">
                                                        {PROJECT_ROLE_LABELS[member.role]}
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {canManage && !isArchived && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            settings.removeMember(member.id)
                                                        }
                                                        className="text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {settings.members.length === 0 && (
                                        <TableRow>
                                            <TableCell
                                                colSpan={4}
                                                className="text-center text-sm text-muted-foreground"
                                            >
                                                No members found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </TabsContent>
                </Tabs>

                {/* Archive Confirmation */}
                <Modal
                    show={settings.showArchiveConfirm}
                    onClose={() => settings.setShowArchiveConfirm(false)}
                    maxWidth="md"
                >
                    <div className="space-y-5 p-6 sm:p-7">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                Archive Project
                            </p>
                            <h3 className="mt-1 text-base font-semibold">Are you sure?</h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                This will archive the project and all its workflows. They will
                                become read-only.
                            </p>
                        </div>
                        <div className="flex justify-end gap-3">
                            <Button
                                variant="outline"
                                onClick={() => settings.setShowArchiveConfirm(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={settings.archiveProject}
                                disabled={settings.archiving}
                            >
                                Archive Project
                            </Button>
                        </div>
                    </div>
                </Modal>
            </div>
        </Modal>
    );
}
