import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { Button } from '@/Components/ui/button';

export default function VerifyEmail() {
    const { post, processing } = useForm({});

    const submit: FormEventHandler = e => {
        e.preventDefault();
        post(route('verification.send'));
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-muted p-4">
            <Head title="Email Verification" />

            <div className="w-full max-w-lg rounded-xl border bg-card p-8 shadow-elevated">
                <div className="mb-6 flex items-center gap-3">
                    <Link href="/" className="login-mark" aria-label="Process Atlas home">
                        PA
                    </Link>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                            Process Atlas
                        </p>
                        <h1 className="text-xl font-bold text-foreground">Verify your email</h1>
                    </div>
                </div>

                <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                    Thanks for signing up! Before getting started, could you verify your email
                    address by clicking on the link we just emailed to you? If you didn't receive
                    the email, we will gladly send you another.
                </p>

                <form onSubmit={submit} className="mt-6 flex items-center justify-between gap-4">
                    <Button type="submit" disabled={processing}>
                        Resend Verification Email
                    </Button>

                    <Button variant="outline" asChild>
                        <Link href={route('logout')} method="post" as="button">
                            Log Out
                        </Link>
                    </Button>
                </form>
            </div>
        </main>
    );
}
