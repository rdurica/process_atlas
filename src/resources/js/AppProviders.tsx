import { QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { ThemeProvider } from './Components/ThemeProvider';
import { createQueryClient } from './shared/api/queryClient';
import { Toaster } from './Components/ui/sonner';
import FlashToaster from './Components/FlashToaster';

interface AppProvidersProps {
    children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
    const [queryClient] = useState(createQueryClient);

    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider>
                <Toaster />
                <FlashToaster />
                {children}
            </ThemeProvider>
        </QueryClientProvider>
    );
}
