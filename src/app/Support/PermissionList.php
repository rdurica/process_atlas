<?php

namespace App\Support;

final class PermissionList
{
    public const PROJECTS_VIEW = 'projects.view';
    public const PROJECTS_MANAGE = 'projects.manage';
    public const WORKFLOWS_VIEW = 'workflows.view';
    public const WORKFLOWS_EDIT = 'workflows.edit';
    public const WORKFLOWS_PUBLISH = 'workflows.publish';
    public const MCP_USE = 'mcp.use';

    /**
     * @return list<string>
     */
    public static function all(): array
    {
        return [
            self::PROJECTS_VIEW,
            self::PROJECTS_MANAGE,
            self::WORKFLOWS_VIEW,
            self::WORKFLOWS_EDIT,
            self::WORKFLOWS_PUBLISH,
            self::MCP_USE,
        ];
    }
}
