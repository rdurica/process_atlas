<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email Address</title>
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(180deg, #f7fbff 0%, #edf3f9 100%); font-family: 'Space Grotesk', system-ui, -apple-system, sans-serif;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
            <td align="center" style="padding: 24px 20px 40px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">
                    <!-- Card -->
                    <tr>
                        <td style="background: linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(241, 246, 253, 0.94) 100%); border: 1px solid rgba(255, 255, 255, 0.78); border-radius: 32px; padding: 48px; box-shadow: 0 24px 60px rgba(15, 23, 42, 0.08);">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <!-- Eyebrow -->
                                <tr>
                                    <td style="padding-bottom: 12px;">
                                        <p style="margin: 0; font-size: 11px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: #64748b;">Process Atlas</p>
                                    </td>
                                </tr>

                                <!-- Heading -->
                                <tr>
                                    <td style="padding-bottom: 20px;">
                                        <h1 style="margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.02em; color: #0f172a; line-height: 1.2;">Verify your email</h1>
                                    </td>
                                </tr>

                                <!-- Body -->
                                <tr>
                                    <td style="padding-bottom: 32px;">
                                        <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #475569;">
                                            Thanks for signing up! Please verify your email address by clicking the button below. This helps us keep your account secure.
                                        </p>
                                    </td>
                                </tr>

                                <!-- Button -->
                                <tr>
                                    <td align="center" style="padding-bottom: 28px;">
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                            <tr>
                                                <td style="background: linear-gradient(135deg, #0f5ef7 0%, #1480ff 100%); border-radius: 16px; box-shadow: 0 18px 40px rgba(15, 94, 247, 0.28);">
                                                    <a href="{{ $url }}" style="display: inline-block; padding: 16px 36px; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 16px;">Verify Email Address</a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>

                                <!-- Alternative URL -->
                                <tr>
                                    <td align="center" style="padding-bottom: 32px;">
                                        <p style="margin: 0 0 8px 0; font-size: 12px; color: #64748b;">If the button doesn't work, copy and paste this URL into your browser:</p>
                                        <p style="margin: 0; font-size: 12px; color: #0f5ef7; word-break: break-all;">{{ $url }}</p>
                                    </td>
                                </tr>

                                <!-- Divider -->
                                <tr>
                                    <td style="padding-bottom: 24px;">
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                            <tr>
                                                <td style="border-top: 1px solid rgba(148, 163, 184, 0.24);"></td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>

                                <!-- Footer -->
                                <tr>
                                    <td>
                                        <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748b; line-height: 1.5;">
                                            If you did not create an account, no further action is required.
                                        </p>
                                        <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                                            &copy; {{ date('Y') }} Process Atlas. All rights reserved.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
