import { Component, computed } from '@angular/core';
import { Vflow } from 'ngx-vflow';
import { ApiRequestNodeData, truncateEndpoint } from '../../models/node-types';
import { ConnectorNodeBase } from './connector-node.base';

@Component({
    selector: 'app-api-request-node',
    template: `
        <div class="node-card api-node" (mousedown)="selectThisNode($event)">
            <div class="node-header">
                <span class="badge badge-api">API</span>
                <span class="method-pill" [class]="methodClass()">
                    {{ method() }}
                </span>
            </div>
            <div class="node-endpoint">{{ endpointPreview() }}</div>
            <handle type="target" position="left" />
            <handle type="source" position="right" />
        </div>
    `,
    styles: [
        `
            .node-card {
                min-width: 200px;
                max-width: 240px;
                padding: 12px 14px;
                border-radius: 10px;
                border: 1px solid #334155;
                background: linear-gradient(145deg, #1e293b 0%, #0f172a 100%);
                color: #e2e8f0;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
                font-family: 'Poppins', sans-serif;
            }

            .node-header {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 8px;
            }

            .badge {
                font-size: 10px;
                font-weight: 700;
                letter-spacing: 0.08em;
                padding: 2px 8px;
                border-radius: 4px;
                text-transform: uppercase;
            }

            .badge-api {
                background: #4f46e5;
                color: #fff;
            }

            .method-pill {
                font-size: 11px;
                font-weight: 600;
                padding: 2px 8px;
                border-radius: 999px;
            }

            .method-get {
                background: rgba(34, 197, 94, 0.2);
                color: #4ade80;
            }

            .method-post {
                background: rgba(59, 130, 246, 0.2);
                color: #60a5fa;
            }

            .method-put {
                background: rgba(245, 158, 11, 0.2);
                color: #fbbf24;
            }

            .method-delete {
                background: rgba(239, 68, 68, 0.2);
                color: #f87171;
            }

            .node-endpoint {
                font-size: 12px;
                color: #94a3b8;
                word-break: break-all;
            }
        `,
    ],
    imports: [Vflow],
})
export class ApiRequestNodeComponent extends ConnectorNodeBase<ApiRequestNodeData> {
    readonly method = computed(() => this.data()?.config.method ?? 'GET');

    readonly methodClass = computed(() => `method-${this.method().toLowerCase()}`);

    readonly endpointPreview = computed(() =>
        truncateEndpoint(this.data()?.config.endpoint ?? ''),
    );
}
