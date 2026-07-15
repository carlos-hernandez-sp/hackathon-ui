import { Component, computed } from '@angular/core';
import { CustomNodeComponent, Vflow } from 'ngx-vflow';
import { StatefulAggregationNodeData } from '../../models/node-types';

@Component({
    selector: 'app-stateful-aggregation-node',
    template: `
        <div class="node-card stateful-node">
            <div class="node-header">
                <span class="badge badge-stateful">Stateful</span>
                <span class="status-pill" [class.enabled]="enabled()">{{ enabled() ? 'ON' : 'OFF' }}</span>
            </div>
            <div class="stateful-preview">field: {{ stateField() }}</div>
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
            .node-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
            .badge {
                font-size: 10px; font-weight: 700; letter-spacing: 0.08em;
                padding: 2px 8px; border-radius: 4px; text-transform: uppercase;
            }
            .badge-stateful { background: #4c1d95; color: #fff; }
            .status-pill {
                font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 999px;
                background: rgba(100, 116, 139, 0.3); color: #94a3b8;
            }
            .status-pill.enabled { background: rgba(34, 197, 94, 0.2); color: #4ade80; }
            .stateful-preview { font-size: 12px; color: #c4b5fd; font-family: monospace; }
        `,
    ],
    imports: [Vflow],
})
export class StatefulAggregationNodeComponent extends CustomNodeComponent<StatefulAggregationNodeData> {
    readonly enabled = computed(() => this.data()?.config.enabled ?? false);
    readonly stateField = computed(() => this.data()?.config.stateField ?? 'updatedAt');
}
