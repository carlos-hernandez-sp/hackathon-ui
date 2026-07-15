import { Component, computed } from '@angular/core';
import { Vflow } from 'ngx-vflow';
import { AUTH_TYPE_LABELS, AuthenticationNodeData } from '../../models/node-types';
import { ConnectorNodeBase } from './connector-node.base';

@Component({
    selector: 'app-authentication-node',
    template: `
        <div class="node-card auth-node" (mousedown)="selectThisNode($event)">
            <div class="node-header">
                <span class="badge badge-auth">Auth</span>
                <span class="auth-type">{{ authLabel() }}</span>
            </div>
            <div class="auth-url">{{ baseUrl() }}</div>
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
            .node-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
            .badge {
                font-size: 10px; font-weight: 700; letter-spacing: 0.08em;
                padding: 2px 8px; border-radius: 4px; text-transform: uppercase;
            }
            .badge-auth { background: #b45309; color: #fff; }
            .auth-type { font-size: 11px; font-weight: 600; color: #fbbf24; }
            .auth-url { font-size: 12px; color: #94a3b8; word-break: break-all; }
        `,
    ],
    imports: [Vflow],
})
export class AuthenticationNodeComponent extends ConnectorNodeBase<AuthenticationNodeData> {
    readonly authLabel = computed(() => AUTH_TYPE_LABELS[this.data()?.config.authType ?? 'apiKey']);
    readonly baseUrl = computed(() => this.data()?.config.apiUrl || 'https://api.example.com');
}
