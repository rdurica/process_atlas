import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import McpTokenManager from './Partials/McpTokenManager';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import { Card, CardContent } from '@/Components/ui/card';

export default function Edit({
    mustVerifyEmail,
    status,
    hasMcpToken,
    mcpToken,
}: PageProps<{
    mustVerifyEmail: boolean;
    status?: string;
    hasMcpToken?: boolean;
    mcpToken?: string;
}>) {
    const user = usePage().props.auth.user;
    return (
        <AuthenticatedLayout
            header={
                <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        Account
                    </p>
                    <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                        Profile
                    </h1>
                </div>
            }
        >
            <Head title="Profile" />

            <div className="space-y-6">
                <Card>
                    <CardContent className="p-6">
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                            className="max-w-xl"
                        />
                    </CardContent>
                </Card>

                {user?.permissions.includes('mcp.use') && (
                    <Card>
                        <CardContent className="p-6">
                            <McpTokenManager
                                hasToken={!!hasMcpToken}
                                token={mcpToken}
                                className="max-w-xl"
                            />
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardContent className="p-6">
                        <UpdatePasswordForm className="max-w-xl" />
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <DeleteUserForm className="max-w-xl" />
                    </CardContent>
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}
