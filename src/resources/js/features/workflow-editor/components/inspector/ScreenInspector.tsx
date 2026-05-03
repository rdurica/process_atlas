import type { ScreenCustomField, ScreenInspectorProps } from './types';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import { Textarea } from '@/Components/ui/textarea';
import { cn } from '@/lib/utils';
import { Upload, ImageIcon, Search, Trash2, X, Check, Pencil } from 'lucide-react';
import { useEffect, useState } from 'react';
import DrawingEditorModal from '@/features/workflow-editor/components/modals/DrawingEditorModal';

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
    const [activeVisualTab, setActiveVisualTab] = useState<'image' | 'drawing'>('image');
    const [drawingModalOpen, setDrawingModalOpen] = useState(false);

    useEffect(() => {
        if (!selectedScreen) {
            return;
        }
        setActiveVisualTab(selectedScreen.image_url ? 'image' : 'drawing');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedScreen?.node_id]);

    return (
        <div className="mt-5 flex flex-1 flex-col gap-4">
            {inspectorTab === 'screen' && (
                <form onSubmit={screenEditor.upsertScreen} className="space-y-4">
                    {/* Visual preview section */}
                    <div className="space-y-2">
                        <div className="flex gap-1 rounded-lg border bg-card p-1">
                            <button
                                type="button"
                                onClick={() => setActiveVisualTab('image')}
                                className={cn(
                                    'flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
                                    activeVisualTab === 'image'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-muted-foreground hover:bg-accent'
                                )}
                            >
                                <ImageIcon className="h-3.5 w-3.5" />
                                Image
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveVisualTab('drawing')}
                                className={cn(
                                    'flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
                                    activeVisualTab === 'drawing'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-muted-foreground hover:bg-accent'
                                )}
                            >
                                <Pencil className="h-3.5 w-3.5" />
                                Drawing
                            </button>
                        </div>

                        {activeVisualTab === 'image' && (
                            <>
                                <ScreenPreview
                                    selectedScreenImageUrl={selectedScreen?.image_url ?? null}
                                    drawingImageUrl={null}
                                    imageFile={screenEditor.imageFile}
                                    title={screenEditor.title}
                                    subtitle={screenEditor.subtitle}
                                    setPreviewImageUrl={setPreviewImageUrl}
                                />
                                <div className="flex flex-col items-center gap-2">
                                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border bg-muted px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary">
                                        <Upload className="h-4 w-4" />
                                        {screenEditor.imageFile
                                            ? 'Change image'
                                            : 'Upload screen image'}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            disabled={!canEditWorkflows}
                                            className="hidden"
                                            onChange={event => {
                                                const file = event.target.files?.[0] ?? null;
                                                screenEditor.setImageFile(file);
                                            }}
                                        />
                                    </label>
                                    {screenEditor.imageFile && (
                                        <span className="text-xs text-muted-foreground">
                                            {screenEditor.imageFile.name}
                                        </span>
                                    )}
                                </div>
                            </>
                        )}

                        {activeVisualTab === 'drawing' && (
                            <div className="space-y-2">
                                <ScreenPreview
                                    selectedScreenImageUrl={null}
                                    drawingImageUrl={selectedScreen?.drawing_image_url ?? null}
                                    imageFile={null}
                                    title={screenEditor.title}
                                    subtitle={screenEditor.subtitle}
                                    setPreviewImageUrl={setPreviewImageUrl}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => setDrawingModalOpen(true)}
                                    disabled={!canEditWorkflows}
                                >
                                    <Pencil className="mr-1.5 h-4 w-4" />
                                    {selectedScreen?.drawing_json
                                        ? 'Edit Drawing'
                                        : 'Create Drawing'}
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label>Title</Label>
                        <Input
                            value={screenEditor.title}
                            onChange={event => screenEditor.setTitle(event.target.value)}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label>Subtitle</Label>
                        <Input
                            value={screenEditor.subtitle}
                            onChange={event => screenEditor.setSubtitle(event.target.value)}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label>Note</Label>
                        <Textarea
                            value={screenEditor.note}
                            onChange={event => screenEditor.setNote(event.target.value)}
                            className="min-h-[8rem]"
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={!canEditWorkflows || screenEditor.isSavingScreen}
                    >
                        <Check className="mr-1.5 h-4 w-4" />
                        Save Screen
                    </Button>
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
                <div className="space-y-1.5">
                    <Label>Security rule (additional)</Label>
                    <Textarea
                        value={(selectedNode.data.security_rule as string | undefined | null) ?? ''}
                        onChange={event =>
                            updateNodeData({
                                security_rule:
                                    event.target.value.length > 0 ? event.target.value : null,
                            })
                        }
                        disabled={!canEditWorkflows}
                        className="min-h-[16rem]"
                    />
                </div>
            )}

            {selectedNode.type !== 'start' && (
                <div className="mt-auto pt-4">
                    <Button
                        type="button"
                        variant="destructive"
                        className="w-full"
                        onClick={() => removeWorkflowNode(selectedNode.id)}
                        disabled={!canEditWorkflows}
                    >
                        <Trash2 className="mr-1.5 h-4 w-4" />
                        Delete Node
                    </Button>
                </div>
            )}

            <DrawingEditorModal
                open={drawingModalOpen}
                onClose={() => setDrawingModalOpen(false)}
                initialShapesJson={selectedScreen?.drawing_json ?? null}
                onSave={async (json, blob) => {
                    screenEditor.setDrawingJson(json);
                    screenEditor.setDrawingChanged(true);
                    await screenEditor.saveDrawingDirect(json, blob);
                    setDrawingModalOpen(false);
                }}
                canEdit={canEditWorkflows}
            />
        </div>
    );
}

