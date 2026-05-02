import InputError from '@/Components/InputError';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { Input } from '@/Components/ui/input';
import { Button } from '@/Components/ui/button';
import { Label } from '@/Components/ui/label';

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
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        Process Atlas
                    </p>
                    <h1 className="login-title">
                        Create your account and start mapping workflows.
                    </h1>
                    <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
                        Build process models, collaborate with your team, and publish workflow
                        revisions from one focused workspace.
                    </p>
                </div>

                <div className="login-preview flex items-center justify-center" aria-hidden="true">
                    <svg
                        viewBox="0 0 400 220"
                        width="100%"
                        height="100%"
                        preserveAspectRatio="xMidYMid meet"
                        className="max-w-[360px]"
                    >
                        <defs>
                            <linearGradient id="nodeGrad" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="hsl(var(--card))" />
                                <stop offset="100%" stopColor="hsl(var(--muted))" />
                            </linearGradient>
                            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                                <feDropShadow
                                    dx="0"
                                    dy="8"
                                    stdDeviation="8"
                                    floodColor="hsl(var(--foreground))"
                                    floodOpacity="0.08"
                                />
                            </filter>
                        </defs>

                        <line
                            x1="110"
                            y1="85"
                            x2="200"
                            y2="65"
                            stroke="hsl(var(--primary))"
                            strokeWidth="2"
                            opacity="0.35"
                        />
                        <line
                            x1="200"
                            y1="65"
                            x2="290"
                            y2="85"
                            stroke="hsl(var(--primary))"
                            strokeWidth="2"
                            opacity="0.35"
                        />
                        <line
                            x1="155"
                            y1="155"
                            x2="200"
                            y2="65"
                            stroke="hsl(var(--primary))"
                            strokeWidth="2"
                            opacity="0.25"
                        />
                        <line
                            x1="200"
                            y1="65"
                            x2="245"
                            y2="155"
                            stroke="hsl(var(--primary))"
                            strokeWidth="2"
                            opacity="0.25"
                        />

                        <circle
                            cx="110"
                            cy="85"
                            r="28"
                            fill="url(#nodeGrad)"
                            stroke="hsl(var(--primary))"
                            strokeWidth="1.5"
                            strokeOpacity="0.25"
                            filter="url(#shadow)"
                        />
                        <text
                            x="110"
                            y="89"
                            textAnchor="middle"
                            fontSize="11"
                            fontWeight="700"
                            fill="hsl(var(--foreground))"
                        >
                            Start
                        </text>

                        <circle
                            cx="200"
                            cy="65"
                            r="32"
                            fill="url(#nodeGrad)"
                            stroke="hsl(var(--primary))"
                            strokeWidth="1.5"
                            strokeOpacity="0.3"
                            filter="url(#shadow)"
                        />
                        <text
                            x="200"
                            y="69"
                            textAnchor="middle"
                            fontSize="11"
                            fontWeight="700"
                            fill="hsl(var(--foreground))"
                        >
                            Design
                        </text>

                        <circle
                            cx="290"
                            cy="85"
                            r="28"
                            fill="url(#nodeGrad)"
                            stroke="hsl(var(--primary))"
                            strokeWidth="1.5"
                            strokeOpacity="0.25"
                            filter="url(#shadow)"
                        />
                        <text
                            x="290"
                            y="89"
                            textAnchor="middle"
                            fontSize="11"
                            fontWeight="700"
                            fill="hsl(var(--foreground))"
                        >
                            Build
                        </text>

                        <circle
                            cx="155"
                            cy="155"
                            r="26"
                            fill="url(#nodeGrad)"
                            stroke="hsl(var(--primary))"
                            strokeWidth="1.5"
                            strokeOpacity="0.2"
                            filter="url(#shadow)"
                        />
                        <text
                            x="155"
                            y="159"
                            textAnchor="middle"
                            fontSize="11"
                            fontWeight="700"
                            fill="hsl(var(--foreground))"
                        >
                            Review
                        </text>

                        <circle
                            cx="245"
                            cy="155"
                            r="26"
                            fill="url(#nodeGrad)"
                            stroke="hsl(var(--primary))"
                            strokeWidth="1.5"
                            strokeOpacity="0.2"
                            filter="url(#shadow)"
                        />
                        <text
                            x="245"
                            y="159"
                            textAnchor="middle"
                            fontSize="11"
                            fontWeight="700"
                            fill="hsl(var(--foreground))"
                        >
                            Publish
                        </text>
                    </svg>
                </div>
            </section>

            <section className="login-form-panel">
                <div className="w-full max-w-md">
                    <div className="mb-8">
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                            Secure Workspace
                        </p>
                        <h2 className="mt-2 text-2xl font-bold text-foreground">Create account</h2>
                    </div>

                    <form onSubmit={submit} className="space-y-5">
                        <div className="space-y-1.5">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                name="name"
                                value={data.name}
                                autoComplete="name"
                                autoFocus
                                onChange={e => setData('name', e.target.value)}
                            />
                            <InputError message={errors.name} />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                autoComplete="username"
                                onChange={e => setData('email', e.target.value)}
                            />
                            <InputError message={errors.email} />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                name="password"
                                value={data.password}
                                autoComplete="new-password"
                                onChange={e => setData('password', e.target.value)}
                            />
                            <InputError message={errors.password} />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="password_confirmation">Confirm Password</Label>
                            <Input
                                id="password_confirmation"
                                type="password"
                                name="password_confirmation"
                                value={data.password_confirmation}
                                autoComplete="new-password"
                                onChange={e => setData('password_confirmation', e.target.value)}
                            />
                            <InputError message={errors.password_confirmation} />
                        </div>

                        <Button type="submit" className="w-full" disabled={processing}>
                            Create account
                        </Button>

                        <p className="text-center text-sm text-muted-foreground">
                            Already have an account?{' '}
                            <Link
                                href={route('login')}
                                className="font-medium text-primary underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
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
