import { Component, computed } from '@angular/core';
import { CustomNodeComponent, Vflow } from 'ngx-vflow';
import { CommandsNodeData } from '../../models/node-types';

@Component({
    selector: 'app-commands-node',
    template: `
        <div class="node-card commands-node">
            <div class="node-header">
                <span class="badge badge-cmd">Commands</span>
            </div>
            <div class="cmd-preview">{{ enabledCount() }} std commands</div>
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
            .node-header { margin-bottom: 8px; }
            .badge {
                font-size: 10px; font-weight: 700; letter-spacing: 0.08em;
                padding: 2px 8px; border-radius: 4px; text-transform: uppercase;
            }
            .badge-cmd { background: #15803d; color: #fff; }
            .cmd-preview { font-size: 12px; color: #86efac; }
        `,
    ],
    imports: [Vflow],
})
export class CommandsNodeComponent extends CustomNodeComponent<CommandsNodeData> {
    readonly enabledCount = computed(() => {
        const config = this.data()?.config;
        if (!config) return 0;
        return Object.values(config).filter(Boolean).length;
    });
}
