import { WritableSignal } from '@angular/core';
import { Edge, Node, Point } from 'ngx-vflow';
import { ConnectorNodeData, ConnectorNodeType } from './node-types';

export interface StoredNode {
    id: string;
    nodeType: ConnectorNodeType;
    point: WritableSignal<Point>;
    data: WritableSignal<ConnectorNodeData>;
    selected: WritableSignal<boolean>;
}

export interface BuilderEdge {
    id: string;
    source: string;
    target: string;
}

export interface CanvasSnapshot {
    nodes: {
        id: string;
        nodeType: ConnectorNodeType;
        point: Point;
        data: ConnectorNodeData;
    }[];
    edges: BuilderEdge[];
}

export function toVflowEdges(edges: BuilderEdge[]): Edge[] {
    return edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
    }));
}

export type { Node, Edge, Point };
