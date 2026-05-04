import { useState } from 'react';

export function useScreenImage() {
    const [imageFile, setImageFile] = useState<File | null>(null);

    return {
        imageFile,
        setImageFile,
    };
}
