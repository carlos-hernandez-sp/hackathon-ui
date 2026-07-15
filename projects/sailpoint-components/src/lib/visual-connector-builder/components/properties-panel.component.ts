import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    effect,
    inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
    ApiRequestNodeData,
    ConnectorNodeData,
    DataTransformNodeData,
    HttpMethod,
    PaginationNodeData,
    PaginationStrategy,
} from '../models/node-types';
import { ConnectorBuilderStore } from '../services/connector-builder.store';

@Component({
    selector: 'app-properties-panel',
    template: `
        <div class="properties-panel">
            <h3 class="panel-title">Properties</h3>

            @if (!store.selectedNode()) {
                <div class="empty-state">
                    <mat-icon>touch_app</mat-icon>
                    <p>Select a node to configure.</p>
                </div>
            } @else if (form) {
                <form [formGroup]="form" class="properties-form">
                    @switch (store.selectedNode()!.nodeType) {
                        @case ('api-request') {
                            <mat-form-field appearance="outline" class="full-width">
                                <mat-label>HTTP Method</mat-label>
                                <mat-select formControlName="method">
                                    @for (method of httpMethods; track method) {
                                        <mat-option [value]="method">{{ method }}</mat-option>
                                    }
                                </mat-select>
                            </mat-form-field>

                            <mat-form-field appearance="outline" class="full-width">
                                <mat-label>Endpoint URL</mat-label>
                                <input matInput formControlName="endpoint" placeholder="https://api.example.com/users" />
                            </mat-form-field>

                            <div class="section-label">Headers</div>
                            <div formArrayName="headers">
                                @for (header of headersArray.controls; track $index; let i = $index) {
                                    <div [formGroupName]="i" class="header-row">
                                        <mat-form-field appearance="outline" class="header-key">
                                            <mat-label>Key</mat-label>
                                            <input matInput formControlName="key" />
                                        </mat-form-field>
                                        <mat-form-field appearance="outline" class="header-value">
                                            <mat-label>Value</mat-label>
                                            <input matInput formControlName="value" />
                                        </mat-form-field>
                                        <button mat-icon-button type="button" (click)="removeHeader(i)">
                                            <mat-icon>close</mat-icon>
                                        </button>
                                    </div>
                                }
                            </div>
                            <button mat-stroked-button type="button" class="add-btn" (click)="addHeader()">
                                <mat-icon>add</mat-icon> Add Header
                            </button>
                        }

                        @case ('data-transform') {
                            <div class="section-label">Attribute Mappings</div>
                            <div formArrayName="mappings">
                                @for (mapping of mappingsArray.controls; track $index; let i = $index) {
                                    <div [formGroupName]="i" class="mapping-row">
                                        <mat-form-field appearance="outline">
                                            <mat-label>Source</mat-label>
                                            <input matInput formControlName="source" />
                                        </mat-form-field>
                                        <mat-icon class="arrow-icon">arrow_forward</mat-icon>
                                        <mat-form-field appearance="outline">
                                            <mat-label>Target</mat-label>
                                            <input matInput formControlName="target" />
                                        </mat-form-field>
                                        <button mat-icon-button type="button" (click)="removeMapping(i)">
                                            <mat-icon>close</mat-icon>
                                        </button>
                                    </div>
                                }
                            </div>
                            <button mat-stroked-button type="button" class="add-btn" (click)="addMapping()">
                                <mat-icon>add</mat-icon> Add Mapping
                            </button>
                        }

                        @case ('pagination') {
                            <mat-form-field appearance="outline" class="full-width">
                                <mat-label>Strategy</mat-label>
                                <mat-select formControlName="strategy">
                                    @for (strategy of paginationStrategies; track strategy) {
                                        <mat-option [value]="strategy">{{ strategy }}</mat-option>
                                    }
                                </mat-select>
                            </mat-form-field>

                            <mat-form-field appearance="outline" class="full-width">
                                <mat-label>Page Size</mat-label>
                                <input matInput type="number" formControlName="pageSize" min="1" />
                            </mat-form-field>
                        }
                    }
                </form>
            }
        </div>
    `,
    styles: [
        `
            .properties-panel {
                padding: 20px 16px;
                height: 100%;
                overflow-y: auto;
            }

            .panel-title {
                margin: 0 0 16px;
                font-size: 14px;
                font-weight: 600;
                color: #e2e8f0;
                text-transform: uppercase;
                letter-spacing: 0.06em;
            }

            .empty-state {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 40px 16px;
                color: #64748b;
                text-align: center;
            }

            .empty-state mat-icon {
                font-size: 40px;
                width: 40px;
                height: 40px;
                margin-bottom: 12px;
                opacity: 0.5;
            }

            .properties-form {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .full-width {
                width: 100%;
            }

            .section-label {
                font-size: 12px;
                font-weight: 600;
                color: #94a3b8;
                margin: 8px 0 4px;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }

            .header-row,
            .mapping-row {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 4px;
            }

            .header-key,
            .header-value {
                flex: 1;
            }

            .arrow-icon {
                color: #818cf8;
                font-size: 18px;
            }

            .add-btn {
                margin-top: 8px;
                width: 100%;
                color: #a5b4fc;
                border-color: #475569;
            }
        `,
    ],
    imports: [
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        MatIconModule,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertiesPanelComponent {
    readonly store = inject(ConnectorBuilderStore);
    private readonly fb = inject(FormBuilder);
    private readonly destroyRef = inject(DestroyRef);

    form: FormGroup | null = null;
    private activeNodeId: string | null = null;

    readonly httpMethods: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE'];
    readonly paginationStrategies: PaginationStrategy[] = ['offset', 'cursor'];

    constructor() {
        effect(() => {
            const node = this.store.selectedNode();
            if (node && node.id !== this.activeNodeId) {
                this.activeNodeId = node.id;
                this.buildForm(node.id, node.data());
            } else if (!node) {
                this.activeNodeId = null;
                this.form = null;
            }
        });
    }

    get headersArray(): FormArray {
        return this.form!.get('headers') as FormArray;
    }

    get mappingsArray(): FormArray {
        return this.form!.get('mappings') as FormArray;
    }

    addHeader(): void {
        this.headersArray.push(
            this.fb.group({ key: [''], value: [''] }),
        );
    }

    removeHeader(index: number): void {
        this.headersArray.removeAt(index);
    }

    addMapping(): void {
        this.mappingsArray.push(
            this.fb.group({ source: ['', Validators.required], target: ['', Validators.required] }),
        );
    }

    removeMapping(index: number): void {
        this.mappingsArray.removeAt(index);
    }

    private buildForm(nodeId: string, data: ConnectorNodeData): void {
        switch (data.nodeType) {
            case 'api-request':
                this.form = this.fb.group({
                    method: [data.config.method],
                    endpoint: [data.config.endpoint],
                    headers: this.fb.array(
                        data.config.headers.map((h) =>
                            this.fb.group({ key: [h.key], value: [h.value] }),
                        ),
                    ),
                });
                break;
            case 'data-transform':
                this.form = this.fb.group({
                    mappings: this.fb.array(
                        data.config.mappings.map((m) =>
                            this.fb.group({
                                source: [m.source, Validators.required],
                                target: [m.target, Validators.required],
                            }),
                        ),
                    ),
                });
                break;
            case 'pagination':
                this.form = this.fb.group({
                    strategy: [data.config.strategy],
                    pageSize: [data.config.pageSize, [Validators.required, Validators.min(1)]],
                });
                break;
        }

        this.form!.valueChanges
            .pipe(debounceTime(150), takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                this.syncFormToStore(nodeId);
            });
    }

    private syncFormToStore(nodeId: string): void {
        if (!this.form) {
            return;
        }

        const node = this.store.selectedNode();
        if (!node) {
            return;
        }

        const value = this.form.getRawValue();

        switch (node.nodeType) {
            case 'api-request': {
                const updated: ApiRequestNodeData = {
                    nodeType: 'api-request',
                    config: {
                        method: value.method,
                        endpoint: value.endpoint ?? '',
                        headers: (value.headers ?? []).filter(
                            (h: { key: string; value: string }) => h.key || h.value,
                        ),
                    },
                };
                this.store.updateNodeData(nodeId, updated);
                break;
            }
            case 'data-transform': {
                const updated: DataTransformNodeData = {
                    nodeType: 'data-transform',
                    config: {
                        mappings: (value.mappings ?? []).filter(
                            (m: { source: string; target: string }) => m.source && m.target,
                        ),
                    },
                };
                this.store.updateNodeData(nodeId, updated);
                break;
            }
            case 'pagination': {
                const updated: PaginationNodeData = {
                    nodeType: 'pagination',
                    config: {
                        strategy: value.strategy,
                        pageSize: Number(value.pageSize) || 100,
                    },
                };
                this.store.updateNodeData(nodeId, updated);
                break;
            }
        }
    }
}
