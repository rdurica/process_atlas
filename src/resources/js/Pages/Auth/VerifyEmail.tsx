import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function VerifyEmail({ status }: { status?: string }) {
    const { post, processing } = useForm({});

    const submit: FormEventHandler = e => {
        e.preventDefault();

        post(route('verification.send'));
    };

    return (
        <main className="verify-page">
            <Head title="Email Verification" />

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
                            <h1 className="text-2xl font-bold text-slate-950">Verify your email</h1>
                        </div>
                    </div>

                    <p className="mb-4 text-sm leading-relaxed text-slate-600">
                        Thanks for signing up! Before getting started, could you verify your email
                        address by clicking on the link we just emailed to you? If you didn't
                        receive the email, we will gladly send you another.
                    </p>

                    {status === 'verification-link-sent' && (
                        <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm font-medium text-emerald-700">
                            A new verification link has been sent to the email address you provided
                            during registration.
                        </div>
                    )}

                    <form
                        onSubmit={submit}
                        className="mt-6 flex items-center justify-between gap-4"
                    >
                        <button
                            type="submit"
                            className="btn-primary px-5 py-2.5 text-sm"
                            disabled={processing}
                        >
                            Resend Verification Email
                        </button>

                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="btn-ghost px-4 py-2.5 text-sm"
                        >
                            Log Out
                        </Link>
                    </form>
                </div>
            </div>
        </main>
    );
}
