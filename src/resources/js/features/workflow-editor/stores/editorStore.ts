import { create } from 'zustand';
import type { WorkflowNodeKind, InspectorTab, GraphState } from '@/features/workflow-editor/types';
import type { WorkflowRevisionSummary, Screen } from '@/types/processAtlas';

interface EditorUiState {
    // Permissions
    canEditInProject: boolean;
    canPublishWorkflows: boolean;
    canEditWorkflows: boolean;

    // Selection
    selectedNodeId: string | null;
    selectedEdgeId: string | null;
    inspectorTab: InspectorTab;

    // Data
    screens: Screen[];

    // UI
    actionError: string | null;
    actionNotice: string | null;
    isRunningAction: boolean;
    revisionsPanelOpen: boolean;
    draftModalOpen: boolean;
    draftNameInput: string;
    draftSourceRevisionId: number | undefined;
    publishConfirmOpen: boolean;
    publishConfirmInput: string;
    previewImageUrl: string | null;
    edgeDraftLabel: string;

    // Revisions
    activeRevisionId: number | null;
    editingDraftName: string;
    previewRevision: WorkflowRevisionSummary | null;

    // Graph UI
    graphState: GraphState;
    graphMessage: string;
    lastSavedAt: string | null;
}

interface EditorActions {
    initPermissions: (
        currentUserRole: 'process_owner' | 'editor' | 'viewer' | null,
        latestRevision: WorkflowRevisionSummary | null,
        isArchived: boolean
    ) => void;
    setCanEditWorkflows: (canEdit: boolean) => void;

    selectNode: (nodeId: string | null, nodeKind?: WorkflowNodeKind) => void;
    selectEdge: (edgeId: string | null) => void;
    clearSelection: () => void;
    setInspectorTab: (tab: InspectorTab) => void;

    setScreens: (updater: Screen[] | ((prev: Screen[]) => Screen[])) => void;
    updateScreen: (updatedScreen: Screen) => void;

    setActionError: (error: string | null) => void;
    setActionNotice: (notice: string | null) => void;
    setIsRunningAction: (running: boolean) => void;

    setRevisionsPanelOpen: (open: boolean) => void;
    setDraftModalOpen: (open: boolean) => void;
    setDraftNameInput: (name: string) => void;
    setDraftSourceRevisionId: (id: number | undefined) => void;
    setPublishConfirmOpen: (open: boolean) => void;
    setPublishConfirmInput: (input: string) => void;
    setPreviewImageUrl: (url: string | null) => void;
    setEdgeDraftLabel: (label: string) => void;

    setActiveRevisionId: (id: number | null) => void;
    setEditingDraftName: (name: string) => void;
    setPreviewRevision: (revision: WorkflowRevisionSummary | null) => void;

    setGraphState: (state: GraphState) => void;
    setGraphMessage: (message: string) => void;
    setLastSavedAt: (timestamp: string | null) => void;

    resetUi: () => void;
}

const defaultInspectorTab = (nodeKind: WorkflowNodeKind): InspectorTab => {
    if (nodeKind === 'screen') return 'screen';
    if (nodeKind === 'action' || nodeKind === 'start') return 'general';
    return 'general';
};

const initialState: EditorUiState = {
    canEditInProject: false,
    canPublishWorkflows: false,
    canEditWorkflows: false,

    selectedNodeId: null,
    selectedEdgeId: null,
    inspectorTab: 'general',

    screens: [],

    actionError: null,
    actionNotice: null,
    isRunningAction: false,
    revisionsPanelOpen: false,
    draftModalOpen: false,
    draftNameInput: '',
    draftSourceRevisionId: undefined,
    publishConfirmOpen: false,
    publishConfirmInput: '',
    previewImageUrl: null,
    edgeDraftLabel: '',

    activeRevisionId: null,
    editingDraftName: '',
    previewRevision: null,

    graphState: 'saved',
    graphMessage: 'No pending canvas changes.',
    lastSavedAt: null,
};

export const useEditorStore = create<EditorUiState & EditorActions>((set, get) => ({
    ...initialState,

    initPermissions: (currentUserRole, latestRevision, isArchived) => {
        const canEditInProject =
            currentUserRole === 'process_owner' || currentUserRole === 'editor';
        const canPublishWorkflows = currentUserRole === 'process_owner';
        const canEditWorkflows =
            canEditInProject &&
            latestRevision?.is_published !== true &&
            latestRevision?.is_locked !== true &&
            get().previewRevision === null &&
            !isArchived;

        set({
            canEditInProject,
            canPublishWorkflows,
            canEditWorkflows,
            activeRevisionId: latestRevision?.id ?? null,
            editingDraftName: latestRevision?.draft_name ?? '',
        });
    },

    setCanEditWorkflows: canEditWorkflows => set({ canEditWorkflows }),

    selectNode: (nodeId, nodeKind) =>
        set({
            selectedNodeId: nodeId,
            selectedEdgeId: null,
            inspectorTab: nodeKind ? defaultInspectorTab(nodeKind) : get().inspectorTab,
        }),

    selectEdge: edgeId =>
        set({
            selectedEdgeId: edgeId,
            selectedNodeId: null,
        }),

    clearSelection: () =>
        set({
            selectedNodeId: null,
            selectedEdgeId: null,
        }),

    setInspectorTab: inspectorTab => set({ inspectorTab }),

    setScreens: updater =>
        set(state => ({
            screens: typeof updater === 'function' ? updater(state.screens) : updater,
        })),
    updateScreen: updatedScreen =>
        set(state => ({
            screens: state.screens.map(s => (s.id === updatedScreen.id ? updatedScreen : s)),
        })),

    setActionError: actionError => set({ actionError }),
    setActionNotice: actionNotice => set({ actionNotice }),
    setIsRunningAction: isRunningAction => set({ isRunningAction }),

    setRevisionsPanelOpen: revisionsPanelOpen => set({ revisionsPanelOpen }),
    setDraftModalOpen: draftModalOpen => set({ draftModalOpen }),
    setDraftNameInput: draftNameInput => set({ draftNameInput }),
    setDraftSourceRevisionId: draftSourceRevisionId => set({ draftSourceRevisionId }),
    setPublishConfirmOpen: publishConfirmOpen => set({ publishConfirmOpen }),
    setPublishConfirmInput: publishConfirmInput => set({ publishConfirmInput }),
    setPreviewImageUrl: previewImageUrl => set({ previewImageUrl }),
    setEdgeDraftLabel: edgeDraftLabel => set({ edgeDraftLabel }),

    setActiveRevisionId: activeRevisionId => set({ activeRevisionId }),
    setEditingDraftName: editingDraftName => set({ editingDraftName }),
    setPreviewRevision: previewRevision => set({ previewRevision }),

    setGraphState: graphState => set({ graphState }),
    setGraphMessage: graphMessage => set({ graphMessage }),
    setLastSavedAt: lastSavedAt => set({ lastSavedAt }),

    resetUi: () => set(initialState),
}));
