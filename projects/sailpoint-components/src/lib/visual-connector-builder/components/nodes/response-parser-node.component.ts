import { Component, computed } from '@angular/core';
import { Vflow } from 'ngx-vflow';
import { ResponseParserNodeData } from '../../models/node-types';
import { ConnectorNodeBase } from './connector-node.base';

@Component({
    selector: 'app-response-parser-node',
    template: `
        <div class="node-card parser-node" (mousedown)="selectThisNode($event)">
            <div class="node-header">
                <span class="badge badge-parser">Parser</span>
            </div>
            <div class="parser-line">records: {{ recordsPath() }}</div>
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
            .badge-parser { background: #0369a1; color: #fff; }
            .parser-line {
                font-size: 11px; font-family: 'SF Mono', monospace; color: #7dd3fc;
            }
        `,
    ],
    imports: [Vflow],
})
export class ResponseParserNodeComponent extends ConnectorNodeBase<ResponseParserNodeData> {
    readonly recordsPath = computed(() => {
        const path = this.data()?.config.recordsPath ?? 'data';
        return path.split(',')[0] || 'data';
    });
}
