@extends('emails.layout')

@section('title')
Reset Your Password
@endsection

@section('content')
<!-- Eyebrow -->
<tr>
    <td style="padding-bottom: 8px;">
        <p style="margin: 0; font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: #a1a1aa;">Process Atlas</p>
    </td>
</tr>

<!-- Heading -->
<tr>
    <td style="padding-bottom: 20px;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.01em; color: #0a0a0a; line-height: 1.3;">Reset your password</h1>
    </td>
</tr>

<!-- Body -->
<tr>
    <td style="padding-bottom: 32px;">
        <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #52525b;">
            You are receiving this email because we received a password reset request for your account. Click the button below to set a new password.
        </p>
    </td>
</tr>

<!-- Button -->
<tr>
    <td align="center" style="padding-bottom: 28px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0">
            <tr>
                <td style="background-color: #2563eb; border-radius: 8px;">
                    <a href="{{ $url }}" style="display: inline-block; padding: 12px 28px; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; border-radius: 8px;">Reset Password</a>
                </td>
            </tr>
        </table>
    </td>
</tr>

<!-- Alternative URL -->
<tr>
    <td align="center" style="padding-bottom: 4px;">
        <p style="margin: 0 0 8px 0; font-size: 12px; color: #a1a1aa;">If the button doesn't work, copy and paste this URL into your browser:</p>
        <p style="margin: 0; font-size: 12px; color: #2563eb; word-break: break-all;">{{ $url }}</p>
    </td>
</tr>
@endsection
