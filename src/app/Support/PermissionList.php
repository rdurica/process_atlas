<?php

namespace App\Support;

final class PermissionList
{
    /** Can create new projects */
    public const PROJECTS_CREATE = 'projects.create';

    /** Bypasses project membership checks — sees and manages all projects */
    public const PROJECTS_ADMIN = 'projects.admin';

    /** Can use MCP integration */
    public const MCP_USE = 'mcp.use';

    /**
     * @return list<string>
     */
    public static function all(): array
    {
        return [
            self::PROJECTS_CREATE,
            self::PROJECTS_ADMIN,
            self::MCP_USE,
        ];
    }
}
