import InputError from '@/Components/InputError';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function ForgotPassword({ status }: { status?: string }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit: FormEventHandler = e => {
        e.preventDefault();

        post(route('password.email'));
    };

    return (
        <main className="forgot-password-page">
            <Head title="Forgot Password" />

            <div
                className="flex min-h-screen items-center justify-center p-4"
                style={{
                    background: `radial-gradient(circle at 0% 0%, rgba(13,110,253,0.12), transparent 38%),
                                 radial-gradient(circle at 100% 0%, rgba(0,198,255,0.12), transparent 28%),
                                 radial-gradient(circle at 100% 100%, rgba(255,176,75,0.14), transparent 32%),
                                 linear-gradient(180deg, #f7fbff 0%, #edf3f9 100%)`,
                    backgroundAttachment: 'fixed',
                }}
            >
                <div
                    className="w-full max-w-lg"
                    style={{
                        border: '1px solid rgba(255, 255, 255, 0.66)',
                        borderRadius: '32px',
                        background:
                            'linear-gradient(180deg, rgba(255, 255, 255, 0.92) 0%, rgba(241, 246, 253, 0.9) 100%)',
                        boxShadow: '0 28px 80px rgba(15, 23, 42, 0.12)',
                        backdropFilter: 'blur(20px)',
                        padding: '3rem',
                    }}
                >
                    <div className="mb-6 flex items-center gap-3">
                        <Link href="/" className="login-mark" aria-label="Process Atlas home">
                            PA
                        </Link>
                        <div>
                            <p className="eyebrow text-slate-500">Process Atlas</p>
                            <h1 className="text-2xl font-bold text-slate-950">
                                Reset your password
                            </h1>
                        </div>
                    </div>

                    <p className="mb-4 text-sm leading-relaxed text-slate-600">
                        Forgot your password? No problem. Just let us know your email address and we
                        will email you a password reset link that will allow you to choose a new
                        one.
                    </p>

                    {status && (
                        <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm font-medium text-emerald-700">
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
                                isFocused={true}
                                onChange={e => setData('email', e.target.value)}
                            />
                            <InputError message={errors.email} className="mt-2" />
                        </label>

                        <div className="flex items-center justify-between gap-4">
                            <button
                                type="submit"
                                className="btn-primary px-5 py-2.5 text-sm"
                                disabled={processing}
                            >
                                Email Password Reset Link
                            </button>

                            <Link href={route('login')} className="btn-ghost px-4 py-2.5 text-sm">
                                Back to log in
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </main>
    );
}
