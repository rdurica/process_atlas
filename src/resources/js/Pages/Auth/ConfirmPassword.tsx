import InputError from '@/Components/InputError';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { Input } from '@/Components/ui/input';
import { Button } from '@/Components/ui/button';
import { Label } from '@/Components/ui/label';

export default function ConfirmPassword() {
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    const submit: FormEventHandler = e => {
        e.preventDefault();
        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Confirm Password" />

            <div className="p-6">
                <div className="mb-6">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        Process Atlas
                    </p>
                    <h1 className="mt-1 text-xl font-bold text-foreground">Confirm Password</h1>
                </div>

                <div className="mb-4 text-sm text-muted-foreground">
                    This is a secure area of the application. Please confirm your password before
                    continuing.
                </div>

                <form onSubmit={submit} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            name="password"
                            value={data.password}
                            autoFocus
                            onChange={e => setData('password', e.target.value)}
                        />
                        <InputError message={errors.password} />
                    </div>

                    <div className="flex items-center justify-end pt-2">
                        <Button type="submit" disabled={processing}>
                            Confirm
                        </Button>
                    </div>
                </form>
            </div>
        </GuestLayout>
    );
}