function ScreenPreview({
    selectedScreenImageUrl,
    drawingImageUrl,
    imageFile,
    title,
    subtitle,
    setPreviewImageUrl,
}: {
    selectedScreenImageUrl: string | null;
    drawingImageUrl?: string | null;
    imageFile: File | null;
    title: string;
    subtitle: string;
    setPreviewImageUrl: (url: string | null) => void;
}) {
    const previewUrl = imageFile
        ? URL.createObjectURL(imageFile)
        : (selectedScreenImageUrl ?? drawingImageUrl);

    return (
        <div className="flex justify-center py-2">
            <div className="relative w-[11rem] overflow-hidden rounded-[1.5rem] border-[3px] border-foreground shadow-elevated-lg">
                <div className="absolute left-1/2 top-2 z-10 h-1 w-8 -translate-x-1/2 rounded-full bg-foreground" />
                <div className="relative flex aspect-[9/18] w-full flex-col overflow-hidden bg-background">
                    {previewUrl ? (
                        <>
                            <img
                                src={previewUrl}
                                alt="Screen preview"
                                className="absolute inset-0 h-full w-full object-cover"
                            />
                            <button
                                type="button"
                                className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-foreground/60 text-background backdrop-blur-sm transition-colors hover:bg-foreground/80"
                                onClick={() => setPreviewImageUrl(previewUrl)}
                                title="Preview full image"
                            >
                                <Search className="h-3.5 w-3.5" />
                            </button>
                        </>
                    ) : (
                        <div className="flex flex-1 flex-col items-center justify-center gap-2 bg-muted text-muted-foreground">
                            <ImageIcon className="h-8 w-8 opacity-40" />
                            <span className="text-[11px] font-medium">No image</span>
                        </div>
                    )}
                    {(title || subtitle) && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-foreground/80 to-transparent px-3 py-3 text-background">
                            {title && <p className="truncate text-xs font-bold">{title}</p>}
                            {subtitle && (
                                <p className="mt-0.5 truncate text-[10px] opacity-75">{subtitle}</p>
                            )}
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
        <div className="space-y-3">
            {(selectedScreen?.custom_fields ?? []).length > 0 ? (
                <div className="space-y-2">
                    {(selectedScreen?.custom_fields ?? []).map(field => (
                        <button
                            key={field.id}
                            type="button"
                            className={cn(
                                'w-full rounded-lg border p-3 text-left transition-all',
                                screenEditor.editingFieldId === field.id
                                    ? 'border-primary/30 bg-primary/5 ring-1 ring-primary/20'
                                    : 'border-border bg-card hover:bg-accent/50'
                            )}
                            onClick={() => {
                                if (canEditWorkflows) {
                                    screenEditor.openEditFieldEditor(field);
                                }
                            }}
                            disabled={!canEditWorkflows}
                        >
                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-foreground">
                                    {field.key}
                                </p>
                                <p className="truncate text-xs text-muted-foreground">
                                    {field.value || 'No value'} / {field.field_type}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            ) : (
                <div className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
                    No custom fields on this screen yet.
                </div>
            )}

            {screenEditor.fieldEditorMode === 'hidden' ? (
                <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={screenEditor.openCreateFieldEditor}
                    disabled={!canEditWorkflows}
                >
                    Add Field
                </Button>
            ) : (
                <form
                    onSubmit={screenEditor.submitFieldEditor}
                    className="space-y-4 rounded-lg border bg-card p-4"
                >
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                            Custom Field
                        </p>
                        <h3 className="mt-1 text-sm font-bold text-foreground">
                            {screenEditor.fieldEditorMode === 'edit' ? 'Edit Field' : 'Add Field'}
                        </h3>
                    </div>

                    <div className="space-y-1.5">
                        <Label>Field key</Label>
                        <Input
                            value={screenEditor.newCustomKey}
                            onChange={event => screenEditor.setNewCustomKey(event.target.value)}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label>Field type</Label>
                        <Select
                            value={screenEditor.newCustomFieldType}
                            onValueChange={value =>
                                screenEditor.setNewCustomFieldType(
                                    value as ScreenCustomField['field_type']
                                )
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="text">Text</SelectItem>
                                <SelectItem value="number">Number</SelectItem>
                                <SelectItem value="boolean">Boolean</SelectItem>
                                <SelectItem value="json">JSON</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label>Field value</Label>
                        <Textarea
                            value={screenEditor.newCustomValue}
                            onChange={event => screenEditor.setNewCustomValue(event.target.value)}
                        />
                    </div>

                    <div className="flex justify-end gap-2">
                        {screenEditor.fieldEditorMode === 'edit' && screenEditor.editingField && (
                            <Button
                                type="button"
                                variant="destructive"
                                size="sm"
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
                            >
                                <Trash2 className="mr-1 h-3.5 w-3.5" />
                                Delete
                            </Button>
                        )}
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={screenEditor.closeFieldEditor}
                        >
                            <X className="mr-1 h-3.5 w-3.5" />
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            disabled={!canEditWorkflows || !screenEditor.newCustomKey.trim()}
                        >
                            <Check className="mr-1 h-3.5 w-3.5" />
                            Save
                        </Button>
                    </div>
                </form>
            )}
        </div>
    );
}
