import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import { Copy, Check } from 'lucide-react';

export default function McpTokenManager({
    hasToken,
    token,
    className = '',
}: {
    hasToken: boolean;
    token?: string;
    className?: string;
}) {
    const { post, delete: destroy, processing } = useForm();
    const [copied, setCopied] = useState(false);

    const generateToken: FormEventHandler = e => {
        e.preventDefault();
        post(route('profile.mcp-token.store'));
    };

    const deleteToken: FormEventHandler = e => {
        e.preventDefault();

        if (!window.confirm('Are you sure you want to delete your MCP token?')) {
            return;
        }

        destroy(route('profile.mcp-token.destroy'));
    };

    const copyToClipboard = async (value: string) => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <section className={`space-y-6 ${className}`}>
            <header>
                <h2 className="text-lg font-medium text-foreground">MCP Token</h2>

                <p className="mt-1 text-sm text-muted-foreground">
                    Generate a personal access token for the MCP server. You can only have one
                    active token at a time.
                </p>
            </header>

            {token && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/30">
                    <p className="text-sm font-medium text-green-800 dark:text-green-400">
                        Your new token has been generated. Copy it now — you will not see it again.
                    </p>

                    <div className="mt-3 flex items-center gap-2">
                        <Input type="text" readOnly value={token} className="font-mono text-sm" />
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(token)}
                            disabled={copied}
                        >
                            {copied ? (
                                <Check className="mr-1 h-4 w-4" />
                            ) : (
                                <Copy className="mr-1 h-4 w-4" />
                            )}
                            {copied ? 'Copied' : 'Copy'}
                        </Button>
                    </div>
                </div>
            )}

            {!token && hasToken && (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-muted-foreground">
                        You currently have an active MCP token.
                    </p>

                    <div className="flex gap-3">
                        <form onSubmit={generateToken}>
                            <Button type="submit" disabled={processing}>
                                Regenerate
                            </Button>
                        </form>

                        <form onSubmit={deleteToken}>
                            <Button type="submit" variant="destructive" disabled={processing}>
                                Delete
                            </Button>
                        </form>
                    </div>
                </div>
            )}

            {!token && !hasToken && (
                <form onSubmit={generateToken}>
                    <Button type="submit" disabled={processing}>
                        Generate Token
                    </Button>
                </form>
            )}
        </section>
    );
}
