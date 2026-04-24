<?php

namespace App\Services\Screen;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

final class ScreenImageService
{
    public function replace(?string $existingPath, UploadedFile $image, int $maxWidth = 1080): string
    {
        $imagePath = $this->storeResized($image, $maxWidth);

        $this->delete($existingPath);

        return $imagePath;
    }

    public function storeResized(UploadedFile $image, int $maxWidth = 1080): string
    {
        $imagePath = $image->store('screens', 'public');
        $fullPath = Storage::disk('public')->path($imagePath);

        if (getimagesize($fullPath) === false) {
            Storage::disk('public')->delete($imagePath);
            throw new \InvalidArgumentException('Uploaded file is not a valid image.');
        }

        $this->resize($fullPath, $maxWidth);

        return $imagePath;
    }

    public function delete(?string $path): void
    {
        if ($path) {
            Storage::disk('public')->delete($path);
        }
    }

    private function resize(string $path, int $maxWidth): void
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
