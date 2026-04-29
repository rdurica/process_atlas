import type { ScreenCustomField, ScreenInspectorProps } from './types';

export default function ScreenInspector({
    selectedNode,
    selectedScreen,
    inspectorTab,
    canEditWorkflows,
    screenEditor,
    updateNodeData,
    removeWorkflowNode,
    setPreviewImageUrl,
    setActionNotice,
}: ScreenInspectorProps) {
    return (
        <div className="mt-5 flex flex-1 flex-col space-y-5">
            {inspectorTab === 'screen' && (
                <form onSubmit={screenEditor.upsertScreen} className="space-y-4">
                    <ScreenPreview
                        selectedScreenImageUrl={selectedScreen?.image_url ?? null}
                        imageFile={screenEditor.imageFile}
                        title={screenEditor.title}
                        subtitle={screenEditor.subtitle}
                        setPreviewImageUrl={setPreviewImageUrl}
                    />

                    <div className="screen-image-upload-area">
                        <label className="screen-image-upload-label">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                                style={{ width: '0.9rem', height: '0.9rem', flexShrink: 0 }}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                                />
                            </svg>
                            {screenEditor.imageFile ? 'Change image' : 'Upload screen image'}
                            <input
                                type="file"
                                accept="image/*"
                                disabled={!canEditWorkflows}
                                style={{ display: 'none' }}
                                onChange={event => {
                                    const file = event.target.files?.[0] ?? null;
                                    screenEditor.setImageFile(file);
                                }}
                            />
                        </label>
                        {screenEditor.imageFile && (
                            <span className="screen-image-selected-name">
                                {screenEditor.imageFile.name}
                            </span>
                        )}
                    </div>

                    <label className="block text-sm font-medium text-slate-700">
                        Title
                        <input
                            value={screenEditor.title}
                            onChange={event => screenEditor.setTitle(event.target.value)}
                            className="input-shell mt-2"
                        />
                    </label>

                    <label className="block text-sm font-medium text-slate-700">
                        Subtitle
                        <input
                            value={screenEditor.subtitle}
                            onChange={event => screenEditor.setSubtitle(event.target.value)}
                            className="input-shell mt-2"
                        />
                    </label>

                    <label className="block text-sm font-medium text-slate-700">
                        Description
                        <textarea
                            value={screenEditor.description}
                            onChange={event => screenEditor.setDescription(event.target.value)}
                            className="textarea-shell textarea-shell-large mt-2"
                        />
                    </label>

                    <button
                        type="submit"
                        disabled={!canEditWorkflows || screenEditor.isSavingScreen}
                        className="btn-primary workflow-wide-button"
                    >
                        Save Screen
                    </button>
                </form>
            )}

            {inspectorTab === 'fields' && (
                <CustomFieldsEditor
                    selectedScreen={selectedScreen}
                    canEditWorkflows={canEditWorkflows}
                    screenEditor={screenEditor}
                    setActionNotice={setActionNotice}
                />
            )}

            {inspectorTab === 'security' && (
                <div className="workflow-inline-form workflow-security-form">
                    <label className="workflow-security-label block text-sm font-medium text-slate-700">
                        Security rule (additional)
                        <textarea
                            value={
                                (selectedNode.data.security_rule as string | undefined | null) ?? ''
                            }
                            onChange={event =>
                                updateNodeData({
                                    security_rule:
                                        event.target.value.length > 0 ? event.target.value : null,
                                })
                            }
                            disabled={!canEditWorkflows}
                            className="textarea-shell textarea-shell-security mt-2"
                        />
                    </label>
                </div>
            )}

            {selectedNode.type !== 'start' && (
                <div className="workflow-inline-actions mt-auto">
                    <button
                        type="button"
                        onClick={() => removeWorkflowNode(selectedNode.id)}
                        disabled={!canEditWorkflows}
                        className="btn-danger workflow-wide-button"
                    >
                        Delete Node
                    </button>
                </div>
            )}
        </div>
    );
}

