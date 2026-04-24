import DangerButton from '@/Components/DangerButton';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

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
                <h2 className="text-lg font-medium text-gray-900">MCP Token</h2>

                <p className="mt-1 text-sm text-gray-600">
                    Generate a personal access token for the MCP server. You can only have one active
                    token at a time.
                </p>
            </header>

            {token && (
                <div className="rounded-lg bg-green-50 p-4 ring-1 ring-green-600/20">
                    <p className="text-sm font-medium text-green-800">
                        Your new token has been generated. Copy it now — you will not see it again.
                    </p>

                    <div className="mt-3 flex items-center gap-2">
                        <input
                            type="text"
                            readOnly
                            value={token}
                            className="block w-full rounded-md border-gray-300 bg-white text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        <SecondaryButton
                            type="button"
                            onClick={() => copyToClipboard(token)}
                            disabled={copied}
                        >
                            {copied ? 'Copied' : 'Copy'}
                        </SecondaryButton>
                    </div>
                </div>
            )}

            {!token && hasToken && (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-gray-600">You currently have an active MCP token.</p>

                    <div className="flex gap-3">
                        <form onSubmit={generateToken}>
                            <PrimaryButton type="submit" disabled={processing}>
                                Regenerate
                            </PrimaryButton>
                        </form>

                        <form onSubmit={deleteToken}>
                            <DangerButton type="submit" disabled={processing}>
                                Delete
                            </DangerButton>
                        </form>
                    </div>
                </div>
            )}

            {!token && !hasToken && (
                <form onSubmit={generateToken}>
                    <PrimaryButton type="submit" disabled={processing}>
                        Generate Token
                    </PrimaryButton>
                </form>
            )}
        </section>
    );
}
