import { Component, computed } from '@angular/core';
import { CustomNodeComponent, Vflow } from 'ngx-vflow';
import { AccountSchemaNodeData } from '../../models/node-types';

@Component({
    selector: 'app-account-schema-node',
    template: `
        <div class="node-card schema-node">
            <div class="node-header">
                <span class="badge badge-schema">Schema</span>
            </div>
            <div class="schema-preview">
                <div class="schema-line">id: {{ identityAttr() }}</div>
                <div class="schema-line">{{ attributeCount() }} attributes</div>
            </div>
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
            .badge-schema { background: #be185d; color: #fff; }
            .schema-line { font-size: 11px; color: #f9a8d4; }
        `,
    ],
    imports: [Vflow],
})
export class AccountSchemaNodeComponent extends CustomNodeComponent<AccountSchemaNodeData> {
    readonly identityAttr = computed(() => this.data()?.config.identityAttribute ?? 'identity');
    readonly attributeCount = computed(() => this.data()?.config.attributes.length ?? 0);
}
