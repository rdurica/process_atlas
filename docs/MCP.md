# MCP (Model Context Protocol) in Process Atlas

Process Atlas exposes a standard **MCP JSON-RPC server** that allows AI agents to discover, read, and modify process definitions before and during autonomous task execution.

Instead of blindly navigating an unfamiliar system, an agent can query Process Atlas via MCP to answer questions like:

- *"What screens does the checkout flow consist of?"*
- *"What conditions branch this process and what are the outcomes?"*
- *"Where does this workflow hand off to another process?"*

Process Atlas is the living map that agents read — and, with the right permissions, update.

---

## Table of Contents

- [Authentication & Permissions](#authentication--permissions)
- [Transports](#transports)
  - [HTTP Transport](#http-transport)
  - [Stdio Transport](#stdio-transport)
- [Configuration for OpenCode](#configuration-for-opencode)
- [Resources](#resources)
- [Tools](#tools)
- [JSON-RPC Error Codes](#json-rpc-error-codes)
- [Audit Log](#audit-log)
- [Example Session](#example-session)

---

## Authentication & Permissions

Using the MCP server requires two things:

1. **Permission** `mcp.use` assigned to your user account.
2. A **Sanctum personal access token** with the `mcp:use` ability.

### Generating a Token

1. Log in to Process Atlas.
2. Go to **Profile** → **MCP Token**.
3. Click **Generate Token**.
4. Copy the token immediately — it is shown only once.

> You can only have one active MCP token at a time. Regenerating revokes the previous one.

---

## Transports

Process Atlas supports two MCP transports:

| Transport | Use Case | Endpoint / Command |
|-----------|----------|-------------------|
| **HTTP** | Remote server, agent running elsewhere | `POST /api/mcp` |
| **Stdio** | Local development, direct IDE integration | `php artisan mcp:serve-stdio --user=<id>` |

### HTTP Transport

**Endpoint:** `POST /api/mcp`

**Headers:**
```
Authorization: Bearer <mcp-token>
Content-Type: application/json
Accept: application/json
```

**Rate Limiting:** 30 requests per minute (`throttle:mcp` middleware).

**Example:**
```bash
curl -X POST https://your-process-atlas.example.com/api/mcp \
  -H "Authorization: Bearer <mcp-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": { "name": "opencode", "version": "1.0.0" }
    }
  }'
```

### Stdio Transport

Run the MCP server locally over standard input/output:

```bash
php artisan mcp:serve-stdio --user=<user-id>
```

Alternatively, configure via environment variables in your `.env`:

```env
MCP_USER_ID=1          # User ID to act as the MCP actor
MCP_TOKEN=your-token   # Or use a Sanctum token directly
```

Then simply run:

```bash
php artisan mcp:serve-stdio
```

The server reads JSON-RPC requests from `stdin` and writes responses to `stdout` using the MCP framing protocol (`Content-Length` headers).

---

## Configuration for OpenCode

For **OpenCode** (or any other MCP-compatible IDE), you can connect to Process Atlas using either transport:

### Remote Server (HTTP — Recommended)

If Process Atlas runs on a remote server, configure OpenCode to use the HTTP endpoint:

- **URL:** `https://your-process-atlas.example.com/api/mcp`
- **Token:** Your MCP personal access token
- **Headers:** `Authorization: Bearer <token>`

### Local Development (Stdio)

For local development, configure stdio transport in your IDE:

```json
{
  "mcpServers": {
    "process-atlas": {
      "command": "docker",
      "args": [
        "compose", "exec", "-T", "php-fpm",
        "php", "artisan", "mcp:serve-stdio", "--user=1"
      ]
    }
  }
}
```

Or without Docker:

```json
{
  "mcpServers": {
    "process-atlas": {
      "command": "php",
      "args": ["artisan", "mcp:serve-stdio", "--user=1"],
      "env": {
        "MCP_USER_ID": "1"
      }
    }
  }
}
```

> Ensure the user ID has the `mcp.use` permission.

---

## Resources

Resources use the `process-atlas://` URI scheme. All resources return `application/json`.

### Base Resources (List)

| URI | Description |
|-----|-------------|
| `process-atlas://projects` | List of projects visible to the actor |
| `process-atlas://workflows` | List of workflows visible to the actor |
| `process-atlas://revisions` | List of workflow revisions visible to the actor |
| `process-atlas://screens` | List of workflow screens visible to the actor |

### Template Resources (By ID)

| URI Template | Description |
|--------------|-------------|
| `process-atlas://projects/{project_id}` | Read one project including workflows |
| `process-atlas://workflows/{workflow_id}` | Read one workflow including revisions and screens |
| `process-atlas://revisions/{revision_id}` | Read one workflow revision |
| `process-atlas://screens/{screen_id}` | Read one workflow screen |

### Access Control

All resources are filtered by the actor's permissions. Non-admin users see only projects where they are members.

---

## Tools

Process Atlas exposes 8 MCP tools for reading and modifying process definitions.

### Read-Only Tools

#### `process_atlas.list_projects`

List projects visible to the MCP actor.

**Parameters:** none

**Example Response:**
```json
{
  "projects": [
    {
      "id": 1,
      "name": "E-Commerce Platform",
      "description": "Main e-commerce application"
    }
  ]
}
```

---

#### `process_atlas.get_workflow`

Read workflow details including revisions, graph, and screens.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `workflow_id` | integer | yes | Workflow ID |

**Example Response:**
```json
{
  "workflow": {
    "id": 12,
    "name": "Checkout Flow",
    "project_id": 1,
    "published_revision_id": 45,
    "latest_revision": { ... },
    "revisions": [ ... ]
  }
}
```

---

#### `process_atlas.get_screen`

Read a screen and its custom fields.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `screen_id` | integer | yes | Screen ID |

**Example Response:**
```json
{
  "screen": {
    "id": 89,
    "title": "Payment Details",
    "node_id": "payment-node-1",
    "custom_fields": [
      { "key": "form_type", "value": "credit_card" }
    ]
  }
}
```

---

### Write Tools

> All write operations require the actor to have appropriate permissions (`workflows.edit`, `workflows.publish`, etc.) and are logged in the audit trail with `source: mcp`.

#### `process_atlas.update_screen`

Create or update a screen inside a **draft** workflow revision.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `workflow_revision_id` | integer | yes | Draft revision ID |
| `node_id` | string | yes | Screen node ID in the graph |
| `title` | string \| null | no | Screen title |
| `subtitle` | string \| null | no | Screen subtitle |
| `description` | string \| null | no | Screen description |

**Example Response:**
```json
{
  "screen": {
    "id": 92,
    "title": "Updated Payment",
    "node_id": "payment-node-1"
  }
}
```

---

#### `process_atlas.update_graph`

Update graph JSON for a draft workflow revision using **optimistic locking**.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `workflow_revision_id` | integer | yes | Draft revision ID |
| `lock_revision` | integer | yes | Current lock version |
| `graph_json` | object | yes | New graph definition |

**Example Response:**
```json
{
  "workflow_revision_id": 67,
  "lock_revision": 3
}
```

> If `lock_revision` does not match the current version, a conflict error (-32602) is returned.

---

#### `process_atlas.create_workflow_revision`

Create a new **draft** workflow revision from the latest revision.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `workflow_id` | integer | yes | Workflow ID |

**Example Response:**
```json
{
  "workflow_revision": {
    "id": 68,
    "revision_number": 5,
    "is_published": false
  }
}
```

---

#### `process_atlas.publish_revision`

Publish a workflow revision.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `workflow_revision_id` | integer | yes | Revision ID to publish |

**Example Response:**
```json
{
  "workflow_id": 12,
  "published_revision_id": 68
}
```

---

#### `process_atlas.rollback_revision`

Create a new **draft** revision from a selected historical revision.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `workflow_id` | integer | yes | Workflow ID |
| `to_revision_id` | integer | yes | Target historical revision ID |

**Example Response:**
```json
{
  "workflow_revision": {
    "id": 69,
    "revision_number": 6,
    "rollback_source_id": 45
  }
}
```

---

## JSON-RPC Error Codes

| Code | Meaning | Typical Cause |
|------|---------|---------------|
| `-32602` | Invalid params | Missing or invalid parameters |
| `-32003` | Forbidden | Actor lacks `mcp.use` or required workflow permission |
| `-32004` | Resource not found | Requested workflow, revision, or screen does not exist |
| `-32000` | Request failed | Generic HTTP exception (e.g., 422 validation error) |
| `-32603` | Internal error | Unexpected server error |
| `-32700` | Parse error | Invalid JSON input (stdio only) |

Notifications (requests without `id`) never return error responses; failures are silently ignored.

---

## Audit Log

Every MCP tool invocation that modifies data is recorded in the audit log with:

- `source: "mcp"`
- Actor user ID
- Action type (`updated`, `created`, `published`)
- Target entity (workflow, revision, screen)
- Contextual metadata (IDs, descriptions)

This allows administrators to trace all agent-driven changes through the standard Process Atlas activity log.

---

## Example Session

Below is a complete example of an MCP session over HTTP using `curl`.

### 1. Initialize

```bash
curl -X POST https://localhost/api/mcp \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": { "name": "opencode", "version": "1.0.0" }
    }
  }'
```

### 2. List Tools

```bash
curl -X POST https://localhost/api/mcp \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/list",
    "params": {}
  }'
```

### 3. Call a Tool

```bash
curl -X POST https://localhost/api/mcp \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "process_atlas.get_workflow",
      "arguments": { "workflow_id": 12 }
    }
  }'
```

### 4. Read a Resource

```bash
curl -X POST https://localhost/api/mcp \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 4,
    "method": "resources/read",
    "params": { "uri": "process-atlas://workflows/12" }
  }'
```

---

*For more information about the Model Context Protocol, visit the [MCP specification](https://modelcontextprotocol.io/).*