function ScreenPreview({
    selectedScreenImageUrl,
    imageFile,
    title,
    subtitle,
    setPreviewImageUrl,
}: {
    selectedScreenImageUrl: string | null;
    imageFile: File | null;
    title: string;
    subtitle: string;
    setPreviewImageUrl: (url: string | null) => void;
}) {
    const previewUrl = imageFile ? URL.createObjectURL(imageFile) : selectedScreenImageUrl;

    return (
        <div className="screen-phone-mockup">
            <div className="screen-phone-frame">
                <div className="screen-phone-notch" />
                <div className="screen-phone-display">
                    {previewUrl ? (
                        <>
                            <img
                                src={previewUrl}
                                alt="Screen preview"
                                className="screen-phone-image-fill"
                            />
                            <button
                                type="button"
                                className="screen-phone-zoom-btn"
                                onClick={() => setPreviewImageUrl(previewUrl)}
                                title="Preview full image"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={2}
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6"
                                    />
                                </svg>
                            </button>
                        </>
                    ) : (
                        <div className="screen-phone-placeholder">
                            <svg
                                className="screen-phone-placeholder-icon"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={1.5}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 21h18M3.75 3h16.5A.75.75 0 0121 3.75v13.5a.75.75 0 01-.75.75H3.75A.75.75 0 013 17.25V3.75A.75.75 0 013.75 3z"
                                />
                            </svg>
                            No image
                        </div>
                    )}
                    {(title || subtitle) && (
                        <div className="screen-phone-meta-overlay">
                            {title && <p className="screen-phone-meta-title">{title}</p>}
                            {subtitle && <p className="screen-phone-meta-subtitle">{subtitle}</p>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function CustomFieldsEditor({
    selectedScreen,
    canEditWorkflows,
    screenEditor,
    setActionNotice,
}: Pick<
    ScreenInspectorProps,
    'selectedScreen' | 'canEditWorkflows' | 'screenEditor' | 'setActionNotice'
>) {
    return (
        <div className="workflow-compact-list">
            {(selectedScreen?.custom_fields ?? []).length > 0 ? (
                <div className="space-y-2">
                    {(selectedScreen?.custom_fields ?? []).map(field => (
                        <button
                            key={field.id}
                            type="button"
                            className={`workflow-text-row workflow-field-row w-full text-left ${
                                screenEditor.editingFieldId === field.id
                                    ? 'workflow-field-row-active'
                                    : ''
                            }`.trim()}
                            onClick={() => {
                                if (canEditWorkflows) {
                                    screenEditor.openEditFieldEditor(field);
                                }
                            }}
                            disabled={!canEditWorkflows}
                        >
                            <div className="min-w-0">
                                <p className="workflow-text-row-title">{field.key}</p>
                                <p className="workflow-text-row-meta">
                                    {field.value || 'No value'} / {field.field_type}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            ) : (
                <div className="empty-state">No custom fields on this screen yet.</div>
            )}

            {screenEditor.fieldEditorMode === 'hidden' ? (
                <button
                    type="button"
                    onClick={screenEditor.openCreateFieldEditor}
                    disabled={!canEditWorkflows}
                    className="btn-secondary workflow-wide-button"
                >
                    Add Field
                </button>
            ) : (
                <form onSubmit={screenEditor.submitFieldEditor} className="workflow-inline-form">
                    <div>
                        <p className="eyebrow">Custom Field</p>
                        <h3 className="mt-1 text-sm font-bold text-slate-950">
                            {screenEditor.fieldEditorMode === 'edit' ? 'Edit Field' : 'Add Field'}
                        </h3>
                    </div>

                    <label className="block text-sm font-medium text-slate-700">
                        Field key
                        <input
                            value={screenEditor.newCustomKey}
                            onChange={event => screenEditor.setNewCustomKey(event.target.value)}
                            className="input-shell mt-2"
                        />
                    </label>

                    <label className="block text-sm font-medium text-slate-700">
                        Field type
                        <select
                            value={screenEditor.newCustomFieldType}
                            onChange={event =>
                                screenEditor.setNewCustomFieldType(
                                    event.target.value as ScreenCustomField['field_type']
                                )
                            }
                            className="select-shell mt-2"
                        >
                            <option value="text">Text</option>
                            <option value="number">Number</option>
                            <option value="boolean">Boolean</option>
                            <option value="json">JSON</option>
                        </select>
                    </label>

                    <label className="block text-sm font-medium text-slate-700">
                        Field value
                        <textarea
                            value={screenEditor.newCustomValue}
                            onChange={event => screenEditor.setNewCustomValue(event.target.value)}
                            className="textarea-shell mt-2"
                        />
                    </label>

                    <div className="workflow-inline-actions">
                        {screenEditor.fieldEditorMode === 'edit' && screenEditor.editingField && (
                            <button
                                type="button"
                                onClick={async () => {
                                    const removed = await screenEditor.removeCustomField(
                                        screenEditor.editingField!.id
                                    );
                                    if (removed) {
                                        setActionNotice('Custom field deleted.');
                                        screenEditor.closeFieldEditor();
                                    }
                                }}
                                disabled={!canEditWorkflows}
                                className="btn-danger workflow-action-button"
                            >
                                Delete
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={screenEditor.closeFieldEditor}
                            className="btn-secondary workflow-action-button"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!canEditWorkflows || !screenEditor.newCustomKey.trim()}
                            className="btn-primary workflow-action-button"
                        >
                            Save
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
