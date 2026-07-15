import { Component, computed } from '@angular/core';
import { Vflow } from 'ngx-vflow';
import { AccountLifecycleNodeData } from '../../models/node-types';
import { ConnectorNodeBase } from './connector-node.base';

@Component({
    selector: 'app-account-lifecycle-node',
    template: `
        <div class="node-card lifecycle-node" (mousedown)="selectThisNode($event)">
            <div class="node-header">
                <span class="badge badge-lifecycle">Lifecycle</span>
            </div>
            <div class="lifecycle-preview">{{ configuredOps() }} operations</div>
            <handle type="target" position="left" />
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
            .node-header { margin-bottom: 8px; }
            .badge {
                font-size: 10px; font-weight: 700; letter-spacing: 0.08em;
                padding: 2px 8px; border-radius: 4px; text-transform: uppercase;
            }
            .badge-lifecycle { background: #c2410c; color: #fff; }
            .lifecycle-preview { font-size: 12px; color: #fdba74; }
        `,
    ],
    imports: [Vflow],
})
export class AccountLifecycleNodeComponent extends ConnectorNodeBase<AccountLifecycleNodeData> {
    readonly configuredOps = computed(() => {
        const config = this.data()?.config;
        if (!config) return 0;
        return [
            config.createEndpoint,
            config.updateEndpoint,
            config.deleteEndpoint,
            config.enableEndpoint,
            config.disableEndpoint,
            config.unlockEndpoint,
            config.changePasswordEndpoint,
        ].filter((v) => v?.trim()).length;
    });
}
