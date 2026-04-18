import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function Login({
    status,
    canResetPassword,
}: {
    status?: string;
    canResetPassword: boolean;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false as boolean,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <main className="login-page">
            <Head title="Log in" />

            <section className="login-brand-panel">
                <Link href="/" className="login-mark" aria-label="Process Atlas home">
                    PA
                </Link>

                <div>
                    <p className="eyebrow text-slate-500">Process Atlas</p>
                    <h1 className="login-title">
                        Sign in and continue mapping workflow decisions.
                    </h1>
                    <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
                        Review process models, update screen metadata, and publish
                        workflow revisions from one focused workspace.
                    </p>
                </div>

                <div className="login-preview" aria-hidden="true">
                    <div className="login-preview-node login-preview-node-start">
                        Intake
                    </div>
                    <div className="login-preview-node login-preview-node-review">
                        Review
                    </div>
                    <div className="login-preview-node login-preview-node-approve">
                        Publish
                    </div>
                    <div className="login-preview-line login-preview-line-a" />
                    <div className="login-preview-line login-preview-line-b" />
                </div>
            </section>

            <section className="login-form-panel">
                <div className="w-full max-w-md">
                    <div className="mb-8">
                        <p className="eyebrow text-slate-500">Secure Workspace</p>
                        <h2 className="mt-3 text-3xl font-bold text-slate-950">
                            Log in
                        </h2>
                    </div>

                    {status && (
                        <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                            {status}
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-5">
                        <label className="block text-sm font-semibold text-slate-700">
                            Email
                            <TextInput
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                className="login-input mt-2 block w-full"
                                autoComplete="username"
                                isFocused={true}
                                onChange={(e) => setData('email', e.target.value)}
                            />
                            <InputError message={errors.email} className="mt-2" />
                        </label>

                        <label className="block text-sm font-semibold text-slate-700">
                            Password
                            <TextInput
                                id="password"
                                type="password"
                                name="password"
                                value={data.password}
                                className="login-input mt-2 block w-full"
                                autoComplete="current-password"
                                onChange={(e) => setData('password', e.target.value)}
                            />
                            <InputError message={errors.password} className="mt-2" />
                        </label>

                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <label className="flex items-center">
                                <Checkbox
                                    name="remember"
                                    checked={data.remember}
                                    onChange={(e) =>
                                        setData(
                                            'remember',
                                            (e.target.checked || false) as false,
                                        )
                                    }
                                />
                                <span className="ms-2 text-sm text-slate-600">
                                    Remember me
                                </span>
                            </label>

                            {canResetPassword && (
                                <Link
                                    href={route('password.request')}
                                    className="rounded-lg text-sm font-semibold text-blue-700 underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                >
                                    Forgot your password?
                                </Link>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="login-submit"
                            disabled={processing}
                        >
                            Log in
                        </button>
                    </form>
                </div>
            </section>
        </main>
    );
}
