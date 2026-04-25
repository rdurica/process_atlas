import InputError from '@/Components/InputError';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = e => {
        e.preventDefault();

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <main className="login-page">
            <Head title="Register" />

            <section className="login-brand-panel">
                <Link href="/" className="login-mark" aria-label="Process Atlas home">
                    PA
                </Link>

                <div>
                    <p className="eyebrow text-slate-500">Process Atlas</p>
                    <h1 className="login-title">
                        Create your account and start mapping workflows.
                    </h1>
                    <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
                        Build process models, collaborate with your team, and publish workflow
                        revisions from one focused workspace.
                    </p>
                </div>

                <div
                    className="login-preview"
                    aria-hidden="true"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    <svg
                        viewBox="0 0 400 220"
                        width="100%"
                        height="100%"
                        preserveAspectRatio="xMidYMid meet"
                        style={{ maxWidth: '360px' }}
                    >
                        <defs>
                            <linearGradient id="nodeGrad" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="rgba(255,255,255,0.98)" />
                                <stop offset="100%" stopColor="rgba(240,247,255,0.94)" />
                            </linearGradient>
                            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                                <feDropShadow
                                    dx="0"
                                    dy="12"
                                    stdDeviation="10"
                                    floodColor="rgba(15,23,42,0.1)"
                                />
                            </filter>
                        </defs>

                        {/* Connection lines */}
                        <line
                            x1="110"
                            y1="85"
                            x2="200"
                            y2="65"
                            stroke="#0f5ef7"
                            strokeWidth="2"
                            opacity="0.35"
                        />
                        <line
                            x1="200"
                            y1="65"
                            x2="290"
                            y2="85"
                            stroke="#0f5ef7"
                            strokeWidth="2"
                            opacity="0.35"
                        />
                        <line
                            x1="155"
                            y1="155"
                            x2="200"
                            y2="65"
                            stroke="#0f5ef7"
                            strokeWidth="2"
                            opacity="0.25"
                        />
                        <line
                            x1="200"
                            y1="65"
                            x2="245"
                            y2="155"
                            stroke="#0f5ef7"
                            strokeWidth="2"
                            opacity="0.25"
                        />

                        {/* Nodes */}
                        <circle
                            cx="110"
                            cy="85"
                            r="28"
                            fill="url(#nodeGrad)"
                            stroke="rgba(15,94,247,0.25)"
                            strokeWidth="1.5"
                            filter="url(#shadow)"
                        />
                        <text
                            x="110"
                            y="89"
                            textAnchor="middle"
                            fontSize="11"
                            fontWeight="700"
                            fill="#0f172a"
                        >
                            Start
                        </text>

                        <circle
                            cx="200"
                            cy="65"
                            r="32"
                            fill="url(#nodeGrad)"
                            stroke="rgba(15,94,247,0.3)"
                            strokeWidth="1.5"
                            filter="url(#shadow)"
                        />
                        <text
                            x="200"
                            y="69"
                            textAnchor="middle"
                            fontSize="11"
                            fontWeight="700"
                            fill="#0f172a"
                        >
                            Design
                        </text>

                        <circle
                            cx="290"
                            cy="85"
                            r="28"
                            fill="url(#nodeGrad)"
                            stroke="rgba(15,94,247,0.25)"
                            strokeWidth="1.5"
                            filter="url(#shadow)"
                        />
                        <text
                            x="290"
                            y="89"
                            textAnchor="middle"
                            fontSize="11"
                            fontWeight="700"
                            fill="#0f172a"
                        >
                            Build
                        </text>

                        <circle
                            cx="155"
                            cy="155"
                            r="26"
                            fill="url(#nodeGrad)"
                            stroke="rgba(15,94,247,0.2)"
                            strokeWidth="1.5"
                            filter="url(#shadow)"
                        />
                        <text
                            x="155"
                            y="159"
                            textAnchor="middle"
                            fontSize="11"
                            fontWeight="700"
                            fill="#0f172a"
                        >
                            Review
                        </text>

                        <circle
                            cx="245"
                            cy="155"
                            r="26"
                            fill="url(#nodeGrad)"
                            stroke="rgba(15,94,247,0.2)"
                            strokeWidth="1.5"
                            filter="url(#shadow)"
                        />
                        <text
                            x="245"
                            y="159"
                            textAnchor="middle"
                            fontSize="11"
                            fontWeight="700"
                            fill="#0f172a"
                        >
                            Publish
                        </text>
                    </svg>
                </div>
            </section>

            <section className="login-form-panel">
                <div className="w-full max-w-md">
                    <div className="mb-8">
                        <p className="eyebrow text-slate-500">Secure Workspace</p>
                        <h2 className="mt-3 text-3xl font-bold text-slate-950">Create account</h2>
                    </div>

                    <form onSubmit={submit} className="space-y-5">
                        <label className="block text-sm font-semibold text-slate-700">
                            Name
                            <TextInput
                                id="name"
                                name="name"
                                value={data.name}
                                className="login-input mt-2 block w-full"
                                autoComplete="name"
                                isFocused={true}
                                onChange={e => setData('name', e.target.value)}
                            />
                            <InputError message={errors.name} className="mt-2" />
                        </label>

                        <label className="block text-sm font-semibold text-slate-700">
                            Email
                            <TextInput
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                className="login-input mt-2 block w-full"
                                autoComplete="username"
                                onChange={e => setData('email', e.target.value)}
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
                                autoComplete="new-password"
                                onChange={e => setData('password', e.target.value)}
                            />
                            <InputError message={errors.password} className="mt-2" />
                        </label>

                        <label className="block text-sm font-semibold text-slate-700">
                            Confirm Password
                            <TextInput
                                id="password_confirmation"
                                type="password"
                                name="password_confirmation"
                                value={data.password_confirmation}
                                className="login-input mt-2 block w-full"
                                autoComplete="new-password"
                                onChange={e => setData('password_confirmation', e.target.value)}
                            />
                            <InputError message={errors.password_confirmation} className="mt-2" />
                        </label>

                        <button type="submit" className="login-submit" disabled={processing}>
                            Create account
                        </button>

                        <p className="text-center text-sm text-slate-600">
                            Already have an account?{' '}
                            <Link
                                href={route('login')}
                                className="font-semibold text-blue-700 underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                                Log in
                            </Link>
                        </p>
                    </form>
                </div>
            </section>
        </main>
    );
}
