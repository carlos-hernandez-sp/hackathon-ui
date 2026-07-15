import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ConnectorNodeType } from '../models/node-types';
import { ConnectorBuilderStore } from '../services/connector-builder.store';

interface PaletteItem {
    type: ConnectorNodeType;
    label: string;
    description: string;
    icon: string;
}

@Component({
    selector: 'app-node-palette',
    host: { class: 'node-palette-host' },
    template: `
        <div class="palette">
            <h3 class="palette-title">Node Palette</h3>
            <p class="palette-subtitle">Click or drag nodes onto the canvas</p>

            @for (item of paletteItems; track item.type) {
                <mat-card
                    class="palette-card"
                    draggable="true"
                    (click)="addNode(item.type)"
                    (dragstart)="onDragStart($event, item.type)"
                >
                    <div class="card-content">
                        <mat-icon class="card-icon">{{ item.icon }}</mat-icon>
                        <div>
                            <div class="card-label">{{ item.label }}</div>
                            <div class="card-description">{{ item.description }}</div>
                        </div>
                    </div>
                </mat-card>
            }
        </div>
    `,
    styles: [
        `
            :host {
                display: block;
                height: 100%;
                min-height: 0;
                background: #1e293b;
            }

            .palette {
                padding: 20px 16px;
                height: 100%;
                overflow-y: auto;
            }

            .palette-title {
                margin: 0 0 4px;
                font-size: 14px;
                font-weight: 600;
                color: #e2e8f0;
                text-transform: uppercase;
                letter-spacing: 0.06em;
            }

            .palette-subtitle {
                margin: 0 0 16px;
                font-size: 12px;
                color: #64748b;
            }

            .palette-card {
                margin-bottom: 12px;
                cursor: grab;
                background: #0f172a !important;
                border: 1px solid #334155;
                border-radius: 10px;
                box-shadow: none !important;
                transition: border-color 0.2s, transform 0.15s, box-shadow 0.2s;
            }

            .palette-card:hover {
                border-color: #6366f1;
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
            }

            .card-content {
                display: flex;
                align-items: flex-start;
                gap: 12px;
                padding: 4px;
            }

            .card-icon {
                color: #818cf8;
                font-size: 24px;
                width: 24px;
                height: 24px;
            }

            .card-label {
                font-size: 13px;
                font-weight: 600;
                color: #f1f5f9;
            }

            .card-description {
                font-size: 11px;
                color: #64748b;
                margin-top: 2px;
            }
        `,
    ],
    imports: [MatCardModule, MatIconModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NodePaletteComponent {
    private readonly store = inject(ConnectorBuilderStore);

    readonly paletteItems: PaletteItem[] = [
        { type: 'authentication', label: 'Authentication', description: 'API key, OAuth2, basic, bearer', icon: 'vpn_key' },
        { type: 'api-request', label: 'API Request', description: 'HTTP call to external API', icon: 'public' },
        { type: 'response-parser', label: 'Response Parser', description: 'Extract records from JSON', icon: 'data_object' },
        { type: 'pagination', label: 'Pagination', description: 'Paginate API responses', icon: 'layers' },
        { type: 'data-transform', label: 'Data Transform', description: 'Map source attributes', icon: 'sync' },
        { type: 'account-schema', label: 'Account Schema', description: 'Account attribute definitions', icon: 'table_chart' },
        { type: 'commands', label: 'STD Commands', description: 'Enable connector operations', icon: 'terminal' },
        { type: 'entitlements', label: 'Entitlements', description: 'Groups and entitlement schema', icon: 'groups' },
        { type: 'account-lifecycle', label: 'Account Lifecycle', description: 'Create, update, delete endpoints', icon: 'autorenew' },
        { type: 'stateful-aggregation', label: 'Stateful Aggregation', description: 'Incremental account sync', icon: 'history' },
    ];

    addNode(type: ConnectorNodeType): void {
        this.store.addNodeAtDefaultPosition(type);
    }

    onDragStart(event: DragEvent, type: ConnectorNodeType): void {
        event.dataTransfer?.setData('application/connector-node', type);
        if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = 'copy';
        }
    }
}
