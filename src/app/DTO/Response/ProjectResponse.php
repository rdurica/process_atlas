<?php

declare(strict_types=1);

namespace App\DTO\Response;

use App\Models\Project;
use JsonSerializable;

final readonly class ProjectResponse implements JsonSerializable
{
    public function __construct(
        public int $id,
        public string $name,
        public ?string $description,
        public string $createdAt,
    ) {}

    public static function fromModel(Project $project): self
    {
        return new self(
            id: $project->id,
            name: $project->name,
            description: $project->description,
            createdAt: $project->created_at->toIso8601String(),
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function jsonSerialize(): array
    {
        return [
            'id'          => $this->id,
            'name'        => $this->name,
            'description' => $this->description,
            'created_at'  => $this->createdAt,
        ];
    }
}
