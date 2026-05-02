import InputError from '@/Components/InputError';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { Input } from '@/Components/ui/input';
import { Button } from '@/Components/ui/button';
import { Label } from '@/Components/ui/label';

export default function ForgotPassword({ status }: { status?: string }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit: FormEventHandler = e => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-muted p-4">
            <Head title="Forgot Password" />

            <div className="w-full max-w-lg rounded-xl border bg-card p-8 shadow-elevated">
                <div className="mb-6 flex items-center gap-3">
                    <Link href="/" className="login-mark" aria-label="Process Atlas home">
                        PA
                    </Link>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                            Process Atlas
                        </p>
                        <h1 className="text-xl font-bold text-foreground">Reset your password</h1>
                    </div>
                </div>

                <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                    Forgot your password? No problem. Just let us know your email address and we
                    will email you a password reset link that will allow you to choose a new one.
                </p>

                {status && (
                    <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-400">
                        {status}
                    </div>
                )}

                <form onSubmit={submit} className="space-y-5">
                    <div className="space-y-1.5">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            autoFocus
                            onChange={e => setData('email', e.target.value)}
                        />
                        <InputError message={errors.email} />
                    </div>

                    <div className="flex items-center justify-between gap-4">
                        <Button type="submit" disabled={processing}>
                            Email Password Reset Link
                        </Button>

                        <Button variant="outline" asChild>
                            <Link href={route('login')}>Back to log in</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </main>
    );
}
