<?php

namespace App\Services\Screen;

use App\Exceptions\ImageProcessingException;
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

        if ($imagePath === false)
        {
            throw new \RuntimeException('Failed to store uploaded image.');
        }

        $fullPath = Storage::disk('public')->path($imagePath);

        if (getimagesize($fullPath) === false)
        {
            Storage::disk('public')->delete($imagePath);
            throw new \InvalidArgumentException('Uploaded file is not a valid image.');
        }

        $this->resize($fullPath, $maxWidth);

        return $imagePath;
    }

    public function delete(?string $path): void
    {
        if ($path)
        {
            Storage::disk('public')->delete($path);
        }
    }

    private function resize(string $path, int $maxWidth): void
    {
        $imageInfo = getimagesize($path);

        if ($imageInfo === false)
        {
            throw new \RuntimeException('Failed to read image dimensions.');
        }

        [$origWidth, $origHeight, $type] = $imageInfo;

        if ($origWidth <= $maxWidth)
        {
            return;
        }

        $ratio = $maxWidth / $origWidth;
        $newWidth = $maxWidth;
        $newHeight = (int) round($origHeight * $ratio);

        if ($newWidth <= 0 || $newHeight <= 0)
        {
            throw new ImageProcessingException('Calculated image dimensions must be positive.');
        }

        $dst = imagecreatetruecolor($newWidth, $newHeight);

        if ($dst === false)
        {
            throw new \RuntimeException('Failed to create destination image.');
        }

        switch ($type)
        {
            case IMAGETYPE_JPEG:
                $src = imagecreatefromjpeg($path);
                break;

            case IMAGETYPE_PNG:
                $src = imagecreatefrompng($path);
                break;

            case IMAGETYPE_WEBP:
                $src = imagecreatefromwebp($path);
                break;

            default:
                imagedestroy($dst);

                return;
        }

        if ($src === false)
        {
            imagedestroy($dst);
            throw new \RuntimeException('Failed to create source image from file.');
        }

        switch ($type)
        {
            case IMAGETYPE_JPEG:
                imagecopyresampled($dst, $src, 0, 0, 0, 0, $newWidth, $newHeight, $origWidth, $origHeight);
                imagejpeg($dst, $path, 88);
                break;

            case IMAGETYPE_PNG:
                imagealphablending($dst, false);
                imagesavealpha($dst, true);
                $transparent = imagecolorallocatealpha($dst, 0, 0, 0, 127);

                if ($transparent === false)
                {
                    throw new \RuntimeException('Failed to allocate transparent color.');
                }

                imagefill($dst, 0, 0, $transparent);
                imagecopyresampled($dst, $src, 0, 0, 0, 0, $newWidth, $newHeight, $origWidth, $origHeight);
                imagepng($dst, $path, 7);
                break;

            case IMAGETYPE_WEBP:
                imagecopyresampled($dst, $src, 0, 0, 0, 0, $newWidth, $newHeight, $origWidth, $origHeight);
                imagewebp($dst, $path, 88);
                break;
        }

        imagedestroy($src);
        imagedestroy($dst);
    }
}
