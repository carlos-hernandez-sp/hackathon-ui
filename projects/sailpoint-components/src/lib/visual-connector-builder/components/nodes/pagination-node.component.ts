import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CustomNodeComponent, Vflow } from 'ngx-vflow';
import { PaginationNodeData } from '../../models/node-types';

@Component({
    selector: 'app-pagination-node',
    template: `
        <div class="node-card pagination-node">
            <div class="node-header">
                <span class="badge badge-pages">Pages</span>
            </div>
            <div class="pagination-preview">
                {{ strategy() }} · {{ pageSize() }}/page
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

            .badge-pages {
                background: #0d9488;
                color: #fff;
            }

            .pagination-preview {
                font-size: 12px;
                color: #5eead4;
                font-family: 'SF Mono', 'Fira Code', monospace;
            }
        `,
    ],
    imports: [Vflow],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginationNodeComponent extends CustomNodeComponent<PaginationNodeData> {
    strategy(): string {
        return this.data()?.config.strategy ?? 'offset';
    }

    pageSize(): number {
        return this.data()?.config.pageSize ?? 100;
    }
}
