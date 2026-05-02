import { Link } from '@inertiajs/react';
import { PropsWithChildren } from 'react';
import { Card } from '@/Components/ui/card';

export default function Guest({ children }: PropsWithChildren) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-muted px-4 py-12 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-6">
                <div className="flex flex-col items-center space-y-2">
                    <Link href="/" className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 text-xs font-bold tracking-wider text-primary-foreground shadow-elevated">
                            PA
                        </span>
                        <span className="text-lg font-semibold text-foreground">Process Atlas</span>
                    </Link>
                </div>

                <Card className="shadow-elevated">{children}</Card>
            </div>
        </div>
    );
}
