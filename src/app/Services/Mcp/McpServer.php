<?php

namespace App\Services\Mcp;

use App\DTO\Mcp\McpRequest;
use App\DTO\Mcp\McpResponse;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;

final class McpServer
{
    public function __construct(private readonly McpMethodRegistry $registry)
    {
    }

    public function handle(McpRequest $request, User $actor): ?McpResponse
    {
        try {
            $result = $this->registry->handle($request->method, $request->params, $actor);
        } catch (ValidationException $exception) {
            if ($request->isNotification()) {
                return null;
            }

            return McpResponse::error($request->id, -32602, $this->firstValidationMessage($exception));
        } catch (ModelNotFoundException) {
            if ($request->isNotification()) {
                return null;
            }

            return McpResponse::error($request->id, -32004, 'Resource not found.');
        } catch (AuthorizationException $exception) {
            if ($request->isNotification()) {
                return null;
            }

            $message = $exception->getMessage() !== '' ? $exception->getMessage() : 'Forbidden.';

            return McpResponse::error($request->id, -32003, $message);
        } catch (HttpException $exception) {
            if ($request->isNotification()) {
                return null;
            }

            $code = $exception->getStatusCode() === 403 ? -32003 : -32000;
            $message = $exception->getMessage() !== '' ? $exception->getMessage() : 'Request failed.';

            return McpResponse::error($request->id, $code, $message);
        } catch (\Throwable) {
            if ($request->isNotification()) {
                return null;
            }

            return McpResponse::error($request->id, -32603, 'Internal MCP server error.');
        }

        if ($request->isNotification()) {
            return null;
        }

        return McpResponse::success($request->id, $result);
    }

    private function firstValidationMessage(ValidationException $exception): string
    {
        foreach ($exception->errors() as $messages) {
            if (isset($messages[0])) {
                return (string) $messages[0];
            }
        }

        return $exception->getMessage();
    }
}
