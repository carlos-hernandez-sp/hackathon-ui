import { computed, Injectable, signal, WritableSignal } from '@angular/core';
import { Edge, Node, NodeChange, Point } from 'ngx-vflow';
import { ApiRequestNodeComponent } from '../components/nodes/api-request-node.component';
import { AuthenticationNodeComponent } from '../components/nodes/authentication-node.component';
import { AccountLifecycleNodeComponent } from '../components/nodes/account-lifecycle-node.component';
import { AccountSchemaNodeComponent } from '../components/nodes/account-schema-node.component';
import { CommandsNodeComponent } from '../components/nodes/commands-node.component';
import { DataTransformNodeComponent } from '../components/nodes/data-transform-node.component';
import { EntitlementsNodeComponent } from '../components/nodes/entitlements-node.component';
import { PaginationNodeComponent } from '../components/nodes/pagination-node.component';
import { ResponseParserNodeComponent } from '../components/nodes/response-parser-node.component';
import { StatefulAggregationNodeComponent } from '../components/nodes/stateful-aggregation-node.component';
import {
    ConnectorNodeData,
    ConnectorNodeType,
    createDefaultNodeData,
} from '../models/node-types';

const NODE_COMPONENT_MAP = {
    authentication: AuthenticationNodeComponent,
    'api-request': ApiRequestNodeComponent,
    'response-parser': ResponseParserNodeComponent,
    pagination: PaginationNodeComponent,
    'data-transform': DataTransformNodeComponent,
    'account-schema': AccountSchemaNodeComponent,
    commands: CommandsNodeComponent,
    entitlements: EntitlementsNodeComponent,
    'account-lifecycle': AccountLifecycleNodeComponent,
    'stateful-aggregation': StatefulAggregationNodeComponent,
} as const;

function nodeDataSignal(node: Node): WritableSignal<ConnectorNodeData> | undefined {
    return 'data' in node
        ? (node.data as WritableSignal<ConnectorNodeData> | undefined)
        : undefined;
}

@Injectable()
export class ConnectorBuilderStore {
    private nodeCounter = 0;

    /** Stable ngx-vflow node references — never recreate existing entries on add. */
    readonly vflowNodes = signal<Node[]>([]);
    readonly vflowEdges = signal<Edge[]>([]);
    readonly selectedNodeId = signal<string | null>(null);

    readonly hasNodes = computed(() => this.vflowNodes().length > 0);

    readonly canExport = computed(() => this.vflowNodes().length > 0);

    readonly selectedNode = computed(() => {
        const id = this.selectedNodeId();
        if (!id) {
            return null;
        }
        const node = this.vflowNodes().find((n) => n.id === id);
        const dataSignal = node ? nodeDataSignal(node) : undefined;
        if (!dataSignal) {
            return null;
        }
        const data = dataSignal();
        return {
            id,
            nodeType: data.nodeType,
            data: dataSignal,
        };
    });

    addNode(type: ConnectorNodeType, point: Point): string {
        this.nodeCounter += 1;
        const id = `${type}-${this.nodeCounter}`;

        const newNode = {
            id,
            point: signal({ ...point }),
            type: NODE_COMPONENT_MAP[type],
            data: signal(createDefaultNodeData(type)),
            selected: signal(false),
        } as Node;

        this.vflowNodes.update((nodes) => [...nodes, newNode]);
        this.selectNode(id);
        return id;
    }

    addNodeAtDefaultPosition(type: ConnectorNodeType): string {
        const index = this.vflowNodes().length;
        return this.addNode(type, { x: 120 + index * 40, y: 120 + index * 60 });
    }

    selectNode(id: string | null): void {
        this.selectedNodeId.set(id);
        for (const node of this.vflowNodes()) {
            node.selected?.set(node.id === id);
        }
    }

    updateNodeData(id: string, data: ConnectorNodeData): void {
        const node = this.vflowNodes().find((n) => n.id === id);
        const dataSignal = node ? nodeDataSignal(node) : undefined;
        if (dataSignal) {
            dataSignal.set(structuredClone(data));
        }
    }

    addEdge(source: string, target: string): void {
        if (source === target) {
            return;
        }

        const edgeId = `${source}->${target}`;
        const exists = this.vflowEdges().some((e) => e.id === edgeId);
        if (exists) {
            return;
        }

        this.vflowEdges.update((edges) => [
            ...edges,
            { id: edgeId, source, target },
        ]);
    }

    removeSelectedNode(): void {
        const id = this.selectedNodeId();
        if (!id) {
            return;
        }
        this.removeNode(id);
    }

    removeNode(id: string): void {
        this.vflowNodes.update((nodes) => nodes.filter((n) => n.id !== id));
        this.vflowEdges.update((edges) =>
            edges.filter((e) => e.source !== id && e.target !== id),
        );
        if (this.selectedNodeId() === id) {
            this.selectedNodeId.set(null);
        }
    }

    syncNodePosition(id: string, point: Point): void {
        const node = this.vflowNodes().find((n) => n.id === id);
        node?.point.set({ ...point });
    }

    /** Only sync position/selection from ngx-vflow — ignore spurious remove events. */
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
        }
    }

    getSnapshot() {
        return {
            nodes: this.vflowNodes().map((node) => {
                const data = nodeDataSignal(node)?.() ?? createDefaultNodeData('api-request');
                return {
                    id: node.id,
                    nodeType: data.nodeType,
                    point: node.point(),
                    data: structuredClone(data),
                };
            }),
            edges: this.vflowEdges().map((edge) => ({
                id: edge.id,
                source: edge.source,
                target: edge.target,
            })),
        };
    }
}
