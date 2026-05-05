import InputError from '@/Components/InputError';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { Input } from '@/Components/ui/input';
import { Button } from '@/Components/ui/button';
import { Label } from '@/Components/ui/label';

export default function Login({ canResetPassword }: { canResetPassword: boolean }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false as boolean,
    });

    const submit: FormEventHandler = e => {
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
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        Process Atlas
                    </p>
                    <h1 className="login-title">
                        Sign in and continue mapping workflow decisions.
                    </h1>
                    <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
                        Review process models, update screen metadata, and publish workflow
                        revisions from one focused workspace.
                    </p>
                </div>

                <div className="login-preview" aria-hidden="true">
                    <div className="login-preview-node login-preview-node-start">Intake</div>
                    <div className="login-preview-node login-preview-node-review">Review</div>
                    <div className="login-preview-node login-preview-node-approve">Publish</div>
                    <div className="login-preview-line login-preview-line-a" />
                    <div className="login-preview-line login-preview-line-b" />
                </div>
            </section>

            <section className="login-form-panel">
                <div className="w-full max-w-md">
                    <div className="mb-8">
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                            Secure Workspace
                        </p>
                        <h2 className="mt-2 text-2xl font-bold text-foreground">Log in</h2>
                    </div>

                    <form onSubmit={submit} className="space-y-5">
                        <div className="space-y-1.5">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                autoComplete="username"
                                autoFocus
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
                                autoComplete="current-password"
                                onChange={e => setData('password', e.target.value)}
                            />
                            <InputError message={errors.password} />
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <label className="flex cursor-pointer items-center gap-2">
                                <input
                                    type="checkbox"
                                    name="remember"
                                    checked={data.remember}
                                    onChange={e =>
                                        setData('remember', (e.target.checked || false) as false)
                                    }
                                    className="h-4 w-4 rounded border-border bg-background text-primary shadow-sm ring-offset-background transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                />
                                <span className="text-sm text-muted-foreground">Remember me</span>
                            </label>

                            {canResetPassword && (
                                <Link
                                    href={route('password.request')}
                                    className="rounded-md text-sm font-medium text-primary underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                >
                                    Forgot your password?
                                </Link>
                            )}
                        </div>

                        <Button type="submit" className="w-full" disabled={processing}>
                            Log in
                        </Button>

                        <p className="text-center text-sm text-muted-foreground">
                            Don&apos;t have an account?{' '}
                            <Link
                                href={route('register')}
                                className="font-medium text-primary underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            >
                                Register
                            </Link>
                        </p>
                    </form>
                </div>
            </section>
        </main>
    );
}
