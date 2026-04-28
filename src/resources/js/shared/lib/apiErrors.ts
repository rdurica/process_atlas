export type ValidationErrors = Record<string, string[]>;

type ApiErrorResponse = {
    status?: number;
    data?: {
        message?: string;
        errors?: ValidationErrors;
    };
};

export function firstValidationError(errors?: ValidationErrors): string | null {
    if (!errors) {
        return null;
    }

    return Object.values(errors)[0]?.[0] ?? null;
}

export function validationErrorMap(error: unknown): Record<string, string> {
    const errors = (
        error as {
            response?: ApiErrorResponse;
        }
    )?.response?.data?.errors;

    if (!errors) {
        return {};
    }

    return Object.fromEntries(
        Object.entries(errors).map(([key, messages]) => [key, messages[0] ?? ''])
    );
}

export function resolveApiError(error: unknown, fallback: string): string {
    const response = (
        error as {
            response?: ApiErrorResponse;
        }
    )?.response;

    if (!response) {
        return fallback;
    }

    if (response.status === 409) {
        return response.data?.message ?? 'A revision conflict occurred. Refresh and retry.';
    }

    if (response.status === 403) {
        return 'You do not have permission to perform this action.';
    }

    if (response.status === 422) {
        return (
            firstValidationError(response.data?.errors) ??
            response.data?.message ??
            'The submitted data is invalid.'
        );
    }

    return response.data?.message ?? fallback;
}
