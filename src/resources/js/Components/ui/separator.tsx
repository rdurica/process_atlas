import { type HTMLAttributes } from 'react';

function Separator({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
    return <div className={`h-[1px] w-full shrink-0 bg-border ${className}`} {...props} />;
}

export { Separator };
