import { Component, computed } from '@angular/core';
import { Vflow } from 'ngx-vflow';
import { DataTransformNodeData } from '../../models/node-types';
import { ConnectorNodeBase } from './connector-node.base';

@Component({
    selector: 'app-data-transform-node',
    template: `
        <div class="node-card transform-node" (mousedown)="selectThisNode($event)">
            <div class="node-header">
                <span class="badge badge-transform">Transform</span>
            </div>
            <div class="mapping-preview">
                @for (mapping of previewMappings(); track mapping) {
                    <div class="mapping-line">{{ mapping }}</div>
                }
            </div>
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

            .badge-transform {
                background: #7c3aed;
                color: #fff;
            }

            .mapping-preview {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .mapping-line {
                font-size: 11px;
                font-family: 'SF Mono', 'Fira Code', monospace;
                color: #c4b5fd;
                background: rgba(124, 58, 237, 0.12);
                padding: 3px 8px;
                border-radius: 4px;
            }
        `,
    ],
    imports: [Vflow],
})
export class DataTransformNodeComponent extends ConnectorNodeBase<DataTransformNodeData> {
    readonly previewMappings = computed(() => {
        const mappings = this.data()?.config.mappings ?? [];
        const preview = mappings.slice(0, 3).map((m) => `${m.source} → ${m.target}`);
        if (mappings.length > 3) {
            preview.push(`+${mappings.length - 3} more`);
        }
        return preview.length > 0 ? preview : ['id → identity'];
    });
}
