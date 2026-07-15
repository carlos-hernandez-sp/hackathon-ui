import { Component, computed } from '@angular/core';
import { Vflow } from 'ngx-vflow';
import { EntitlementsNodeData, truncateEndpoint } from '../../models/node-types';
import { ConnectorNodeBase } from './connector-node.base';

@Component({
    selector: 'app-entitlements-node',
    template: `
        <div class="node-card ent-node" (mousedown)="selectThisNode($event)">
            <div class="node-header">
                <span class="badge badge-ent">Entitlements</span>
                <span class="method-pill">{{ method() }}</span>
            </div>
            <div class="ent-endpoint">{{ endpointPreview() }}</div>
            <handle type="target" position="left" />
            <handle type="source" position="right" />
        </div>
    `,
    styles: [
        `
            .node-card {
                min-width: 200px; max-width: 240px; padding: 12px 14px; border-radius: 10px;
                border: 1px solid #334155;
                background: linear-gradient(145deg, #1e293b 0%, #0f172a 100%);
                color: #e2e8f0; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
                font-family: 'Poppins', sans-serif;
            }
            .node-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
            .badge {
                font-size: 10px; font-weight: 700; letter-spacing: 0.08em;
                padding: 2px 8px; border-radius: 4px; text-transform: uppercase;
            }
            .badge-ent { background: #a21caf; color: #fff; }
            .method-pill {
                font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 999px;
                background: rgba(34, 197, 94, 0.2); color: #4ade80;
            }
            .ent-endpoint { font-size: 12px; color: #e879f9; word-break: break-all; }
        `,
    ],
    imports: [Vflow],
})
export class EntitlementsNodeComponent extends ConnectorNodeBase<EntitlementsNodeData> {
    readonly method = computed(() => this.data()?.config.method ?? 'GET');
    readonly endpointPreview = computed(() => truncateEndpoint(this.data()?.config.endpoint ?? '/groups'));
}
