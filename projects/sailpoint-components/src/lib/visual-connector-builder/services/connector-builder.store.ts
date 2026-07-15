import { computed, Injectable, signal } from '@angular/core';
import { NodeChange, Point } from 'ngx-vflow';
import { ApiRequestNodeComponent } from '../components/nodes/api-request-node.component';
import { DataTransformNodeComponent } from '../components/nodes/data-transform-node.component';
import { PaginationNodeComponent } from '../components/nodes/pagination-node.component';
import { BuilderEdge, StoredNode, toVflowEdges } from '../models/canvas-state';
import {
    ConnectorNodeData,
    ConnectorNodeType,
    createDefaultNodeData,
} from '../models/node-types';

const NODE_COMPONENT_MAP = {
    'api-request': ApiRequestNodeComponent,
    'data-transform': DataTransformNodeComponent,
    pagination: PaginationNodeComponent,
} as const;

@Injectable()
export class ConnectorBuilderStore {
    private nodeCounter = 0;

    readonly nodes = signal<StoredNode[]>([]);
    readonly edges = signal<BuilderEdge[]>([]);
    readonly selectedNodeId = signal<string | null>(null);

    readonly vflowNodes = computed(() =>
        this.nodes().map((node) => ({
            id: node.id,
            point: node.point,
            type: NODE_COMPONENT_MAP[node.nodeType],
            data: node.data,
            selected: node.selected,
        })),
    );

    readonly vflowEdges = computed(() => toVflowEdges(this.edges()));

    readonly hasNodes = computed(() => this.nodes().length > 0);

    readonly canExport = computed(() => {
        const apiNode = this.nodes().find((n) => n.nodeType === 'api-request');
        if (!apiNode) {
            return false;
        }
        const data = apiNode.data();
        return data.nodeType === 'api-request' && data.config.endpoint.trim().length > 0;
    });

    readonly selectedNode = computed(() => {
        const id = this.selectedNodeId();
        if (!id) {
            return null;
        }
        return this.nodes().find((n) => n.id === id) ?? null;
    });

    addNode(type: ConnectorNodeType, point: Point): string {
        this.nodeCounter += 1;
        const id = `${type}-${this.nodeCounter}`;
        const storedNode: StoredNode = {
            id,
            nodeType: type,
            point: signal({ ...point }),
            data: signal(createDefaultNodeData(type)),
            selected: signal(false),
        };

        this.nodes.update((nodes) => [...nodes, storedNode]);
        this.selectNode(id);
        return id;
    }

    addNodeAtDefaultPosition(type: ConnectorNodeType): string {
        const index = this.nodes().length;
        return this.addNode(type, { x: 120 + index * 40, y: 120 + index * 60 });
    }

    selectNode(id: string | null): void {
        this.selectedNodeId.set(id);
        this.nodes.update((nodes) =>
            nodes.map((node) => {
                const isSelected = node.id === id;
                node.selected.set(isSelected);
                return node;
            }),
        );
    }

    updateNodeData(id: string, data: ConnectorNodeData): void {
        this.nodes.update((nodes) =>
            nodes.map((node) => {
                if (node.id !== id) {
                    return node;
                }
                node.data.set(structuredClone(data));
                return node;
            }),
        );
    }

    addEdge(source: string, target: string): void {
        const edgeId = `${source}->${target}`;
        const exists = this.edges().some((e) => e.id === edgeId);
        if (exists || source === target) {
            return;
        }

        this.edges.update((edges) => [...edges, { id: edgeId, source, target }]);
    }

    removeEdge(edgeId: string): void {
        this.edges.update((edges) => edges.filter((e) => e.id !== edgeId));
    }

    removeSelectedNode(): void {
        const id = this.selectedNodeId();
        if (!id) {
            return;
        }
        this.removeNode(id);
    }

    removeNode(id: string): void {
        this.nodes.update((nodes) => nodes.filter((n) => n.id !== id));
        this.edges.update((edges) => edges.filter((e) => e.source !== id && e.target !== id));
        if (this.selectedNodeId() === id) {
            this.selectedNodeId.set(null);
        }
    }

    syncNodePosition(id: string, point: Point): void {
        const node = this.nodes().find((n) => n.id === id);
        if (node) {
            node.point.set({ ...point });
        }
    }

    handleNodeChanges(changes: NodeChange[]): void {
        for (const change of changes) {
            if (change.type === 'position') {
                this.syncNodePosition(change.id, change.point);
            }
            if (change.type === 'select') {
                if (change.selected) {
                    this.selectNode(change.id);
                } else if (this.selectedNodeId() === change.id) {
                    this.selectNode(null);
                }
            }
            if (change.type === 'remove') {
                this.removeNode(change.id);
            }
        }
    }

    getSnapshot() {
        return {
            nodes: this.nodes().map((node) => ({
                id: node.id,
                nodeType: node.nodeType,
                point: node.point(),
                data: structuredClone(node.data()),
            })),
            edges: [...this.edges()],
        };
    }
}
