import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import McpTokenManager from './Partials/McpTokenManager';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

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
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Profile</h2>}
        >
            <Head title="Profile" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
                    <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8">
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                            className="max-w-xl"
                        />
                    </div>

                    {user?.permissions.includes('mcp.use') && (
                        <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8">
                            <McpTokenManager
                                hasToken={!!hasMcpToken}
                                token={mcpToken}
                                className="max-w-xl"
                            />
                        </div>
                    )}

                    <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8">
                        <UpdatePasswordForm className="max-w-xl" />
                    </div>

                    <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8">
                        <DeleteUserForm className="max-w-xl" />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
