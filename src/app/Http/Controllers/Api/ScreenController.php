<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\UpsertScreenRequest;
use App\Models\Screen;
use App\Models\WorkflowVersion;
use App\Services\Audit\AuditLogger;
use App\Services\ProjectAccessService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ScreenController extends Controller
{
    public function __construct(private readonly ProjectAccessService $access)
    {
    }

    public function show(Request $request, Screen $screen): JsonResponse
    {
        $screen->loadMissing('workflowVersion.workflow.project');
        abort_unless($this->access->canView($request->user(), $screen->workflowVersion->workflow->project), 403, 'Forbidden.');

        $screen->load(['customFields']);

        return response()->json(['data' => $screen]);
    }

    public function upsert(UpsertScreenRequest $request): JsonResponse
    {
        $workflowVersion = WorkflowVersion::with('workflow.project')
            ->findOrFail($request->validated('workflow_version_id'));
        abort_unless($this->access->canEdit($request->user(), $workflowVersion->workflow->project), 403, 'Forbidden.');
        abort_if($workflowVersion->is_published, 422, 'Cannot modify a published version.');

        $validated = $request->validated();

        $screen = Screen::query()->firstOrCreate(
            [
                'workflow_version_id' => $validated['workflow_version_id'],
                'node_id' => $validated['node_id'],
            ],
            [
                'created_by' => $request->user()->id,
            ]
        );

        $imagePath = $screen->image_path;
        if ($request->hasFile('image')) {
            if ($imagePath) {
                Storage::disk('public')->delete($imagePath);
            }
            $imagePath = $request->file('image')->store('screens', 'public');
            $this->resizeImage(Storage::disk('public')->path($imagePath), 1080);
        }

        $screen->update([
            'title' => array_key_exists('title', $validated)
                ? $validated['title']
                : $screen->title,
            'subtitle' => array_key_exists('subtitle', $validated)
                ? $validated['subtitle']
                : $screen->subtitle,
            'description' => array_key_exists('description', $validated)
                ? $validated['description']
                : $screen->description,
            'image_path' => $imagePath,
            'updated_by' => $request->user()->id,
        ]);

        AuditLogger::log($request->user(), $screen, 'updated', 'Screen upserted');

        return response()->json(['data' => $screen->fresh(['customFields'])]);
    }

    public function update(Request $request, Screen $screen): JsonResponse
    {
        $screen->loadMissing('workflowVersion.workflow.project');
        abort_unless($this->access->canEdit($request->user(), $screen->workflowVersion->workflow->project), 403, 'Forbidden.');
        abort_if($screen->workflowVersion->is_published, 422, 'Cannot modify a published version.');

        $data = $request->validate([
            'title' => ['nullable', 'string', 'max:255'],
            'subtitle' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);

        $screen->update([
            ...$data,
            'updated_by' => $request->user()->id,
        ]);

        AuditLogger::log($request->user(), $screen, 'updated', 'Screen updated');

        return response()->json(['data' => $screen->fresh(['customFields'])]);
    }

    private function resizeImage(string $path, int $maxWidth): void
    {
        [$origWidth, $origHeight, $type] = getimagesize($path);

        if ($origWidth <= $maxWidth) {
            return;
        }

        $ratio = $maxWidth / $origWidth;
        $newWidth = $maxWidth;
        $newHeight = (int) round($origHeight * $ratio);

        $dst = imagecreatetruecolor($newWidth, $newHeight);

        switch ($type) {
            case IMAGETYPE_JPEG:
                $src = imagecreatefromjpeg($path);
                imagecopyresampled($dst, $src, 0, 0, 0, 0, $newWidth, $newHeight, $origWidth, $origHeight);
                imagejpeg($dst, $path, 88);
                break;

            case IMAGETYPE_PNG:
                $src = imagecreatefrompng($path);
                imagealphablending($dst, false);
                imagesavealpha($dst, true);
                $transparent = imagecolorallocatealpha($dst, 0, 0, 0, 127);
                imagefill($dst, 0, 0, $transparent);
                imagecopyresampled($dst, $src, 0, 0, 0, 0, $newWidth, $newHeight, $origWidth, $origHeight);
                imagepng($dst, $path, 7);
                break;

            case IMAGETYPE_WEBP:
                $src = imagecreatefromwebp($path);
                imagecopyresampled($dst, $src, 0, 0, 0, 0, $newWidth, $newHeight, $origWidth, $origHeight);
                imagewebp($dst, $path, 88);
                break;

            default:
                imagedestroy($dst);
                return;
        }

        imagedestroy($src);
        imagedestroy($dst);
    }
}
