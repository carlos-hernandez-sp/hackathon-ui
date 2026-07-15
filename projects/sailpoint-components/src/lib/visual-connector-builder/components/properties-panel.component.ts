import { Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AuthType, AttributeType } from '../../saas-connectivity-creator/saas-connectivity-creator.models';
import {
    AUTH_TYPE_LABELS,
    ConnectorNodeData,
    HttpMethod,
    PaginationStrategy,
} from '../models/node-types';
import { ConnectorBuilderStore } from '../services/connector-builder.store';
import { buildNodeForm, syncNodeFormToStore } from '../utils/properties-form.builder';

@Component({
    selector: 'app-properties-panel',
    templateUrl: './properties-panel.component.html',
    styles: [
        `
            .properties-panel { padding: 20px 16px; height: 100%; overflow-y: auto; }
            .panel-title {
                margin: 0 0 16px; font-size: 14px; font-weight: 600; color: #e2e8f0;
                text-transform: uppercase; letter-spacing: 0.06em;
            }
            .empty-state {
                display: flex; flex-direction: column; align-items: center; justify-content: center;
                padding: 40px 16px; color: #64748b; text-align: center;
            }
            .empty-state mat-icon { font-size: 40px; width: 40px; height: 40px; margin-bottom: 12px; opacity: 0.5; }
            .properties-form { display: flex; flex-direction: column; gap: 8px; }
            .full-width { width: 100%; }
            .section-label {
                font-size: 12px; font-weight: 600; color: #94a3b8; margin: 8px 0 4px;
                text-transform: uppercase; letter-spacing: 0.05em;
            }
            .header-row, .mapping-row, .attr-row { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
            .header-key, .header-value { flex: 1; }
            .arrow-icon { color: #818cf8; font-size: 18px; }
            .add-btn { margin-top: 8px; width: 100%; color: #a5b4fc; border-color: #475569; }
            .cmd-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 12px; }
            .cmd-grid mat-checkbox { font-size: 12px; }
            .hint { font-size: 11px; color: #64748b; margin: 0 0 8px; }
        `,
    ],
    imports: [
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        MatIconModule,
        MatCheckboxModule,
    ],
})
export class PropertiesPanelComponent {
    readonly store = inject(ConnectorBuilderStore);
    private readonly fb = inject(FormBuilder);
    private readonly destroyRef = inject(DestroyRef);
    private readonly formReset$ = new Subject<void>();

    readonly form = signal<FormGroup | null>(null);
    private activeNodeId: string | null = null;

    readonly httpMethods: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE'];
    readonly paginationStrategies: PaginationStrategy[] = ['offset', 'cursor'];
    readonly authTypes: AuthType[] = ['apiKey', 'oauth2', 'basicAuth', 'bearerToken', 'custom'];
    readonly authTypeLabels = AUTH_TYPE_LABELS;
    readonly attributeTypes: AttributeType[] = ['string', 'boolean', 'long', 'int'];

    constructor() {
        effect(() => {
            const node = this.store.selectedNode();
            if (node && node.id !== this.activeNodeId) {
                this.activeNodeId = node.id;
                this.formReset$.next();
                this.buildForm(node.id, node.data());
            } else if (!node) {
                this.activeNodeId = null;
                this.formReset$.next();
                this.form.set(null);
            }
        });
    }

    get headersArray(): FormArray { return this.form()!.get('headers') as FormArray; }
    get mappingsArray(): FormArray { return this.form()!.get('mappings') as FormArray; }
    get schemaAttributesArray(): FormArray { return this.form()!.get('attributes') as FormArray; }
    get entitlementAttributesArray(): FormArray { return this.form()!.get('attributes') as FormArray; }

    addHeader(): void { this.headersArray.push(this.fb.group({ key: [''], value: [''] })); }
    removeHeader(i: number): void { this.headersArray.removeAt(i); }
    addMapping(): void {
        this.mappingsArray.push(this.fb.group({ source: ['', Validators.required], target: ['', Validators.required] }));
    }
    removeMapping(i: number): void { this.mappingsArray.removeAt(i); }
    addSchemaAttribute(): void {
        this.schemaAttributesArray.push(this.fb.group({
            name: ['', Validators.required], type: ['string'], description: [''],
            multi: [false], entitlement: [false], managed: [false],
        }));
    }
    removeSchemaAttribute(i: number): void { this.schemaAttributesArray.removeAt(i); }
    addEntitlementAttribute(): void {
        this.entitlementAttributesArray.push(this.fb.group({ name: ['', Validators.required], description: [''] }));
    }
    removeEntitlementAttribute(i: number): void { this.entitlementAttributesArray.removeAt(i); }

    private buildForm(nodeId: string, data: ConnectorNodeData): void {
        const nextForm = buildNodeForm(this.fb, data);
        this.form.set(nextForm);
        nextForm.valueChanges
            .pipe(debounceTime(300), takeUntil(this.formReset$), takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                if (this.activeNodeId === nodeId) {
                    syncNodeFormToStore(this.store, nodeId, data.nodeType, nextForm);
                }
            });
    }
}
